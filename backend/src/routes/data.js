import { Router } from 'express'
import { supabase } from '../supabase.js'
import { denganGaransi } from '../garansi.js'
import { ambilSemua, raporSemua } from '../raporData.js'
import { HttpError } from '../validasi.js'
import { STATUS_PUBLIK } from '../laporan.js'
import { csv, geojson } from '../ekspor.js'

const HARI_MS = 86_400_000

async function dataProyek() {
  const { data, error } = await supabase
    .from('proyek')
    .select(
      'slug,kode_tender,ruas,lokasi,tahun_anggaran,nilai_kontrak,sumber_dana,selesai_pada,masa_pemeliharaan_bulan,lat,lng,sumber_url,kontraktor:kontraktor_id(nama)',
    )
    .order('tahun_anggaran', { ascending: false })
    .limit(5000)

  if (error) throw error
  const sekarang = new Date()
  return (data ?? []).map(({ kontraktor, ...p }) => {
    const g = denganGaransi(p, sekarang)
    return { ...p, kontraktor: kontraktor?.nama ?? null, akhir_garansi: g.akhir_garansi, status_garansi: g.garansi }
  })
}

async function dataLaporan() {
  const { data, error } = await supabase
    .from('laporan')
    .select('kode,jenis,keparahan,deskripsi,status,dibuat_pada,selesai_pada,lat,lng,proyek:proyek_id(slug,ruas,lokasi)')
    .in('status', STATUS_PUBLIK)
    .order('dibuat_pada', { ascending: false })
    .limit(5000)

  if (error) throw error
  return (data ?? []).map(({ proyek, ...l }) => ({
    ...l,
    proyek: proyek?.slug ?? null,
    ruas: proyek?.ruas ?? null,
    kecamatan: proyek?.lokasi ?? null,
  }))
}

const BERKAS = {
  'proyek.csv': async () => [
    'text/csv',
    csv(await dataProyek(), [
      'slug', 'kode_tender', 'ruas', 'lokasi', 'kontraktor', 'tahun_anggaran', 'nilai_kontrak', 'sumber_dana',
      'selesai_pada', 'masa_pemeliharaan_bulan', 'akhir_garansi', 'status_garansi', 'lat', 'lng', 'sumber_url',
    ]),
  ],
  'proyek.geojson': async () => ['application/geo+json', JSON.stringify(geojson(await dataProyek()))],
  'laporan.csv': async () => [
    'text/csv',
    csv(await dataLaporan(), [
      'kode', 'jenis', 'keparahan', 'deskripsi', 'status', 'dibuat_pada', 'selesai_pada', 'proyek', 'ruas', 'kecamatan', 'lat', 'lng',
    ]),
  ],
  'laporan.geojson': async () => ['application/geo+json', JSON.stringify(geojson(await dataLaporan()))],
  'kontraktor.csv': async () => [
    'text/csv',
    csv(raporSemua(await ambilSemua()), [
      'nama', 'paket', 'nilai_kontrak', 'laporan_garansi', 'tepat_waktu', 'lewat_tenggat', 'persen_tepat', 'rata_hari', 'ditolak', 'nilai',
    ]),
  ],
}

const router = Router()

router.get('/statistik', async (_req, res) => {
  const sekarang = new Date()
  const [proyek, laporan, semua] = await Promise.all([
    supabase.from('proyek').select('nilai_kontrak'),
    supabase
      .from('laporan')
      .select('status,dibuat_pada,selesai_pada,proyek:proyek_id(lokasi)')
      .in('status', STATUS_PUBLIK),
    ambilSemua(),
  ])
  if (proyek.error) throw proyek.error
  if (laporan.error) throw laporan.error

  const selesai = (laporan.data ?? []).filter((l) => l.selesai_pada)
  const sejak = sekarang.getTime() - 30 * HARI_MS
  const perKecamatan = new Map()
  for (const l of laporan.data ?? []) {
    if (new Date(l.dibuat_pada).getTime() < sejak) continue
    const nama = l.proyek?.lokasi ?? 'Belum dicocokkan'
    perKecamatan.set(nama, (perKecamatan.get(nama) ?? 0) + 1)
  }

  res.json({
    data: {
      proyek: proyek.data?.length ?? 0,
      nilai_kontrak: (proyek.data ?? []).reduce((t, p) => t + (p.nilai_kontrak ?? 0), 0),
      laporan_terverifikasi: laporan.data?.length ?? 0,
      rata_hari_perbaikan: selesai.length
        ? Math.round((selesai.reduce((t, l) => t + (new Date(l.selesai_pada) - new Date(l.dibuat_pada)) / HARI_MS, 0) / selesai.length) * 10) / 10
        : null,
      per_kecamatan: [...perKecamatan.entries()]
        .map(([kecamatan, jumlah]) => ({ kecamatan, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah)
        .slice(0, 8),
      kontraktor: raporSemua(semua, {}, sekarang)
        .filter((k) => k.laporan_garansi > 0)
        .sort((a, b) => (b.persen_tepat ?? -1) - (a.persen_tepat ?? -1) || b.laporan_garansi - a.laporan_garansi)
        .slice(0, 5)
        .map(({ id, nama, paket, laporan_garansi, persen_tepat }) => ({ id, nama, paket, laporan_garansi, persen_tepat })),
    },
  })
})

router.get('/ekspor/:berkas', async (req, res) => {
  const buat = BERKAS[req.params.berkas]
  if (!buat) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Dataset tidak ditemukan')
  const [tipe, isi] = await buat()
  res.set('content-type', `${tipe}; charset=utf-8`)
  res.set('content-disposition', `attachment; filename="cekjalan-${req.params.berkas}"`)
  res.send(isi)
})

export default router
