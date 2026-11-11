import { Router } from 'express'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { supabase } from '../supabase.js'
import { batasi } from '../limiter.js'
import { STATUS_PUBLIK, bolehTransisi, laporanPublik } from '../laporan.js'
import { akhirGaransi, denganGaransi, statusGaransi, telat } from '../garansi.js'
import { bacaExif } from '../exif.js'
import { asalFoto, periksaFoto } from '../cekFoto.js'
import { ambilSemua, raporSemua } from '../raporData.js'
import { csv, geojson } from '../ekspor.js'
import { ambilPantauan, ambilPengaturan, kirimPengingat } from '../kirimPengingat.js'
import { PENGATURAN_AWAL } from '../pengingat.js'
import { COOKIE_PETUGAS, buatSesiPetugas, cocokSandi, petugasDariSesi, wajibPetugas } from '../petugas.js'
import { bacaCookie, hash, opsiCookie } from '../sesi.js'
import { HttpError, pilihan, teks } from '../validasi.js'
import {
  JENIS, PESAN_STATUS, catatRiwayat, folderUpload, kabarkan, laporanDekat, simpanFoto, tenggatBaru, upload,
} from './laporan.js'

const HARI_MS = 86_400_000
const ZONA = 'Asia/Jakarta'
const SANDI_PALSU = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(128)
const AKTIF = ['diverifikasi', 'diteruskan', 'dikerjakan']

const PILIH = [
  'id', 'kode', 'proyek_id', 'deskripsi', 'jenis', 'keparahan', 'foto_url', 'foto_urls', 'foto_sesudah_url', 'cek_foto',
  'cek_sesudah', 'status', 'lat', 'lng', 'dibuat_pada', 'tenggat_pada', 'selesai_pada', 'ditandai_selesai_pada',
  'dikonfirmasi_pada', 'buka_lagi_count', 'catatan_admin', 'alasan_tolak', 'diverifikasi_oleh', 'pelapor_email',
  'proyek:proyek_id(id,slug,ruas,lokasi,tahun_anggaran,selesai_pada,masa_pemeliharaan_bulan,kontraktor:kontraktor_id(nama))',
].join(',')

const TAB = {
  semua: null,
  verifikasi: ['masuk', 'perlu_foto_ulang'],
  diteruskan: ['diverifikasi', 'diteruskan'],
  dikerjakan: ['dikerjakan'],
  telat: AKTIF,
}

const GRUP_PETA = {
  masuk: 'belum',
  perlu_foto_ulang: 'belum',
  diverifikasi: 'belum',
  diteruskan: 'belum',
  dikerjakan: 'dikerjakan',
  selesai: 'selesai',
}

const tanggalWib = (waktu) => new Date(waktu).toLocaleDateString('sv', { timeZone: ZONA })
const bulanWib = (waktu) => tanggalWib(waktu).slice(0, 7)

function ditanggungKontraktor(garansi) {
  return garansi === 'ok' || garansi === 'warn'
}

function bentuk(row, sekarang = new Date()) {
  const { proyek, pelapor_email, ...isi } = laporanPublik(row)
  const garansi = statusGaransi(proyek, sekarang)
  return {
    ...isi,
    label_jenis: JENIS[row.jenis] ?? null,
    ada_email_pelapor: Boolean(row.pelapor_email),
    proyek: proyek
      ? {
          slug: proyek.slug,
          ruas: proyek.ruas,
          kecamatan: proyek.lokasi,
          tahun: proyek.tahun_anggaran,
          kontraktor: proyek.kontraktor?.nama ?? null,
        }
      : null,
    garansi,
    akhir_garansi: akhirGaransi(proyek)?.toISOString().slice(0, 10) ?? null,
    telat: AKTIF.includes(row.status) && telat(row, sekarang),
    penanggung_jawab: ditanggungKontraktor(garansi) ? proyek?.kontraktor?.nama ?? 'Kontraktor' : 'Dinas PU',
  }
}

