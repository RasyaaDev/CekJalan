import { Router } from 'express'
import { supabase } from '../supabase.js'
import { denganGaransi } from '../garansi.js'
import { hasilPerbaikan, hitungRapor, saatGaransi } from '../rapor.js'
import { ambilSemua, raporSemua } from '../raporData.js'
import { HttpError, pilihan } from '../validasi.js'

const HARI_MS = 86_400_000
const URUTAN = {
  nilai: (a, b) => (b.skor ?? -Infinity) - (a.skor ?? -Infinity) || b.paket - a.paket || a.nama.localeCompare(b.nama),
  laporan: (a, b) => b.laporan_garansi - a.laporan_garansi || a.nama.localeCompare(b.nama),
  nama: (a, b) => a.nama.localeCompare(b.nama),
}

const router = Router()

router.get('/', async (req, res) => {
  const filter = {
    tahun: req.query.tahun ? Number(req.query.tahun) || 0 : null,
    lokasi: req.query.lokasi ? String(req.query.lokasi) : null,
  }
  const urut = req.query.urut ? pilihan(req.query.urut, 'Urutan', Object.keys(URUTAN)) : 'nilai'
  const data = raporSemua(await ambilSemua(), filter).sort(URUTAN[urut])
  res.json({ data })
})

router.get('/:id', async (req, res) => {
  const semua = await ambilSemua()
  const k = semua.kontraktor.find((x) => x.id === req.params.id)
  if (!k) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Kontraktor tidak ditemukan')

  const sekarang = new Date()
  const peringkat = raporSemua(semua, {}, sekarang).sort(URUTAN.nilai)
  const posisi = peringkat.findIndex((x) => x.id === k.id)

  const proyek = (k.proyek ?? []).map((p) => denganGaransi(p, sekarang))
  const proyekById = new Map(proyek.map((p) => [p.id, p]))
  const laporan = semua.laporan
    .filter((l) => proyekById.has(l.proyek_id))
    .sort((a, b) => new Date(b.dibuat_pada) - new Date(a.dibuat_pada))
  const garansi = laporan.filter((l) => saatGaransi(l, proyekById.get(l.proyek_id)))

  const { data: riwayat, error } = garansi.length
    ? await supabase
        .from('laporan_riwayat')
        .select('laporan_id,dibuat_pada')
        .eq('status', 'diverifikasi')
        .in('laporan_id', garansi.map((l) => l.id))
    : { data: [], error: null }
  if (error) throw error

  const dibuat = new Map(garansi.map((l) => [l.id, new Date(l.dibuat_pada)]))
  const respons = (riwayat ?? []).map((r) => (new Date(r.dibuat_pada) - dibuat.get(r.laporan_id)) / HARI_MS)
  const tahun = proyek.map((p) => p.tahun_anggaran).filter(Boolean)

  res.json({
    data: {
      id: k.id,
      nama: k.nama,
      ...hitungRapor(k.proyek ?? [], laporan, sekarang),
      peringkat: posisi === -1 || peringkat[posisi].skor == null ? null : posisi + 1,
      jumlah_kontraktor: peringkat.filter((x) => x.skor != null).length,
      tahun_awal: tahun.length ? Math.min(...tahun) : null,
      tahun_akhir: tahun.length ? Math.max(...tahun) : null,
      respons_hari: respons.length ? Math.round((respons.reduce((a, b) => a + b, 0) / respons.length) * 10) / 10 : null,
      proyek: proyek
        .sort((a, b) => (b.tahun_anggaran ?? 0) - (a.tahun_anggaran ?? 0))
        .map((p) => {
          const milik = garansi.filter((l) => l.proyek_id === p.id)
          return {
            slug: p.slug,
            ruas: p.ruas,
            tahun_anggaran: p.tahun_anggaran,
            nilai_kontrak: p.nilai_kontrak,
            sumber_url: p.sumber_url,
            garansi: p.garansi,
            akhir_garansi: p.akhir_garansi,
            laporan: milik.length,
            lewat_tenggat: milik.filter((l) => {
              const h = hasilPerbaikan(l, sekarang)
              return h.jatuh_tempo && !h.tepat
            }).length,
          }
        }),
      laporan: garansi.slice(0, 20).map((l) => ({
        kode: l.kode,
        deskripsi: l.deskripsi,
        jenis: l.jenis,
        foto_url: l.foto_url,
        ruas: proyekById.get(l.proyek_id)?.ruas ?? null,
        status: l.status,
        dibuat_pada: l.dibuat_pada,
        ...hasilPerbaikan(l, sekarang),
      })),
    },
  })
})

export default router
