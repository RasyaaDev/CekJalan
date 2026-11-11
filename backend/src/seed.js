import { createHash } from 'node:crypto'
import { supabase } from './supabase.js'

const HARI = 86_400_000
const JAM = 3_600_000
const sekarang = Date.now()
const iso = (hari) => new Date(sekarang + hari * HARI).toISOString()

const KONTRAKTOR = ['PT Marga Wisesa Konstruksi', 'CV Delta Aspal Mandiri', 'PT Lintas Karya Bangunindo']
const KONTRAKTOR_LAMA = ['A', 'B', 'C'].flatMap((h) => [`Kontraktor ${h}`, `Kontraktor ${h} (contoh)`])
const RUAS = {
  pahlawan: 'Jalan Pahlawan',
  'gajah-mada': 'Jalan Gajah Mada',
  'lingkar-timur': 'Jalan Lingkar Timur',
  'raya-candi': 'Jalan Raya Candi',
  'yos-sudarso': 'Jalan Yos Sudarso',
  'raya-waru': 'Jalan Raya Waru',
}
const slugProyek = (kunci) => `jalan-${kunci}`
const kodeLaporan = (n) => 'CJ-' + createHash('sha256').update(`cekjalan-seed-${n}`).digest('hex').slice(0, 8).toUpperCase()
const NOMOR = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, '0'))

function selesaiUntukSisa(sisaHari, bulan) {
  const akhir = new Date(sekarang + sisaHari * HARI)
  akhir.setUTCMonth(akhir.getUTCMonth() - bulan)
  return akhir.toISOString().slice(0, 10)
}

async function cek(hasil) {
  if (hasil.error) throw hasil.error
  return hasil.data
}

async function hapus() {
  await cek(await supabase.from('laporan').delete().in('kode', NOMOR.map(kodeLaporan)))
  await cek(await supabase.from('laporan').delete().like('kode', 'CJ-DEMO%'))
  await cek(await supabase.from('proyek').delete().in('slug', Object.keys(RUAS).map(slugProyek)))
  await cek(await supabase.from('proyek').delete().like('kode_tender', 'DEMO-%'))
  await cek(await supabase.from('kontraktor').delete().in('nama', [...KONTRAKTOR, ...KONTRAKTOR_LAMA]))
  console.log('Data demo dihapus.')
}

const MILIK_PELAPOR = ['03', '05', '08', '09', '11'].map(kodeLaporan)

async function pelapor() {
  const arg = process.argv.find((a) => a.startsWith('--pelapor='))
  if (!arg) return null
  const email = arg.slice(10).trim().toLowerCase()
  const data = await cek(await supabase.from('warga').select('id,email').eq('email', email).maybeSingle())
  if (!data) throw new Error(`Akun warga ${email} belum ada. Daftar atau masuk dulu di web.`)
  return data
}