function bacaBulan(nilai) {
  if (!nilai) return null
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(nilai))) throw new HttpError(400, 'VALIDASI', 'Format bulan harus YYYY-MM')
  return String(nilai)
}

async function semuaLaporan(kolom = PILIH) {
  const { data, error } = await supabase
    .from('laporan')
    .select(kolom)
    .order('dibuat_pada', { ascending: false })
    .limit(5000)
  if (error) throw error
  return data ?? []
}

async function ambil(kode) {
  const { data, error } = await supabase.from('laporan').select(PILIH).eq('kode', kode).maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Laporan tidak ditemukan')
  return data
}

async function ubahStatus(laporan, ubah) {
  const { data, error } = await supabase
    .from('laporan')
    .update(ubah)
    .eq('id', laporan.id)
    .eq('status', laporan.status)
    .select(PILIH)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(409, 'SUDAH_BERUBAH', 'Laporan ini baru saja diubah petugas lain. Muat ulang halaman.')
  return data
}

function pastikanTransisi(laporan, ke) {
  if (!bolehTransisi(laporan.status, ke)) {
    throw new HttpError(409, 'TRANSISI_TIDAK_VALID', `Laporan berstatus ${laporan.status} tidak bisa diubah ke ${ke}`)
  }
}

function catatanOpsional(nilai) {
  return nilai ? teks(nilai, 'Catatan', { min: 0, max: 1000 }) || null : null
}

const router = Router()

router.post('/masuk', batasi({ maks: 10, jendelaMs: 15 * 60_000 }), async (req, res) => {
  const akun = teks(req.body?.akun, 'NIP atau email', { max: 254 }).toLowerCase()
  const sandi = teks(req.body?.sandi, 'Kata sandi', { max: 200 })
  const kolom = akun.includes('@') ? 'email' : 'nip'

  const { data, error } = await supabase
    .from('petugas')
    .select('id,nama,email,nip,sandi_hash,aktif')
    .eq(kolom, akun)
    .maybeSingle()
  if (error) throw error

  const cocok = cocokSandi(sandi, data?.sandi_hash ?? SANDI_PALSU)
  if (!data || !cocok || !data.aktif) {
    throw new HttpError(401, 'TIDAK_AUTORISASI', 'NIP/email atau kata sandi salah')
  }

  await buatSesiPetugas(res, data.id, req.body?.ingat === true)
  res.json({ data: { id: data.id, nama: data.nama, email: data.email, nip: data.nip } })
})

router.post('/keluar', async (req, res) => {
  const token = bacaCookie(req, COOKIE_PETUGAS)
  if (token) {
    const { error } = await supabase.from('sesi_petugas').delete().eq('token_hash', hash(token))
    if (error) throw error
  }
  res.clearCookie(COOKIE_PETUGAS, { ...opsiCookie(), maxAge: undefined })
  res.json({ data: { keluar: true } })
})

router.get('/saya', async (req, res) => {
  const petugas = await petugasDariSesi(req)
  if (!petugas) throw new HttpError(401, 'TIDAK_AUTORISASI', 'Belum masuk')
  res.json({ data: petugas })
})

router.use(wajibPetugas)

router.get('/ringkasan', async (_req, res) => {
  const sekarang = new Date()
  const hariIni = tanggalWib(sekarang)
  const bulanIni = bulanWib(sekarang)
  const [laporan, dibukaLagi] = await Promise.all([
    semuaLaporan('status,dibuat_pada,tenggat_pada,selesai_pada'),
    supabase
      .from('laporan_riwayat')
      .select('dibuat_pada')
      .eq('status', 'dibuka_lagi')
      .gte('dibuat_pada', new Date(sekarang.getTime() - 32 * HARI_MS).toISOString()),
  ])
  if (dibukaLagi.error) throw dibukaLagi.error

  res.json({
    data: {
      masuk_hari_ini: laporan.filter((l) => tanggalWib(l.dibuat_pada) === hariIni).length,
      perlu_verifikasi: laporan.filter((l) => TAB.verifikasi.includes(l.status)).length,
      lewat_tenggat: laporan.filter((l) => AKTIF.includes(l.status) && telat(l, sekarang)).length,
      selesai_bulan_ini: laporan.filter((l) => l.status === 'selesai' && l.selesai_pada && bulanWib(l.selesai_pada) === bulanIni).length,
      ditolak_warga_bulan_ini: (dibukaLagi.data ?? []).filter((r) => bulanWib(r.dibuat_pada) === bulanIni).length,
    },
  })
})

