import { Router } from 'express'
import multer from 'multer'
import { createHash, randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { supabase } from '../supabase.js'
import { STATUS, STATUS_PUBLIK, bolehTransisi, laporanPublik } from '../laporan.js'
import { akhirGaransi, statusGaransi, telat } from '../garansi.js'
import { bacaExif, jarakMeter } from '../exif.js'
import { asalFoto, periksaFoto } from '../cekFoto.js'
import { kirimEmail, samarkanEmail } from '../email.js'
import { sesiOpsional } from '../sesi.js'
import { admin } from '../admin.js'
import { batasi } from '../limiter.js'
import { HttpError, teks, angkaDesimal, pilihan, email as validEmail, batas } from '../validasi.js'

export const JENIS = {
  lubang: 'Lubang',
  retak: 'Retak',
  ambles: 'Ambles',
  bergelombang: 'Bergelombang',
  genangan: 'Genangan',
  lainnya: 'Kerusakan lain',
}
const KEPARAHAN = ['ringan', 'bahaya', 'putus']
const TENGGAT_HARI = Number(process.env.TENGGAT_HARI) || 14
const HARI_MS = 86_400_000
const FOTO_MAKS = 5 * 1024 * 1024
const RADIUS_DEKAT_M = 300

export const folderUpload = fileURLToPath(new URL('../../uploads/', import.meta.url))
mkdirSync(folderUpload, { recursive: true })

const EKSTENSI = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FOTO_MAKS, files: 3 },
  fileFilter: (_req, file, cb) => {
    if (!EKSTENSI[file.mimetype]) {
      return cb(new HttpError(400, 'VALIDASI', 'Foto harus berformat jpg, png, atau webp'))
    }
    cb(null, true)
  },
})

const PILIH = [
  'id', 'kode', 'proyek_id', 'deskripsi', 'jenis', 'keparahan', 'foto_url', 'foto_urls', 'foto_sesudah_url',
  'cek_foto', 'status', 'lat', 'lng', 'dibuat_pada', 'tenggat_pada', 'selesai_pada', 'dikonfirmasi_pada',
  'buka_lagi_count', 'catatan_admin', 'alasan_tolak',
  'proyek:proyek_id(ruas,slug,tahun_anggaran,selesai_pada,masa_pemeliharaan_bulan,kontraktor:kontraktor_id(nama))',
].join(',')

export const PESAN_STATUS = {
  diverifikasi: 'sudah diverifikasi petugas Dinas PU Bina Marga.',
  diteruskan: 'sudah diteruskan ke pihak yang wajib memperbaiki.',
  dikerjakan: 'sedang dikerjakan.',
  selesai: 'ditandai selesai. Cek hasilnya, lalu konfirmasi atau tolak kalau belum beres.',
}

function bentuk(row, sekarang = new Date()) {
  const { proyek, ...isi } = laporanPublik(row)
  return {
    ...isi,
    cek_foto: row.cek_foto ? { sumber: row.cek_foto.sumber, cek: row.cek_foto.cek } : null,
    label_jenis: JENIS[row.jenis] ?? null,
    ruas: proyek?.ruas ?? null,
    slug_proyek: proyek?.slug ?? null,
    tahun_proyek: proyek?.tahun_anggaran ?? null,
    pelaksana: proyek?.kontraktor?.nama ?? null,
    garansi: statusGaransi(proyek, sekarang),
    akhir_garansi: akhirGaransi(proyek)?.toISOString().slice(0, 10) ?? null,
    telat: telat(row, sekarang),
  }
}

function kodeBaru() {
  return 'CJ-' + randomBytes(4).toString('hex').toUpperCase()
}

export function tenggatBaru(dari = new Date()) {
  return new Date(dari.getTime() + TENGGAT_HARI * HARI_MS).toISOString()
}

