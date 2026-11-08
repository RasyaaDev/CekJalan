import { Router } from 'express'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { supabase } from '../supabase.js'
import { bolehTransisi, laporanPublik } from '../laporan.js'
import { statusGaransi, telat } from '../garansi.js'
import { admin } from '../admin.js'
import { batasi } from '../limiter.js'
import { HttpError, teks, angkaDesimal, pilihan, nomorWa, batas } from '../validasi.js'

const STATUS = ['masuk', 'diverifikasi', 'diteruskan', 'dikerjakan', 'selesai']
const TENGGAT_HARI = Number(process.env.TENGGAT_HARI) || 14
const HARI_MS = 86_400_000
const FOTO_MAKS = 5 * 1024 * 1024

const folderUpload = fileURLToPath(new URL('../../uploads/', import.meta.url))
mkdirSync(folderUpload, { recursive: true })

const EKSTENSI = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const upload = multer({
  storage: multer.diskStorage({
    destination: folderUpload,
    filename: (_req, file, cb) => cb(null, randomBytes(8).toString('hex') + EKSTENSI[file.mimetype]),
  }),
  limits: { fileSize: FOTO_MAKS },
  fileFilter: (_req, file, cb) => {
    if (!EKSTENSI[file.mimetype]) {
      return cb(new HttpError(400, 'VALIDASI', 'Foto harus berformat jpg, png, atau webp'))
    }
    cb(null, true)
  },
})

const PILIH = [
  'id', 'kode', 'proyek_id', 'deskripsi', 'foto_url', 'status', 'lat', 'lng',
  'dibuat_pada', 'tenggat_pada', 'selesai_pada', 'buka_lagi_count', 'catatan_admin',
  'proyek:proyek_id(ruas,slug,selesai_pada,masa_pemeliharaan_bulan,kontraktor:kontraktor_id(nama))',
].join(',')

function bentuk(row, sekarang = new Date()) {
  const { proyek, ...isi } = laporanPublik(row)
  return {
    ...isi,
    ruas: proyek?.ruas ?? null,
    slug_proyek: proyek?.slug ?? null,
    pelaksana: proyek?.kontraktor?.nama ?? null,
    garansi: statusGaransi(proyek, sekarang),
    telat: telat(row, sekarang),
  }
}

function kodeBaru() {
  return 'CJ-' + randomBytes(4).toString('hex').toUpperCase()
}

function tenggatBaru(dari = new Date()) {
  return new Date(dari.getTime() + TENGGAT_HARI * HARI_MS).toISOString()
}

async function cariProyek(body, lat, lng) {
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

  if (lat == null || lng == null) return null

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
    const d = (proyek.lat - lat) ** 2 + (proyek.lng - lng) ** 2
    if (d < jarak) {
      jarak = d
      terdekat = proyek
    }
  }
  return terdekat?.id ?? null
}

const router = Router()