async function daftarLaporan(query) {
  const tab = pilihan(query.tab ?? 'semua', 'Tab', Object.keys(TAB))
  const sekarang = new Date()
  let hasil = (await semuaLaporan()).map((row) => bentuk(row, sekarang))
  if (TAB[tab]) hasil = hasil.filter((l) => TAB[tab].includes(l.status))
  if (tab === 'telat') hasil = hasil.filter((l) => l.telat)
  if (query.kecamatan) hasil = hasil.filter((l) => l.proyek?.kecamatan === query.kecamatan)
  return hasil
}

router.get('/laporan', async (req, res) => {
  const hasil = await daftarLaporan(req.query)
  const { data: kecamatan, error } = await supabase.from('proyek').select('lokasi').not('lokasi', 'is', null)
  if (error) throw error
  res.json({
    data: {
      laporan: hasil.slice(0, 200),
      total: hasil.length,
      kecamatan: [...new Set((kecamatan ?? []).map((p) => p.lokasi))].sort(),
    },
  })
})

router.get('/laporan.csv', async (req, res) => {
  const hasil = (await daftarLaporan(req.query)).map((l) => ({
    ...l,
    ruas: l.proyek?.ruas,
    kecamatan: l.proyek?.kecamatan,
    kontraktor: l.proyek?.kontraktor,
  }))
  res.set('content-type', 'text/csv; charset=utf-8')
  res.set('content-disposition', `attachment; filename="laporan-${tanggalWib(new Date())}.csv"`)
  res.send(
    csv(hasil, [
      'kode', 'status', 'label_jenis', 'keparahan', 'deskripsi', 'ruas', 'kecamatan', 'kontraktor', 'garansi',
      'penanggung_jawab', 'dibuat_pada', 'tenggat_pada', 'selesai_pada', 'telat', 'lat', 'lng',
    ]),
  )
})

router.get('/laporan/:kode', async (req, res) => {
  const laporan = await ambil(req.params.kode)
  const [{ data: riwayat, error }, dekat] = await Promise.all([
    supabase
      .from('laporan_riwayat')
      .select('status,catatan,dibuat_pada')
      .eq('laporan_id', laporan.id)
      .order('dibuat_pada', { ascending: true }),
    laporanDekat(laporan),
  ])
  if (error) throw error
  res.json({ data: { ...bentuk(laporan), riwayat: riwayat ?? [], dekat } })
})

