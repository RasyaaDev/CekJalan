import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { supabase } from './supabase.js'
import { bacaCookie, hash, opsiCookie } from './sesi.js'
import { HttpError } from './validasi.js'

export const COOKIE_PETUGAS = 'cj_dinas'
const SESI_SINGKAT_MS = 12 * 3_600_000
const SESI_INGAT_MS = 30 * 86_400_000

export function hashSandi(sandi) {
  const garam = randomBytes(16).toString('hex')
  return `scrypt$${garam}$${scryptSync(sandi, garam, 64).toString('hex')}`
}

export function cocokSandi(sandi, simpanan) {
  const [jenis, garam, isi] = String(simpanan ?? '').split('$')
  if (jenis !== 'scrypt' || !garam || !isi) return false
  const a = scryptSync(String(sandi), garam, 64)
  const b = Buffer.from(isi, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function buatSesiPetugas(res, petugasId, ingat) {
  const token = randomBytes(32).toString('base64url')
  const umur = ingat ? SESI_INGAT_MS : SESI_SINGKAT_MS
  const { error } = await supabase.from('sesi_petugas').insert({
    token_hash: hash(token),
    petugas_id: petugasId,
    kedaluwarsa: new Date(Date.now() + umur).toISOString(),
  })
  if (error) throw error
  const opsi = opsiCookie(umur)
  if (!ingat) delete opsi.maxAge
  res.cookie(COOKIE_PETUGAS, token, opsi)
}

function kunciAdmin(req) {
  const kunci = process.env.ADMIN_KEY
  const header = req.get('authorization') ?? ''
  if (!kunci || !header.startsWith('Bearer ')) return false
  const a = Buffer.from(header.slice(7))
  const b = Buffer.from(kunci)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function petugasDariSesi(req) {
  if (kunciAdmin(req)) return { id: null, nama: 'Admin', email: null }
  const token = bacaCookie(req, COOKIE_PETUGAS)
  if (!token) return null

  const { data, error } = await supabase
    .from('sesi_petugas')
    .select('kedaluwarsa,petugas:petugas_id(id,nama,email,nip,aktif)')
    .eq('token_hash', hash(token))
    .maybeSingle()

  if (error) throw error
  if (!data || new Date(data.kedaluwarsa) < new Date() || !data.petugas?.aktif) return null
  const { aktif, ...petugas } = data.petugas
  return petugas
}

export async function wajibPetugas(req, _res, next) {
  req.petugas = await petugasDariSesi(req)
  if (!req.petugas) throw new HttpError(401, 'TIDAK_AUTORISASI', 'Masuk sebagai petugas dulu')
  next()
}