function hashFoto(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function bacaKamera(nilai) {
  try {
    const hasil = JSON.parse(nilai ?? '[]')
    return Array.isArray(hasil) ? hasil : [hasil]
  } catch {
    throw new HttpError(400, 'VALIDASI', 'Data kamera tidak valid')
  }
}

function bacaTitik(body) {
  const ada = (v) => v !== undefined && v !== ''
  if (!ada(body.lat) && !ada(body.lng)) return null
  if (!ada(body.lat) || !ada(body.lng)) {
    throw new HttpError(400, 'VALIDASI', 'Latitude dan longitude harus diisi bersamaan')
  }
  return [
    angkaDesimal(body.lat, 'Latitude', { min: -90, max: 90 }),
    angkaDesimal(body.lng, 'Longitude', { min: -180, max: 180 }),
  ]
}

async function cariDuplikat(hash) {
  const { data, error } = await supabase.from('laporan').select('kode').contains('foto_hash', [hash]).limit(1)
  if (error) throw error
  return data?.[0]?.kode ?? null
}

async function cekSatuFoto(file, kamera, titik) {
  const hash = hashFoto(file.buffer)
  const exif = bacaExif(file.buffer)
  const asal = asalFoto(exif, kamera)
  const perangkat = [exif?.merek, exif?.model].filter(Boolean).join(' ') || null
  return {
    hash,
    asal: { lat: asal.lat, lng: asal.lng, pada: asal.pada?.toISOString?.() ?? null, perangkat },
    ...periksaFoto({ asal, titik, duplikat: await cariDuplikat(hash) }),
  }
}

export async function simpanFoto(file) {
  const nama = randomBytes(8).toString('hex') + EKSTENSI[file.mimetype]
  await writeFile(join(folderUpload, nama), file.buffer)
  return { nama, url: `/uploads/${nama}` }
}

async function cariProyek(body, titik) {
  if (body.proyek_id || body.proyek_slug) {
    const kolom = body.proyek_id ? 'id' : 'slug'
    const { data, error } = await supabase
      .from('proyek')
      .select('id')
      .eq(kolom, body.proyek_id || body.proyek_slug)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new HttpError(400, 'VALIDASI', 'Proyek tidak ditemukan')
    return data.id
  }

  if (!titik) return null

  const { data, error } = await supabase
    .from('proyek')
    .select('id,lat,lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(500)

  if (error) throw error

  let terdekat = null
  let jarak = Infinity
  for (const proyek of data ?? []) {
    const d = jarakMeter(titik, [proyek.lat, proyek.lng])
    if (d < jarak) {
      jarak = d
      terdekat = proyek
    }
  }
  return terdekat?.id ?? null
}

export async function laporanDekat(laporan) {
  if (laporan.lat == null || laporan.lng == null) return []
  const { data, error } = await supabase
    .from('laporan')
    .select('kode,lat,lng,status')
    .in('status', ['masuk', 'diverifikasi', 'diteruskan', 'dikerjakan'])
    .neq('kode', laporan.kode)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(500)

  if (error) throw error
  return (data ?? [])
    .map((l) => ({ kode: l.kode, jarak_m: Math.round(jarakMeter([laporan.lat, laporan.lng], [l.lat, l.lng])) }))
    .filter((l) => l.jarak_m <= RADIUS_DEKAT_M)
    .sort((a, b) => a.jarak_m - b.jarak_m)
    .slice(0, 3)
}

export async function catatRiwayat(laporanId, status, catatan = null) {
  const { error } = await supabase.from('laporan_riwayat').insert({ laporan_id: laporanId, status, catatan })
  if (error) throw error
}

async function ambilLaporan(kode, kolomTambahan = '') {
  const { data, error } = await supabase
    .from('laporan')
    .select(PILIH + kolomTambahan)
    .eq('kode', kode)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Laporan tidak ditemukan')
  return data
}

export async function kabarkan(baris, teksStatus) {
  if (!baris.pelapor_email) return
  await kirimEmail({
    ke: baris.pelapor_email,
    subjek: `Laporan ${baris.kode} ${teksStatus.split('.')[0]}`,
    judul: `Kabar laporan ${baris.kode}`,
    teks: `Laporan ${baris.kode} ${teksStatus}`,
    tombol: { label: 'Lacak laporan', url: `${process.env.FRONTEND_URL ?? '/'}lacak/${baris.kode}` },
  }).catch((galat) => console.error(`gagal mengirim email laporan ${baris.kode}:`, galat.message))
}

function wajibMasuk(req, _res, next) {
  if (!req.warga) throw new HttpError(401, 'BELUM_MASUK', 'Masuk dulu untuk melapor kerusakan')
  next()
}

const router = Router()

router.get('/', async (req, res) => {
  const limit = batas(req.query.limit, 50)
  const status = req.query.status ? pilihan(req.query.status, 'Status', STATUS_PUBLIK) : null
  const garansi = req.query.garansi ? pilihan(req.query.garansi, 'Garansi', ['ok', 'warn', 'exp']) : null

  let query = supabase
    .from('laporan')
    .select(PILIH)
    .order('dibuat_pada', { ascending: false })
    .limit(req.query.telat === '1' || garansi ? 200 : limit)

  query = status ? query.eq('status', status) : query.in('status', STATUS_PUBLIK)

  if (req.query.proyek) {
    const { data: proyek, error } = await supabase
      .from('proyek')
      .select('id')
      .eq('slug', String(req.query.proyek))
      .maybeSingle()

    if (error) throw error
    if (!proyek) return res.json({ data: [] })
    query = query.eq('proyek_id', proyek.id)
  }

  const { data, error } = await query
  if (error) throw error

  const sekarang = new Date()
  let hasil = (data ?? []).map((row) => bentuk(row, sekarang))
  if (garansi) hasil = hasil.filter((laporan) => laporan.garansi === garansi)
  if (req.query.telat === '1') hasil = hasil.filter((laporan) => laporan.telat)

  res.json({ data: hasil.slice(0, limit) })
})

router.get('/saya', sesiOpsional, async (req, res) => {
  if (!req.warga) throw new HttpError(401, 'BELUM_MASUK', 'Masuk dulu untuk melihat laporanmu')
  const ambil = (kolom, nilai) =>
    supabase.from('laporan').select(PILIH).eq(kolom, nilai).order('dibuat_pada', { ascending: false }).limit(50)
  const [milikAkun, milikEmail] = await Promise.all([ambil('warga_id', req.warga.id), ambil('pelapor_email', req.warga.email)])

  if (milikAkun.error) throw milikAkun.error
  if (milikEmail.error) throw milikEmail.error
  const unik = new Map([...(milikAkun.data ?? []), ...(milikEmail.data ?? [])].map((row) => [row.kode, row]))
  const data = [...unik.values()].sort((a, b) => new Date(b.dibuat_pada) - new Date(a.dibuat_pada))
  res.json({ data: data.map((row) => bentuk(row)) })
})

router.get('/:kode', async (req, res) => {
  const laporan = await ambilLaporan(req.params.kode, ',pelapor_email')
  const [{ data: riwayat, error }, dekat] = await Promise.all([
    supabase
      .from('laporan_riwayat')
      .select('status,catatan,dibuat_pada')
      .eq('laporan_id', laporan.id)
      .order('dibuat_pada', { ascending: true }),
    laporanDekat(laporan),
  ])

  if (error) throw error
  res.json({
    data: {
      ...bentuk(laporan),
      riwayat: riwayat ?? [],
      dekat,
      email_samaran: samarkanEmail(laporan.pelapor_email),
    },
  })
})

router.post(
  '/cek-foto',
  batasi({ maks: 30, jendelaMs: 10 * 60_000 }),
  sesiOpsional,
  wajibMasuk,
  upload.single('foto'),
  async (req, res) => {
    if (!req.file) throw new HttpError(400, 'VALIDASI', 'Foto wajib diunggah')
    const [kamera] = bacaKamera(req.body.kamera)
    const { hash, asal, ...hasil } = await cekSatuFoto(req.file, kamera, bacaTitik(req.body))
    res.json({ data: hasil })
  },
)

router.post('/', batasi({ maks: 10, jendelaMs: 60_000 }), sesiOpsional, wajibMasuk, upload.array('foto', 3), async (req, res) => {
  const files = req.files ?? []
  if (!files.length) throw new HttpError(400, 'VALIDASI', 'Unggah minimal satu foto kerusakan')

  const titik = bacaTitik(req.body)
  if (!titik) throw new HttpError(400, 'VALIDASI', 'Pilih titik kerusakan di peta')

  const jenis = pilihan(req.body.jenis, 'Jenis kerusakan', Object.keys(JENIS))
  const keparahan = pilihan(req.body.keparahan, 'Tingkat kerusakan', KEPARAHAN)
  const keterangan = req.body.keterangan ? teks(req.body.keterangan, 'Keterangan', { min: 0, max: 1000 }) : ''
  const alamatEmail = req.warga.email
  const nama = req.body.nama ? teks(req.body.nama, 'Nama', { max: 100 }) : req.warga?.nama ?? null
  const kamera = bacaKamera(req.body.kamera)

  const hasilCek = []
  for (const [i, file] of files.entries()) hasilCek.push(await cekSatuFoto(file, kamera[i], titik))

  const ditolak = hasilCek.findIndex((h) => !h.lolos)
  if (ditolak !== -1) {
    return res.status(422).json({
      error: {
        code: 'FOTO_DITOLAK',
        message: `Foto ke-${ditolak + 1} belum lolos pengecekan`,
        cek: hasilCek[ditolak].cek,
      },
    })
  }

  const proyekId = await cariProyek(req.body, titik)
  const tersimpan = []

  try {
    for (const file of files) tersimpan.push(await simpanFoto(file))

    let baris = null
    let galatTerakhir = null
    for (let percobaan = 0; percobaan < 3 && !baris; percobaan++) {
      const { data, error } = await supabase
        .from('laporan')
        .insert({
          kode: kodeBaru(),
          proyek_id: proyekId,
          deskripsi: keterangan || JENIS[jenis],
          jenis,
          keparahan,
          foto_url: tersimpan[0].url,
          foto_urls: tersimpan.map((f) => f.url),
          foto_hash: hasilCek.map((h) => h.hash),
          cek_foto: { sumber: hasilCek[0].sumber, cek: hasilCek[0].cek, asal: hasilCek[0].asal },
          lat: titik[0],
          lng: titik[1],
          pelapor_nama: nama,
          pelapor_email: alamatEmail,
          warga_id: req.warga?.id ?? null,
          tenggat_pada: tenggatBaru(),
        })
        .select(PILIH + ',pelapor_email')
        .single()

      if (!error) baris = data
      else if (error.code !== '23505') throw error
      else galatTerakhir = error
    }

    if (!baris) throw galatTerakhir

    await catatRiwayat(baris.id, 'masuk', 'Foto dan titik lokasi masuk ke sistem.')
    await catatRiwayat(baris.id, 'cek_foto', 'Lolos cek foto otomatis.')
    await kabarkan(baris, 'sudah kami terima dan sedang menunggu verifikasi petugas.')

    res.status(201).json({
      data: {
        ...bentuk(baris),
        dekat: await laporanDekat(baris),
        email_samaran: samarkanEmail(alamatEmail),
      },
    })
  } catch (error) {
    await Promise.all(tersimpan.map((f) => rm(join(folderUpload, f.nama), { force: true }).catch(() => {})))
    throw error
  }
})

async function cocokkanPelapor(kode, body) {
  const alamat = validEmail(body?.email)
  const laporan = await ambilLaporan(kode, ',pelapor_email')
  if (String(laporan.pelapor_email ?? '') !== alamat) {
    throw new HttpError(403, 'TIDAK_COCOK', 'Email tidak cocok dengan pelapor')
  }
  if (laporan.status !== 'selesai') {
    throw new HttpError(409, 'BUKAN_SELESAI', 'Laporan ini belum berstatus selesai')
  }
  if (laporan.dikonfirmasi_pada) {
    throw new HttpError(409, 'SUDAH_DIKONFIRMASI', 'Laporan ini sudah dikonfirmasi selesai')
  }
  return laporan
}

router.post('/:kode/konfirmasi', batasi({ maks: 5, jendelaMs: 15 * 60_000 }), async (req, res) => {
  const laporan = await cocokkanPelapor(req.params.kode, req.body)
  const { data, error } = await supabase
    .from('laporan')
    .update({ dikonfirmasi_pada: new Date().toISOString() })
    .eq('id', laporan.id)
    .select(PILIH)
    .single()

  if (error) throw error
  await catatRiwayat(laporan.id, 'dikonfirmasi', 'Pelapor mengonfirmasi perbaikan sudah beres.')
  res.json({ data: bentuk(data) })
})

router.post('/:kode/buka-lagi', batasi({ maks: 5, jendelaMs: 15 * 60_000 }), async (req, res) => {
  const laporan = await cocokkanPelapor(req.params.kode, req.body)
  const { data, error } = await supabase
    .from('laporan')
    .update({
      status: 'dikerjakan',
      selesai_pada: null,
      tenggat_pada: tenggatBaru(),
      buka_lagi_count: (laporan.buka_lagi_count ?? 0) + 1,
    })
    .eq('id', laporan.id)
    .select(PILIH)
    .single()

  if (error) throw error
  await catatRiwayat(laporan.id, 'dibuka_lagi', 'Pelapor menolak status selesai. Tenggat dihitung ulang.')
  res.json({ data: bentuk(data) })
})

router.patch('/:kode', admin, upload.single('foto_sesudah'), async (req, res) => {
  const body = req.body ?? {}
  const ke = pilihan(body.status, 'Status', STATUS)
  const laporan = await ambilLaporan(req.params.kode, ',pelapor_email')

  if (!bolehTransisi(laporan.status, ke)) {
    throw new HttpError(409, 'TRANSISI_TIDAK_VALID', `Tidak bisa memindahkan status dari ${laporan.status} ke ${ke}`)
  }

  const ubah = { status: ke }

  if (body.catatan !== undefined) {
    ubah.catatan_admin = teks(body.catatan, 'Catatan', { min: 0, max: 1000 }) || null
  }
  if (ke === 'selesai') ubah.selesai_pada = new Date().toISOString()
  if (laporan.status === 'selesai' && ke === 'dikerjakan') {
    ubah.selesai_pada = null
    ubah.dikonfirmasi_pada = null
    ubah.tenggat_pada = tenggatBaru()
    ubah.buka_lagi_count = (laporan.buka_lagi_count ?? 0) + 1
  }

  const foto = req.file ? await simpanFoto(req.file) : null
  if (foto) ubah.foto_sesudah_url = foto.url

  const { data, error } = await supabase
    .from('laporan')
    .update(ubah)
    .eq('id', laporan.id)
    .select(PILIH)
    .single()

  if (error) {
    if (foto) await rm(join(folderUpload, foto.nama), { force: true }).catch(() => {})
    throw error
  }

  await catatRiwayat(laporan.id, ke, ubah.catatan_admin ?? null)
  await kabarkan(laporan, PESAN_STATUS[ke] ?? `berpindah status ke ${ke}.`)
  res.json({ data: bentuk(data) })
})

export default router