router.post('/laporan/:kode/verifikasi', async (req, res) => {
  const aksi = pilihan(req.body?.aksi, 'Aksi', ['teruskan', 'foto_ulang', 'tolak'])
  const catatan = catatanOpsional(req.body?.catatan)
  const laporan = await ambil(req.params.kode)
  const oleh = req.petugas.nama

  if (aksi === 'tolak') {
    if (!catatan) throw new HttpError(400, 'VALIDASI', 'Tulis alasan penolakan untuk pelapor')
    pastikanTransisi(laporan, 'ditolak')
    const data = await ubahStatus(laporan, { status: 'ditolak', alasan_tolak: catatan, diverifikasi_oleh: oleh })
    await catatRiwayat(laporan.id, 'ditolak', `Ditolak petugas ${oleh}: ${catatan}`)
    await kabarkan(laporan, `ditolak petugas. Alasan: ${catatan}`)
    return res.json({ data: bentuk(data) })
  }

  if (aksi === 'foto_ulang') {
    pastikanTransisi(laporan, 'perlu_foto_ulang')
    const data = await ubahStatus(laporan, { status: 'perlu_foto_ulang', alasan_tolak: catatan, diverifikasi_oleh: oleh })
    await catatRiwayat(laporan.id, 'perlu_foto_ulang', catatan ?? `Petugas ${oleh} meminta foto ulang.`)
    await kabarkan(
      laporan,
      `butuh foto ulang. Kirim laporan baru dengan foto yang diambil langsung di lokasi.${catatan ? ` Catatan petugas: ${catatan}` : ''}`,
    )
    return res.json({ data: bentuk(data) })
  }

  pastikanTransisi(laporan, 'diverifikasi')
  const garansi = statusGaransi(laporan.proyek)
  const penanggung = ditanggungKontraktor(garansi) ? laporan.proyek?.kontraktor?.nama ?? 'kontraktor' : 'Dinas PU Bina Marga'
  const data = await ubahStatus(laporan, {
    status: 'diteruskan',
    diverifikasi_oleh: oleh,
    tenggat_pada: tenggatBaru(),
    catatan_admin: catatan,
  })
  await catatRiwayat(laporan.id, 'diverifikasi', `Diverifikasi petugas ${oleh}.`)
  await catatRiwayat(laporan.id, 'diteruskan', `Diteruskan ke ${penanggung}.`)
  await kabarkan(laporan, PESAN_STATUS.diteruskan)
  res.json({ data: bentuk(data) })
})

router.post('/laporan/:kode/mulai', async (req, res) => {
  const laporan = await ambil(req.params.kode)
  pastikanTransisi(laporan, 'dikerjakan')
  const data = await ubahStatus(laporan, { status: 'dikerjakan' })
  await catatRiwayat(laporan.id, 'dikerjakan', 'Perbaikan mulai dikerjakan.')
  await kabarkan(laporan, PESAN_STATUS.dikerjakan)
  res.json({ data: bentuk(data) })
})

router.post('/laporan/:kode/bukti', upload.single('foto_sesudah'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'VALIDASI', 'Unggah foto sesudah perbaikan')
  const laporan = await ambil(req.params.kode)
  if (laporan.status !== 'dikerjakan') {
    throw new HttpError(409, 'TRANSISI_TIDAK_VALID', 'Bukti perbaikan hanya untuk laporan yang sedang dikerjakan')
  }

  const asal = asalFoto(bacaExif(req.file.buffer), null)
  const titik = laporan.lat == null ? null : [laporan.lat, laporan.lng]
  const { cek } = periksaFoto({ asal, titik, duplikat: null })
  const foto = await simpanFoto(req.file)

  try {
    const data = await ubahStatus(laporan, {
      foto_sesudah_url: foto.url,
      ditandai_selesai_pada: new Date().toISOString(),
      cek_sesudah: {
        cek: cek.filter((c) => c.kode === 'lokasi' || c.kode === 'waktu'),
        asal: { lat: asal.lat, lng: asal.lng, pada: asal.pada?.toISOString?.() ?? null },
      },
    })
    await catatRiwayat(laporan.id, 'bukti', 'Kontraktor menandai selesai dan mengunggah foto.')
    res.json({ data: bentuk(data) })
  } catch (galat) {
    await rm(join(folderUpload, foto.nama), { force: true }).catch(() => {})
    throw galat
  }
})

router.post('/laporan/:kode/setujui', async (req, res) => {
  const laporan = await ambil(req.params.kode)
  pastikanTransisi(laporan, 'selesai')
  if (!laporan.foto_sesudah_url) throw new HttpError(409, 'BELUM_ADA_BUKTI', 'Belum ada foto bukti perbaikan')
  const data = await ubahStatus(laporan, {
    status: 'selesai',
    selesai_pada: laporan.ditandai_selesai_pada ?? new Date().toISOString(),
  })
  await catatRiwayat(laporan.id, 'selesai', `Disetujui petugas ${req.petugas.nama}. Menunggu konfirmasi pelapor.`)
  await kabarkan(laporan, PESAN_STATUS.selesai)
  res.json({ data: bentuk(data) })
})

