import { Router } from 'express'
import { supabase } from '../supabase.js'
import { kirimEmail } from '../email.js'
import { sesiOpsional } from '../sesi.js'
import { batasi } from '../limiter.js'
import { HttpError, angkaDesimal, email as validEmail } from '../validasi.js'

const router = Router()

router.post('/', batasi({ maks: 10, jendelaMs: 15 * 60_000 }), sesiOpsional, async (req, res) => {
  const body = req.body ?? {}
  const alamat = req.warga?.email ?? validEmail(body.email)
  const slug = Array.isArray(body.proyek) ? body.proyek.map(String).slice(0, 50) : []
  if (!slug.length) throw new HttpError(400, 'VALIDASI', 'Pilih minimal satu ruas untuk dipantau')

  const { data: proyek, error } = await supabase.from('proyek').select('id,ruas').in('slug', slug)
  if (error) throw error
  if (!proyek?.length) throw new HttpError(400, 'VALIDASI', 'Ruas yang dipilih tidak ditemukan')

  const opsi = body.kabar ?? {}
  const { data, error: galat } = await supabase
    .from('pantauan')
    .insert({
      email: alamat,
      warga_id: req.warga?.id ?? null,
      lat: body.lat == null ? null : angkaDesimal(body.lat, 'Latitude', { min: -90, max: 90 }),
      lng: body.lng == null ? null : angkaDesimal(body.lng, 'Longitude', { min: -180, max: 180 }),
      radius_m: body.radius_m == null ? 1000 : Math.round(angkaDesimal(body.radius_m, 'Radius', { min: 100, max: 5000 })),
      proyek_ids: proyek.map((p) => p.id),
      kabar_30_hari: opsi.hari30 !== false,
      kabar_7_hari: opsi.hari7 !== false,
      kabar_selesai: opsi.selesai !== false,
      kabar_proyek_baru: opsi.proyekBaru === true,
    })
    .select('id')
    .single()

  if (galat) throw galat

  await kirimEmail({
    ke: alamat,
    subjek: 'Pengingat garansi CekJalan aktif',
    teks: `Kamu sekarang memantau ${proyek.length} ruas: ${proyek.map((p) => p.ruas).join(', ')}.\n\nKami kabari lewat email sebelum masa garansinya habis.`,
  }).catch((e) => console.error('gagal mengirim email pantauan:', e.message))

  res.status(201).json({ data: { id: data.id, ruas: proyek.length } })
})

export default router