async function isi() {
  const akun = await pelapor()
  await cek(await supabase.from('kontraktor').delete().in('nama', KONTRAKTOR_LAMA))
  const kontraktor = await cek(
    await supabase.from('kontraktor').upsert(KONTRAKTOR.map((nama) => ({ nama })), { onConflict: 'nama' }).select('id,nama'),
  )
  const k = Object.fromEntries(kontraktor.map((x) => [['A', 'B', 'C'][KONTRAKTOR.indexOf(x.nama)], x.id]))

  const proyekSeed = [
    ['pahlawan', 'Jalan Pahlawan', 'Sidoarjo', 12_800_000_000, k.A, 2025, 20, 12, -7.4478, 112.7042],
    ['gajah-mada', 'Jalan Gajah Mada', 'Sidoarjo', 6_240_000_000, k.B, 2025, 139, 12, -7.4571, 112.7176],
    ['lingkar-timur', 'Jalan Lingkar Timur', 'Buduran', 8_450_000_000, k.B, 2025, 212, 12, -7.4405, 112.7391],
    ['raya-candi', 'Jalan Raya Candi', 'Candi', 5_120_000_000, k.C, 2025, 96, 12, -7.4823, 112.7095],
    ['yos-sudarso', 'Jalan Yos Sudarso', 'Sidoarjo', 3_360_000_000, k.A, 2024, -70, 12, -7.4629, 112.7158],
    ['raya-waru', 'Jalan Raya Waru', 'Waru', 9_900_000_000, k.C, 2024, -116, 12, -7.3561, 112.7289],
  ].map(([slug, ruas, lokasi, nilai, kontraktor_id, tahun, sisa, bulan, lat, lng]) => ({
    kode_tender: null,
    slug: slugProyek(slug),
    ruas,
    lokasi,
    nilai_kontrak: nilai,
    sumber_dana: `APBD ${tahun}`,
    kontraktor_id,
    tahun_anggaran: tahun,
    selesai_pada: selesaiUntukSisa(sisa, bulan),
    masa_pemeliharaan_bulan: bulan,
    lat,
    lng,
    sumber_url: null,
    updated_at: new Date().toISOString(),
  }))

  await cek(await supabase.from('laporan').delete().like('kode', 'CJ-DEMO%'))
  await cek(await supabase.from('proyek').delete().like('kode_tender', 'DEMO-%'))
  const proyek = await cek(await supabase.from('proyek').upsert(proyekSeed, { onConflict: 'slug' }).select('id,slug,lat,lng'))
  const p = Object.fromEntries(proyek.map((x) => [x.slug.replace('jalan-', ''), x]))

  const daftar = [
    ['01', 'pahlawan', 'masuk', 'lubang', 'bahaya', 'Lubang besar di lajur kiri, sudah dua motor jatuh minggu ini.', 'lubang', -2 / 24, 14],
    ['02', 'gajah-mada', 'masuk', 'retak', 'ringan', 'Retak memanjang di bahu jalan sekitar 20 meter.', 'retak', -5 / 24, 14],
    ['03', 'raya-candi', 'perlu_foto_ulang', 'ambles', 'bahaya', 'Jalan ambles di dekat jembatan.', 'retak', -1, 13, { alasan: 'Foto buram, kerusakannya tidak terlihat jelas.' }],
    ['04', 'lingkar-timur', 'ditolak', 'lainnya', 'ringan', 'Tumpukan material di pinggir jalan.', 'lubang', -3, 11, { alasan: 'Bukan kerusakan jalan. Sudah diteruskan ke Satpol PP.' }],
    ['05', 'pahlawan', 'diteruskan', 'lubang', 'bahaya', 'Lubang di depan SMP, berbahaya saat malam.', 'lubang', -3, 11],
    ['06', 'raya-candi', 'diteruskan', 'bergelombang', 'ringan', 'Aspal bergelombang di tikungan.', 'retak', -16, -2],
    ['07', 'gajah-mada', 'dikerjakan', 'lubang', 'ringan', 'Lubang kecil mulai melebar di dekat pasar.', 'lubang', -6, 8],
    ['08', 'pahlawan', 'dikerjakan', 'lubang', 'bahaya', 'Lubang dalam di lajur tengah.', 'lubang', -12, 2, { sesudah: -0.5 }],
    ['09', 'raya-candi', 'dikerjakan', 'ambles', 'bahaya', 'Tambalan ambles lagi setelah hujan.', 'retak', -25, -4, { ditolakWarga: 1 }],
    ['10', 'yos-sudarso', 'dikerjakan', 'genangan', 'ringan', 'Genangan tidak surut karena permukaan turun.', 'lubang', -8, 6],
    ['11', 'pahlawan', 'selesai', 'retak', 'ringan', 'Retak melintang di dekat perempatan.', 'retak', -30, -16, { selesai: -19, konfirmasi: -18 }],
    ['12', 'gajah-mada', 'selesai', 'lubang', 'bahaya', 'Lubang di jalur sepeda motor.', 'lubang', -40, -26, { selesai: -30, konfirmasi: -29 }],
    ['13', 'lingkar-timur', 'selesai', 'bergelombang', 'ringan', 'Permukaan bergelombang sepanjang 30 meter.', 'retak', -20, -6, { selesai: -9 }],
    ['14', 'raya-candi', 'selesai', 'lubang', 'bahaya', 'Lubang besar di depan gerbang perumahan.', 'lubang', -45, -31, { selesai: -25, ditolakWarga: 1, konfirmasi: -24 }],
    ['15', 'raya-waru', 'selesai', 'retak', 'ringan', 'Retak kulit buaya di lajur lambat.', 'retak', -35, -21, { selesai: -22, konfirmasi: -21 }],
    ['16', 'pahlawan', 'selesai', 'lubang', 'ringan', 'Lubang di dekat halte.', 'lubang', -50, -36, { selesai: -41, konfirmasi: -40 }],
  ]

  const laporanSeed = []
  const riwayat = []

  daftar.forEach(([n, slug, status, jenis, keparahan, deskripsi, foto, dibuat, tenggat, opsi = {}], i) => {
    const titik = [p[slug].lat + ((i % 5) - 2) * 0.0007, p[slug].lng + ((i % 3) - 1) * 0.0009]
    const jarak = 6 + (i % 4) * 3
    const fotoPada = new Date(sekarang + dibuat * HARI - 3 * 60_000).toISOString()
    const kode = kodeLaporan(n)

    laporanSeed.push({
      kode,
      proyek_id: p[slug].id,
      deskripsi,
      jenis,
      keparahan,
      foto_url: `/foto/${foto}.jpg`,
      foto_urls: [`/foto/${foto}.jpg`],
      foto_hash: [`demo-${n}`],
      foto_sesudah_url: opsi.sesudah != null || opsi.selesai != null ? '/foto/perbaikan-1.jpg' : null,
      cek_foto: {
        sumber: 'kamera',
        cek: [
          { kode: 'lokasi', lolos: true, judul: 'Lokasi foto cocok', detail: `Geotag foto berjarak ${jarak} m dari titik yang kamu pilih di peta.`, jarak_m: jarak },
          { kode: 'waktu', lolos: true, judul: 'Foto baru', detail: 'Bukan foto lama atau unduhan.', diambil_pada: fotoPada },
          { kode: 'asli', lolos: true, judul: 'Foto asli dari kamera', detail: 'Bukan tangkapan layar atau gambar hasil unduhan.' },
          { kode: 'duplikat', lolos: true, judul: 'Belum pernah dilaporkan', detail: 'Foto ini belum pernah diunggah ke CekJalan.' },
        ],
        asal: { lat: titik[0] + jarak / 111_000, lng: titik[1], pada: fotoPada, perangkat: null },
      },
      cek_sesudah: opsi.sesudah != null || opsi.selesai != null ? { cek: [{ kode: 'lokasi', lolos: true, judul: 'Lokasi foto cocok', detail: '', jarak_m: 9 }] } : null,
      status,
      lat: titik[0],
      lng: titik[1],
      pelapor_nama: null,
      pelapor_email: akun && MILIK_PELAPOR.includes(kode) ? akun.email : null,
      warga_id: akun && MILIK_PELAPOR.includes(kode) ? akun.id : null,
      dibuat_pada: iso(dibuat),
      tenggat_pada: iso(tenggat),
      selesai_pada: opsi.selesai != null ? iso(opsi.selesai) : null,
      ditandai_selesai_pada: opsi.sesudah != null ? iso(opsi.sesudah) : opsi.selesai != null ? iso(opsi.selesai) : null,
      dikonfirmasi_pada: opsi.konfirmasi != null ? iso(opsi.konfirmasi) : null,
      buka_lagi_count: opsi.ditolakWarga ?? 0,
      alasan_tolak: opsi.alasan ?? null,
      diverifikasi_oleh: status === 'masuk' ? null : 'Andi',
      catatan_admin: null,
    })

    const catat = (st, hari, catatan = null) => riwayat.push({ kode, status: st, catatan, dibuat_pada: iso(hari) })
    const jam = (j) => dibuat + (j * JAM) / HARI
    catat('masuk', dibuat, 'Foto dan titik lokasi masuk ke sistem.')
    catat('cek_foto', dibuat, 'Lolos cek foto otomatis.')
    if (status === 'perlu_foto_ulang' || status === 'ditolak') catat(status, jam(4), opsi.alasan)
    if (['diteruskan', 'dikerjakan', 'selesai'].includes(status)) {
      catat('diverifikasi', jam(3), 'Diverifikasi petugas Andi.')
      catat('diteruskan', jam(3.1), 'Diteruskan ke penanggung jawab.')
    }
    if (['dikerjakan', 'selesai'].includes(status)) catat('dikerjakan', dibuat + 2, 'Perbaikan mulai dikerjakan.')
    if (opsi.ditolakWarga) catat('dibuka_lagi', dibuat + 6, 'Pelapor menolak status selesai. Tenggat dihitung ulang.')
    if (opsi.sesudah != null) catat('bukti', opsi.sesudah, 'Kontraktor menandai selesai dan mengunggah foto.')
    if (opsi.selesai != null) {
      catat('bukti', opsi.selesai - 0.2, 'Kontraktor menandai selesai dan mengunggah foto.')
      catat('selesai', opsi.selesai, 'Disetujui petugas Andi. Menunggu konfirmasi pelapor.')
    }
    if (opsi.konfirmasi != null) catat('dikonfirmasi', opsi.konfirmasi, 'Pelapor mengonfirmasi perbaikan sudah beres.')
  })

  const laporan = await cek(await supabase.from('laporan').upsert(laporanSeed, { onConflict: 'kode' }).select('id,kode'))
  const idLaporan = Object.fromEntries(laporan.map((l) => [l.kode, l.id]))

  await cek(await supabase.from('laporan_riwayat').delete().in('laporan_id', Object.values(idLaporan)))
  await cek(
    await supabase.from('laporan_riwayat').insert(riwayat.map(({ kode, ...r }) => ({ laporan_id: idLaporan[kode], ...r }))),
  )

  console.log(`Data demo terisi: ${kontraktor.length} kontraktor, ${proyek.length} proyek, ${laporan.length} laporan, ${riwayat.length} riwayat.`)
  await cek(await supabase.from('pengingat_log').delete().in('proyek_id', proyek.map((x) => x.id)))
  if (akun) {
    await cek(await supabase.from('pantauan').delete().eq('email', akun.email).contains('proyek_ids', [p.pahlawan.id]))
    await cek(
      await supabase.from('pantauan').insert({
        email: akun.email,
        warga_id: akun.id,
        lat: p.pahlawan.lat,
        lng: p.pahlawan.lng,
        radius_m: 1000,
        proyek_ids: [p.pahlawan.id],
      }),
    )
    console.log(`${MILIK_PELAPOR.length} laporan dan pantauan Jalan Pahlawan dikaitkan ke ${akun.email}.`)
  }
  console.log('Hapus lagi dengan: npm run seed -- --hapus')
}

await (process.argv.includes('--hapus') ? hapus() : isi())