router.post('/laporan/:kode/kembalikan', async (req, res) => {
  const catatan = catatanOpsional(req.body?.catatan)
  const laporan = await ambil(req.params.kode)
  if (laporan.status !== 'dikerjakan' || !laporan.foto_sesudah_url) {
    throw new HttpError(409, 'TRANSISI_TIDAK_VALID', 'Tidak ada bukti perbaikan yang bisa dikembalikan')
  }
  const data = await ubahStatus(laporan, {
    foto_sesudah_url: null,
    ditandai_selesai_pada: null,
    cek_sesudah: null,
    catatan_admin: catatan,
  })
  await catatRiwayat(laporan.id, 'dikembalikan', catatan ?? `Bukti perbaikan dikembalikan petugas ${req.petugas.nama}.`)
  res.json({ data: bentuk(data) })
})

async function dataPeta(query) {
  const bulan = bacaBulan(query.bulan)
  const grup = query.status ? pilihan(query.status, 'Status', ['belum', 'dikerjakan', 'selesai']) : null
  const sekarang = new Date()

  const [laporan, proyek] = await Promise.all([
    semuaLaporan(),
    supabase
      .from('proyek')
      .select('id,slug,ruas,lokasi,lat,lng,selesai_pada,masa_pemeliharaan_bulan,kontraktor:kontraktor_id(nama)')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(5000),
  ])
  if (proyek.error) throw proyek.error

  const titik = laporan
    .filter((l) => GRUP_PETA[l.status] && l.lat != null && l.lng != null)
    .filter((l) => !bulan || bulanWib(l.dibuat_pada) === bulan)
    .filter((l) => !query.kecamatan || l.proyek?.lokasi === query.kecamatan)
    .map((l) => ({ ...bentuk(l, sekarang), grup: GRUP_PETA[l.status] }))
    .filter((l) => !grup || l.grup === grup)

  const ruas = (proyek.data ?? [])
    .filter((p) => !query.kecamatan || p.lokasi === query.kecamatan)
    .map(({ kontraktor, ...p }) => {
      const g = denganGaransi(p, sekarang)
      return { slug: p.slug, ruas: p.ruas, kecamatan: p.lokasi, lat: p.lat, lng: p.lng, kontraktor: kontraktor?.nama ?? null, garansi: g.garansi, akhir_garansi: g.akhir_garansi }
    })

  const perRuas = new Map()
  for (const l of titik) {
    if (!l.proyek) continue
    const r = perRuas.get(l.proyek.slug) ?? { slug: l.proyek.slug, ruas: l.proyek.ruas, garansi: l.garansi, jumlah: 0 }
    r.jumlah++
    perRuas.set(l.proyek.slug, r)
  }
  const rawan = [...perRuas.values()]
    .sort((a, b) => Number(ditanggungKontraktor(b.garansi)) - Number(ditanggungKontraktor(a.garansi)) || b.jumlah - a.jumlah)
    .slice(0, 4)

  return { titik, ruas, rawan }
}

router.get('/peta', async (req, res) => {
  const { titik, ruas, rawan } = await dataPeta(req.query)
  res.json({
    data: {
      laporan: titik.map((l) => ({
        kode: l.kode,
        label_jenis: l.label_jenis,
        status: l.status,
        grup: l.grup,
        posisi: [l.lat, l.lng],
        ruas: l.proyek?.ruas ?? null,
        penanggung_jawab: l.penanggung_jawab,
        garansi: l.garansi,
        dibuat_pada: l.dibuat_pada,
      })),
      ruas,
      rawan,
      diperbarui_pada: new Date().toISOString(),
    },
  })
})

