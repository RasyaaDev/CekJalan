import { Router } from 'express'
import { supabase } from '../supabase.js'
import { denganGaransi } from '../garansi.js'
import { jarakMeter } from '../exif.js'
import { angkaDesimal, batas, HttpError } from '../validasi.js'

const PILIH = [
  'id', 'slug', 'ruas', 'lokasi', 'nilai_kontrak', 'sumber_dana', 'tahun_anggaran',
  'tanggal_kontrak', 'selesai_pada', 'masa_pemeliharaan_bulan', 'lat', 'lng',
  'sumber_url', 'updated_at', 'kontraktor:kontraktor_id(nama)',
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
  if (req.query.lokasi) query = query.eq('lokasi', String(req.query.lokasi))
  if (req.query.tahun) query = query.eq('tahun_anggaran', Number(req.query.tahun) || 0)

  const status = req.query.status ? String(req.query.status).split(',') : null
  if (status) query = query.limit(500)

  const { data, error } = await query
  if (error) throw error

  let hasil = (data ?? []).map((row) => rapikan(row, sekarang))
  if (status) hasil = hasil.filter((proyek) => status.includes(proyek.garansi))

  res.json({ data: hasil.slice(0, limit) })
})

router.get('/ringkasan', async (_req, res) => {
  const { data, error } = await supabase
    .from('proyek')
    .select('lokasi,tahun_anggaran,selesai_pada,masa_pemeliharaan_bulan')

  if (error) throw error

  const sekarang = new Date()
  const garansi = { ok: 0, warn: 0, exp: 0 }
  const lokasi = new Set()
  const tahun = new Set()

  for (const proyek of data ?? []) {
    const status = denganGaransi(proyek, sekarang).garansi
    if (status) garansi[status]++
    if (proyek.lokasi) lokasi.add(proyek.lokasi)
    if (proyek.tahun_anggaran) tahun.add(proyek.tahun_anggaran)
  }

  res.json({
    data: {
      total: data?.length ?? 0,
      garansi,
      lokasi: [...lokasi].sort((a, b) => a.localeCompare(b)),
      tahun: [...tahun].sort((a, b) => b - a),
    },
  })
})

router.get('/sekitar', async (req, res) => {
  const lat = angkaDesimal(req.query.lat, 'Latitude', { min: -90, max: 90 })
  const lng = angkaDesimal(req.query.lng, 'Longitude', { min: -180, max: 180 })
  const radius = req.query.radius ? angkaDesimal(req.query.radius, 'Radius', { min: 50, max: 5000 }) : 1000
  const limit = batas(req.query.limit, 20)
  const sekarang = new Date()

  const { data, error } = await supabase
    .from('proyek')
    .select(PILIH)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(1000)

  if (error) throw error

  const hasil = (data ?? [])
    .map((row) => ({ ...rapikan(row, sekarang), jarak_m: Math.round(jarakMeter([lat, lng], [row.lat, row.lng])) }))
    .filter((p) => p.jarak_m <= radius)
    .sort((a, b) => a.jarak_m - b.jarak_m)

  res.json({ data: hasil.slice(0, limit) })
})

router.get('/:slug/riwayat', async (req, res) => {
  const { data: proyek, error } = await supabase
    .from('proyek')
    .select('ruas')
    .eq('slug', req.params.slug)
    .maybeSingle()

  if (error) throw error
  if (!proyek) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Proyek tidak ditemukan')

  const { data, error: galat } = await supabase
    .from('proyek')
    .select('slug,kode_tender,tahun_anggaran,nilai_kontrak,sumber_dana,sumber_url,kontraktor:kontraktor_id(nama)')
    .eq('ruas', proyek.ruas)
    .order('tahun_anggaran', { ascending: true, nullsFirst: true })

  if (galat) throw galat

  res.json({
    data: (data ?? []).map(({ kontraktor, ...paket }) => ({ ...paket, pelaksana: kontraktor?.nama ?? null })),
  })
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