router.get('/', async (req, res) => {
  const limit = batas(req.query.limit, 50)
  const status = req.query.status ? pilihan(req.query.status, 'Status', STATUS) : null
  const garansi = req.query.garansi ? pilihan(req.query.garansi, 'Garansi', ['ok', 'warn', 'exp']) : null

  let query = supabase
    .from('laporan')
    .select(PILIH)
    .order('dibuat_pada', { ascending: false })
    .limit(req.query.telat === '1' || garansi ? 200 : limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error

  const sekarang = new Date()
  let hasil = (data ?? []).map((row) => bentuk(row, sekarang))
  if (garansi) hasil = hasil.filter((laporan) => laporan.garansi === garansi)
  if (req.query.telat === '1') hasil = hasil.filter((laporan) => laporan.telat)

  res.json({ data: hasil.slice(0, limit) })
})

router.get('/:kode', async (req, res) => {
  const { data, error } = await supabase
    .from('laporan')
    .select(PILIH)
    .eq('kode', req.params.kode)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Laporan tidak ditemukan')

  res.json({ data: bentuk(data) })
})

router.post('/', batasi({ maks: 10, jendelaMs: 60_000 }), upload.single('foto'), async (req, res) => {
  const fotoUrl = req.file ? `/uploads/${req.file.filename}` : null

  try {
    const deskripsi = teks(req.body.deskripsi, 'Deskripsi', { max: 1000 })
    const wa = nomorWa(req.body.wa)
    const nama = req.body.nama ? teks(req.body.nama, 'Nama', { max: 100 }) : null

    let lat = null
    let lng = null
    if (req.body.lat !== undefined && req.body.lat !== '') {
      lat = angkaDesimal(req.body.lat, 'Latitude', { min: -90, max: 90 })
    }
    if (req.body.lng !== undefined && req.body.lng !== '') {
      lng = angkaDesimal(req.body.lng, 'Longitude', { min: -180, max: 180 })
    }
    if ((lat == null) !== (lng == null)) {
      throw new HttpError(400, 'VALIDASI', 'Latitude dan longitude harus diisi bersamaan')
    }

    const proyekId = await cariProyek(req.body, lat, lng)
    let baris = null
    let galatTerakhir = null

    for (let percobaan = 0; percobaan < 3 && !baris; percobaan++) {
      const { data, error } = await supabase
        .from('laporan')
        .insert({
          kode: kodeBaru(),
          proyek_id: proyekId,
          deskripsi,
          foto_url: fotoUrl,
          lat,
          lng,
          pelapor_nama: nama,
          pelapor_wa: wa,
          tenggat_pada: tenggatBaru(),
        })
        .select(PILIH)
        .single()

      if (!error) baris = data
      else if (error.code !== '23505') throw error
      else galatTerakhir = error
    }

    if (!baris) throw galatTerakhir

    res.status(201).json({ data: bentuk(baris) })
  } catch (error) {
    if (req.file) await rm(req.file.path, { force: true }).catch(() => {})
    throw error
  }
})

router.post('/:kode/buka-lagi', batasi({ maks: 5, jendelaMs: 15 * 60_000 }), async (req, res) => {
  const wa = nomorWa(req.body?.wa)
  const { data: laporan, error } = await supabase
    .from('laporan')
    .select('id,status,pelapor_wa,buka_lagi_count')
    .eq('kode', req.params.kode)
    .maybeSingle()

  if (error) throw error
  if (!laporan) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Laporan tidak ditemukan')
  if (laporan.status !== 'selesai') {
    throw new HttpError(409, 'BUKAN_SELESAI', 'Laporan ini belum berstatus selesai')
  }
  if (String(laporan.pelapor_wa ?? '') !== wa) {
    throw new HttpError(403, 'TIDAK_COCOK', 'Nomor WhatsApp tidak cocok dengan pelapor')
  }

  const { data, error: galatUbah } = await supabase
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

  if (galatUbah) throw galatUbah

  res.json({ data: bentuk(data) })
})

router.patch('/:kode', admin, async (req, res) => {
  const body = req.body ?? {}
  const ke = pilihan(body.status, 'Status', STATUS)

  const { data: laporan, error } = await supabase
    .from('laporan')
    .select('id,status,buka_lagi_count')
    .eq('kode', req.params.kode)
    .maybeSingle()

  if (error) throw error
  if (!laporan) throw new HttpError(404, 'TIDAK_DITEMUKAN', 'Laporan tidak ditemukan')
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
    ubah.tenggat_pada = tenggatBaru()
    ubah.buka_lagi_count = (laporan.buka_lagi_count ?? 0) + 1
  }

  const { data, error: galatUbah } = await supabase
    .from('laporan')
    .update(ubah)
    .eq('id', laporan.id)
    .select(PILIH)
    .single()

  if (galatUbah) throw galatUbah

  res.json({ data: bentuk(data) })
})

export default router