router.get('/peta.geojson', async (req, res) => {
  const { titik } = await dataPeta(req.query)
  res.set('content-type', 'application/geo+json; charset=utf-8')
  res.set('content-disposition', `attachment; filename="peta-laporan-${req.query.bulan ?? 'semua'}.geojson"`)
  res.send(
    JSON.stringify(
      geojson(
        titik.map((l) => ({
          kode: l.kode,
          jenis: l.jenis,
          status: l.status,
          ruas: l.proyek?.ruas ?? null,
          kecamatan: l.proyek?.kecamatan ?? null,
          penanggung_jawab: l.penanggung_jawab,
          garansi: l.garansi,
          tenggat_pada: l.tenggat_pada,
          dibuat_pada: l.dibuat_pada,
          lat: l.lat,
          lng: l.lng,
        })),
      ),
    ),
  )
})

router.get('/proyek', async (_req, res) => {
  const sekarang = new Date()
  const [proyek, laporan] = await Promise.all([
    supabase
      .from('proyek')
      .select('id,slug,ruas,lokasi,tahun_anggaran,selesai_pada,masa_pemeliharaan_bulan,kontraktor:kontraktor_id(nama)')
      .order('tahun_anggaran', { ascending: false })
      .limit(5000),
    supabase.from('laporan').select('proyek_id').in('status', STATUS_PUBLIK).not('proyek_id', 'is', null).limit(20000),
  ])
  if (proyek.error) throw proyek.error
  if (laporan.error) throw laporan.error

  const jumlah = new Map()
  for (const l of laporan.data ?? []) jumlah.set(l.proyek_id, (jumlah.get(l.proyek_id) ?? 0) + 1)

  const daftar = (proyek.data ?? []).map(({ kontraktor, ...p }) => {
    const g = denganGaransi(p, sekarang)
    const total = p.masa_pemeliharaan_bulan ? p.masa_pemeliharaan_bulan * 30.44 : null
    const sisa = g.sisa_hari == null || total == null ? null : Math.max(0, Math.min(1, g.sisa_hari / total))
    return {
      id: p.id,
      slug: p.slug,
      ruas: p.ruas,
      kecamatan: p.lokasi,
      tahun: p.tahun_anggaran,
      kontraktor: kontraktor?.nama ?? null,
      garansi: g.garansi,
      akhir_garansi: g.akhir_garansi,
      sisa_hari: g.sisa_hari,
      sisa_persen: sisa == null ? null : Math.round(sisa * 100),
      laporan: jumlah.get(p.id) ?? 0,
    }
  })

  const urut = { warn: 0, ok: 1, exp: 2 }
  daftar.sort((a, b) => (urut[a.garansi] ?? 3) - (urut[b.garansi] ?? 3) || (a.sisa_hari ?? 1e9) - (b.sisa_hari ?? 1e9))

  res.json({
    data: {
      proyek: daftar,
      jumlah: {
        semua: daftar.length,
        ok: daftar.filter((p) => p.garansi === 'ok').length,
        warn: daftar.filter((p) => p.garansi === 'warn').length,
        exp: daftar.filter((p) => p.garansi === 'exp').length,
      },
    },
  })
})

router.get('/pengingat', async (_req, res) => {
  const [pengaturan, log, pemantau] = await Promise.all([
    ambilPengaturan(),
    supabase
      .from('pengingat_log')
      .select('jenis,penerima,jumlah,dikirim_oleh,dibuat_pada,proyek:proyek_id(ruas,kontraktor:kontraktor_id(nama))')
      .order('dibuat_pada', { ascending: false })
      .limit(8),
    supabase.from('pantauan').select('email').eq('aktif', true).limit(20000),
  ])
  if (log.error) throw log.error
  if (pemantau.error) throw pemantau.error
  res.json({
    data: {
      pengaturan,
      pemantau: new Set((pemantau.data ?? []).map((p) => p.email)).size,
      log: (log.data ?? []).map(({ proyek, ...l }) => ({ ...l, ruas: proyek?.ruas ?? null, kontraktor: proyek?.kontraktor?.nama ?? null })),
    },
  })
})

