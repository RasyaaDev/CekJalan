import { Router } from 'express'
import { supabase } from '../supabase.js'
import { statusGaransi } from '../garansi.js'

const router = Router()

const HARI_MS = 86_400_000

router.get('/', async (req, res) => {
  const [kontraktor, laporan] = await Promise.all([
    supabase.from('kontraktor').select('id,nama,proyek(id,selesai_pada,masa_pemeliharaan_bulan)'),
    supabase.from('laporan').select('proyek_id,dibuat_pada,selesai_pada,buka_lagi_count'),
  ])

  if (kontraktor.error) throw kontraktor.error
  if (laporan.error) throw laporan.error

  const proyekKeKontraktor = new Map()
  const proyekById = new Map()
  for (const k of kontraktor.data ?? []) {
    for (const p of k.proyek ?? []) {
      proyekKeKontraktor.set(p.id, k.id)
      proyekById.set(p.id, p)
    }
  }

  const data = (kontraktor.data ?? []).map((k) => {
    const proyek = k.proyek ?? []
    const idProyek = new Set(proyek.map((p) => p.id))
    const terkait = (laporan.data ?? []).filter((l) => idProyek.has(l.proyek_id))

    const rusakSaatGaransi = terkait.filter((l) => {
      const status = statusGaransi(proyekById.get(l.proyek_id), new Date(l.dibuat_pada))
      return status === 'ok' || status === 'warn'
    }).length

    const selesai = terkait.filter((l) => l.selesai_pada)
    const rataHari = selesai.length
      ? Math.round(
          selesai.reduce((total, l) => total + (new Date(l.selesai_pada) - new Date(l.dibuat_pada)) / HARI_MS, 0) /
            selesai.length,
        )
      : null

    const ditolak = terkait.reduce((total, l) => total + (l.buka_lagi_count ?? 0), 0)

    return {
      nama: k.nama,
      ruas: proyek.length,
      rusak: rusakSaatGaransi,
      waktu: rataHari,
      ditolak,
      buruk: ditolak >= 2,
    }
  })

  res.json({ data })
})

export default router
