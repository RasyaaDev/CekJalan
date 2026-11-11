import { Router } from 'express'
import { supabase } from '../supabase.js'
import { statusGaransi, sisaHariGaransi, akhirGaransi } from '../garansi.js'
import { STATUS_PUBLIK } from '../laporan.js'

const router = Router()

router.get('/', async (req, res) => {
  const sekarang = new Date()

  const [proyek, laporan] = await Promise.all([
    supabase
      .from('proyek')
      .select('slug,ruas,lat,lng,selesai_pada,masa_pemeliharaan_bulan')
      .not('lat', 'is', null)
      .not('lng', 'is', null),
    supabase
      .from('laporan')
      .select('kode,deskripsi,lat,lng,status')
      .in('status', STATUS_PUBLIK.filter((s) => s !== 'selesai'))
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(100),
  ])

  if (proyek.error) throw proyek.error
  if (laporan.error) throw laporan.error

  res.json({
    data: {
      proyek: (proyek.data ?? []).map((p) => ({
        slug: p.slug,
        nama: p.ruas,
        status: statusGaransi(p, sekarang),
        sisa_hari: sisaHariGaransi(p, sekarang),
        akhir_garansi: akhirGaransi(p)?.toISOString().slice(0, 10) ?? null,
        posisi: [p.lat, p.lng],
      })),
      laporan: (laporan.data ?? []).map((l) => ({
        kode: l.kode,
        nama: l.deskripsi,
        status: l.status,
        posisi: [l.lat, l.lng],
      })),
    },
  })
})

const GRUP = {
  diverifikasi: 'belum',
  diteruskan: 'belum',
  dikerjakan: 'dikerjakan',
  selesai: 'selesai',
}

router.get('/laporan', async (_req, res) => {
  const { data, error } = await supabase
    .from('laporan')
    .select(
      'kode,deskripsi,foto_url,status,lat,lng,dibuat_pada,tenggat_pada,' +
        'proyek:proyek_id(slug,ruas,tahun_anggaran,selesai_pada,masa_pemeliharaan_bulan,kontraktor:kontraktor_id(nama))',
    )
    .in('status', STATUS_PUBLIK)
    .order('dibuat_pada', { ascending: false })
    .limit(500)

  if (error) throw error

  const sekarang = new Date()
  const ringkasan = { belum: 0, dikerjakan: 0, selesai: 0 }

  const laporan = (data ?? []).map((l) => {
    const grup = GRUP[l.status]
    ringkasan[grup]++
    const garansi = statusGaransi(l.proyek, sekarang)
    return {
      kode: l.kode,
      deskripsi: l.deskripsi,
      foto_url: l.foto_url,
      status: l.status,
      grup,
      posisi: l.lat == null || l.lng == null ? null : [l.lat, l.lng],
      dibuat_pada: l.dibuat_pada,
      tenggat_pada: l.tenggat_pada,
      ruas: l.proyek?.ruas ?? null,
      slug_proyek: l.proyek?.slug ?? null,
      tahun_proyek: l.proyek?.tahun_anggaran ?? null,
      garansi,
      akhir_garansi: akhirGaransi(l.proyek)?.toISOString().slice(0, 10) ?? null,
      penanggung_jawab:
        garansi === 'ok' || garansi === 'warn' ? l.proyek?.kontraktor?.nama ?? 'Dinas PU Bina Marga' : 'Dinas PU Bina Marga',
    }
  })

  res.json({
    data: {
      total: laporan.length,
      ringkasan,
      diperbarui_pada: sekarang.toISOString(),
      laporan,
    },
  })
})

export default router
