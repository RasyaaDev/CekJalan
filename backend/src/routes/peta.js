import { Router } from 'express'
import { supabase } from '../supabase.js'
import { statusGaransi, sisaHariGaransi, akhirGaransi } from '../garansi.js'

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
      .neq('status', 'selesai')
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

export default router