router.put('/pengingat', async (req, res) => {
  const nilai = {}
  for (const kunci of Object.keys(PENGATURAN_AWAL)) {
    const v = req.body?.[kunci]
    if (typeof v !== 'boolean') throw new HttpError(400, 'VALIDASI', `Pengaturan ${kunci} harus true/false`)
    nilai[kunci] = v
  }
  const { error } = await supabase
    .from('pengaturan')
    .upsert({ kunci: 'pengingat', nilai, diubah_pada: new Date().toISOString() })
  if (error) throw error
  res.json({ data: nilai })
})

router.post('/pengingat/:proyekId', batasi({ maks: 20, jendelaMs: 10 * 60_000 }), async (req, res) => {
  const { data: proyek, error } = await supabase
    .from('proyek')
    .select('id,ruas,lat,lng,selesai_pada,masa_pemeliharaan_bulan')
    .eq('id', req.params.proyekId)
    .maybeSingle()
  if (error) throw error
  if (!proyek) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Proyek tidak ditemukan')
  if (!ditanggungKontraktor(statusGaransi(proyek))) {
    throw new HttpError(409, 'GARANSI_HABIS', 'Masa garansi proyek ini sudah habis')
  }

  const [pengaturan, pantauan] = await Promise.all([ambilPengaturan(), ambilPantauan()])
  const hasil = await kirimPengingat({ proyek, jenis: 'manual', pantauan, pengaturan, oleh: req.petugas.nama })
  res.json({ data: hasil })
})

router.get('/rapor', async (_req, res) => {
  const semua = await ambilSemua()
  const kontraktor = raporSemua(semua)
    .map((k) => {
      const asli = semua.kontraktor.find((x) => x.id === k.id)
      return { ...k, ruas_nama: [...new Set((asli?.proyek ?? []).map((p) => p.ruas))].slice(0, 3) }
    })
    .sort((a, b) => (b.skor ?? -1) - (a.skor ?? -1) || b.paket - a.paket)

  const dinilai = kontraktor.filter((k) => k.nilai)
  const jatuhTempo = dinilai.reduce((t, k) => t + k.jatuh_tempo, 0)
  res.json({
    data: {
      kontraktor,
      ringkasan: {
        dinilai: dinilai.length,
        nilai_a: dinilai.filter((k) => k.nilai === 'A').length,
        perlu_evaluasi: dinilai.filter((k) => k.nilai === 'D').length,
        persen_tepat: jatuhTempo ? Math.round((dinilai.reduce((t, k) => t + k.tepat_waktu, 0) / jatuhTempo) * 100) : null,
      },
    },
  })
})

const JENIS_EKSPOR = ['rekap', 'rapor', 'garansi']

async function rekap(bulan, kecamatan) {
  const sekarang = new Date()
  const laporan = (await semuaLaporan())
    .filter((l) => l.status !== 'ditolak')
    .filter((l) => !bulan || bulanWib(l.dibuat_pada) === bulan)
    .filter((l) => !kecamatan || l.proyek?.lokasi === kecamatan)
    .map((l) => bentuk(l, sekarang))

  const perKecamatan = new Map()
  for (const l of laporan) {
    const nama = l.proyek?.kecamatan ?? 'Belum dicocokkan'
    const r = perKecamatan.get(nama) ?? { kecamatan: nama, masuk: 0, selesai: 0, telat: 0 }
    r.masuk++
    if (l.status === 'selesai') r.selesai++
    if (l.telat) r.telat++
    perKecamatan.set(nama, r)
  }

  return {
    laporan,
    ringkasan: {
      masuk: laporan.length,
      selesai: laporan.filter((l) => l.status === 'selesai').length,
      dikerjakan: laporan.filter((l) => l.status === 'dikerjakan').length,
      telat: laporan.filter((l) => l.telat).length,
    },
    per_kecamatan: [...perKecamatan.values()].sort((a, b) => b.masuk - a.masuk),
    daftar_telat: laporan
      .filter((l) => l.telat)
      .slice(0, 50)
      .map((l) => ({ kode: l.kode, ruas: l.proyek?.ruas ?? null, tenggat_pada: l.tenggat_pada, penanggung_jawab: l.penanggung_jawab })),
  }
}

