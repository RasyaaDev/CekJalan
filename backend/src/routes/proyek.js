import { Router } from 'express'
import { supabase } from '../supabase.js'
import { denganGaransi } from '../garansi.js'
import { batas, HttpError } from '../validasi.js'

const PILIH = [
  'id', 'slug', 'ruas', 'lokasi', 'nilai_kontrak', 'sumber_dana', 'tahun_anggaran',
  'tanggal_kontrak', 'selesai_pada', 'masa_pemeliharaan_bulan', 'lat', 'lng',
  'sumber_url', 'kontraktor:kontraktor_id(nama)',
].join(',')

function rapikan(row, sekarang) {
  const { kontraktor, ...proyek } = row
  return denganGaransi({ ...proyek, pelaksana: kontraktor?.nama ?? null }, sekarang)
}

const router = Router()

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').replace(/[,()%_\\]/g, ' ').trim().slice(0, 80)
  const limit = batas(req.query.limit)
  const sekarang = new Date()

  let query = supabase
    .from('proyek')
    .select(PILIH)
    .order('selesai_pada', { ascending: false, nullsFirst: false })
    .limit(q ? 200 : limit)

  if (q) query = query.or(`ruas.ilike.%${q}%,lokasi.ilike.%${q}%`)

  const { data, error } = await query
  if (error) throw error

  let hasil = (data ?? []).map((row) => rapikan(row, sekarang))
  if (req.query.status) hasil = hasil.filter((proyek) => proyek.garansi === req.query.status)

  res.json({ data: hasil.slice(0, limit) })
})

router.get('/:slug', async (req, res) => {
  const { data, error } = await supabase
    .from('proyek')
    .select(PILIH)
    .eq('slug', req.params.slug)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Proyek tidak ditemukan')

  res.json({ data: rapikan(data) })
})

export default router
