import { supabase } from './supabase.js'

const HARI = 86_400_000
const tanggal = (mundur) => new Date(Date.now() - mundur * HARI).toISOString().slice(0, 10)
const waktu = (mundur) => new Date(Date.now() - mundur * HARI).toISOString()
const nanti = (maju) => new Date(Date.now() + maju * HARI).toISOString()

const { data: kontraktor, error: galatKontraktor } = await supabase
  .from('kontraktor')
  .upsert(
    [
      { nama: 'PT Karya Marga Sejahtera' },
      { nama: 'CV Sumber Rejeki' },
      { nama: 'PT Bangun Aspal Nusantara' },
    ],
    { onConflict: 'nama' },
  )
  .select('id,nama')

if (galatKontraktor) throw galatKontraktor

const idKontraktor = Object.fromEntries(kontraktor.map((k) => [k.nama, k.id]))

const proyekSeed = [
  {
    kode_tender: 'DEMO-PAHLAWAN',
    slug: 'pahlawan',
    ruas: 'Jl. Pahlawan, Sidoarjo',
    lokasi: 'Sidoarjo Kota',
    nilai_kontrak: 12_800_000_000,
    sumber_dana: 'APBD 2025',
    kontraktor_id: idKontraktor['PT Karya Marga Sejahtera'],
    tahun_anggaran: 2025,
    tanggal_kontrak: tanggal(160),
    selesai_pada: tanggal(100),
    masa_pemeliharaan_bulan: 12,
    lat: -7.4478,
    lng: 112.7042,
    sumber_url: null,
  },
  {
    kode_tender: 'DEMO-LINGKAR-TIMUR',
    slug: 'lingkar-timur',
    ruas: 'Jl. Lingkar Timur, Sidoarjo',
    lokasi: 'Sidoarjo Kota',
    nilai_kontrak: 8_450_000_000,
    sumber_dana: 'APBD 2024',
    kontraktor_id: idKontraktor['PT Bangun Aspal Nusantara'],
    tahun_anggaran: 2024,
    tanggal_kontrak: tanggal(260),
    selesai_pada: tanggal(200),
    masa_pemeliharaan_bulan: 6,
    lat: -7.4536,
    lng: 112.7185,
    sumber_url: null,
  },
  {
    kode_tender: 'DEMO-TAMBAK-OSO',
    slug: 'tambak-oso',
    ruas: 'Jl. Tambak Oso, Waru',
    lokasi: 'Waru',
    nilai_kontrak: 3_359_997_593,
    sumber_dana: 'APBD 2025',
    kontraktor_id: idKontraktor['CV Sumber Rejeki'],
    tahun_anggaran: 2025,
    tanggal_kontrak: tanggal(400),
    selesai_pada: tanggal(340),
    masa_pemeliharaan_bulan: 12,
    lat: -7.3512,
    lng: 112.7315,
    sumber_url: null,
  },
  {
    kode_tender: 'DEMO-SIDOKARE',
    slug: 'sidokare-sepande',
    ruas: 'Jl. Sidokare - Sepande',
    lokasi: 'Candi',
    nilai_kontrak: 5_120_000_000,
    sumber_dana: 'APBD 2025',
    kontraktor_id: idKontraktor['PT Karya Marga Sejahtera'],
    tahun_anggaran: 2025,
    tanggal_kontrak: tanggal(30),
    selesai_pada: null,
    masa_pemeliharaan_bulan: null,
    lat: -7.4701,
    lng: 112.6844,
    sumber_url: null,
  },
]

const { data: proyek, error: galatProyek } = await supabase
  .from('proyek')
  .upsert(proyekSeed, { onConflict: 'slug' })
  .select('id,slug')

if (galatProyek) throw galatProyek

const idProyek = Object.fromEntries(proyek.map((p) => [p.slug, p.id]))

const laporanSeed = [
  {
    kode: 'CJ-DEMO01',
    proyek_id: idProyek.pahlawan,
    deskripsi: 'Jalan berlubang cukup dalam di depan SMP, membahayakan pengendara malam.',
    foto_url: '/foto/lubang.jpg',
    status: 'dikerjakan',
    lat: -7.4482,
    lng: 112.7048,
    pelapor_nama: 'Rizky',
    pelapor_wa: '6281234567890',
    dibuat_pada: waktu(4),
    tenggat_pada: nanti(-2),
    selesai_pada: null,
    buka_lagi_count: 0,
    catatan_admin: 'Sudah diteruskan ke pelaksana.',
  },
  {
    kode: 'CJ-DEMO02',
    proyek_id: idProyek['lingkar-timur'],
    deskripsi: 'Retak memanjang di bahu jalan sepanjang kurang lebih 20 meter.',
    foto_url: '/foto/retak.jpg',
    status: 'selesai',
    lat: -7.4541,
    lng: 112.719,
    pelapor_nama: 'Dewi',
    pelapor_wa: '6289876543210',
    dibuat_pada: waktu(20),
    tenggat_pada: waktu(6),
    selesai_pada: waktu(5),
    buka_lagi_count: 0,
    catatan_admin: 'Sudah ditambal oleh pelaksana.',
  },
  {
    kode: 'CJ-DEMO03',
    proyek_id: idProyek['tambak-oso'],
    deskripsi: 'Genangan air setelah hujan tidak surut karena saluran tersumbat.',
    foto_url: '/foto/lubang.jpg',
    status: 'diverifikasi',
    lat: -7.3518,
    lng: 112.732,
    pelapor_nama: null,
    pelapor_wa: '6281112223334',
    dibuat_pada: waktu(2),
    tenggat_pada: nanti(12),
    selesai_pada: null,
    buka_lagi_count: 0,
    catatan_admin: null,
  },
  {
    kode: 'CJ-DEMO04',
    proyek_id: idProyek.pahlawan,
    deskripsi: 'Trotoar ambles di depan pertokoan, perlu dipasang pengaman sementara.',
    foto_url: '/foto/retak.jpg',
    status: 'masuk',
    lat: -7.4471,
    lng: 112.7037,
    pelapor_nama: 'Bagas',
    pelapor_wa: '6285556667778',
    dibuat_pada: waktu(0.2),
    tenggat_pada: nanti(14),
    selesai_pada: null,
    buka_lagi_count: 0,
    catatan_admin: null,
  },
  {
    kode: 'CJ-DEMO05',
    proyek_id: idProyek['sidokare-sepande'],
    deskripsi: 'Aspal mengelupas setelah perbaikan, muncul kerikil lepas di tikungan.',
    foto_url: '/foto/perbaikan-2.jpg',
    status: 'diteruskan',
    lat: -7.4698,
    lng: 112.6849,
    pelapor_nama: 'Sari',
    pelapor_wa: '6287778889990',
    dibuat_pada: waktu(7),
    tenggat_pada: nanti(7),
    selesai_pada: null,
    buka_lagi_count: 2,
    catatan_admin: 'Menunggu jadwal perbaikan ulang.',
  },
]

const { error: galatLaporan } = await supabase
  .from('laporan')
  .upsert(laporanSeed, { onConflict: 'kode' })

if (galatLaporan) throw galatLaporan

console.log(`Seed selesai: ${kontraktor.length} kontraktor, ${proyek.length} proyek, ${laporanSeed.length} laporan.`)