async function catatEkspor(nama, petugas) {
  const { error } = await supabase.from('ekspor_log').insert({ nama_berkas: nama, petugas })
  if (error) throw error
}

router.get('/ekspor/rekap', async (req, res) => {
  const { laporan, ...hasil } = await rekap(bacaBulan(req.query.bulan), req.query.kecamatan || null)
  res.json({ data: hasil })
})

router.get('/ekspor/riwayat', async (_req, res) => {
  const { data, error } = await supabase
    .from('ekspor_log')
    .select('nama_berkas,petugas,dibuat_pada')
    .order('dibuat_pada', { ascending: false })
    .limit(6)
  if (error) throw error
  res.json({ data: data ?? [] })
})

router.post('/ekspor/log', async (req, res) => {
  const nama = teks(req.body?.nama_berkas, 'Nama berkas', { max: 120 })
  await catatEkspor(nama, req.petugas.nama)
  res.status(201).json({ data: { nama_berkas: nama } })
})

router.get('/ekspor/:jenis.csv', async (req, res) => {
  const jenis = pilihan(req.params.jenis, 'Jenis laporan', JENIS_EKSPOR)
  const bulan = bacaBulan(req.query.bulan)
  let isi
  let nama

  if (jenis === 'rekap') {
    const { laporan } = await rekap(bulan, req.query.kecamatan || null)
    nama = `Rekap ${bulan ?? 'semua'}${req.query.kecamatan ? ` ${req.query.kecamatan}` : ''}.csv`
    isi = csv(
      laporan.map((l) => ({ ...l, ruas: l.proyek?.ruas, kecamatan: l.proyek?.kecamatan })),
      ['kode', 'status', 'label_jenis', 'ruas', 'kecamatan', 'penanggung_jawab', 'dibuat_pada', 'tenggat_pada', 'selesai_pada', 'telat'],
    )
  } else if (jenis === 'rapor') {
    nama = 'Rapor kontraktor.csv'
    isi = csv(raporSemua(await ambilSemua()), [
      'nama', 'nilai', 'skor', 'paket', 'laporan_garansi', 'tepat_waktu', 'lewat_tenggat', 'persen_tepat', 'rata_hari', 'ditolak',
    ])
  } else {
    const sekarang = new Date()
    const { data, error } = await supabase
      .from('proyek')
      .select('ruas,lokasi,tahun_anggaran,selesai_pada,masa_pemeliharaan_bulan,kontraktor:kontraktor_id(nama)')
      .limit(5000)
    if (error) throw error
    nama = 'Status garansi proyek.csv'
    isi = csv(
      (data ?? [])
        .map(({ kontraktor, ...p }) => ({ ...denganGaransi(p, sekarang), kontraktor: kontraktor?.nama ?? null }))
        .filter((p) => p.garansi === 'warn' || p.garansi === 'exp')
        .filter((p) => !req.query.kecamatan || p.lokasi === req.query.kecamatan),
      ['ruas', 'lokasi', 'kontraktor', 'tahun_anggaran', 'akhir_garansi', 'sisa_hari', 'garansi'],
    )
  }

  await catatEkspor(nama, req.petugas.nama)
  res.set('content-type', 'text/csv; charset=utf-8')
  res.set('content-disposition', `attachment; filename="${nama.replace(/[^\w .-]/g, '')}"`)
  res.send('﻿' + isi)
})

export default router
