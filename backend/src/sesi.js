import { createHash, randomBytes } from 'node:crypto'
import { supabase } from './supabase.js'

export const NAMA_COOKIE = 'cj_sesi'
const UMUR_MS = 30 * 86_400_000

export const hash = (teks) => createHash('sha256').update(teks).digest('hex')

export function bacaCookie(req, nama) {
  for (const bagian of (req.get('cookie') ?? '').split(';')) {
    const [kunci, ...nilai] = bagian.trim().split('=')
    if (kunci === nama) return decodeURIComponent(nilai.join('='))
  }
  return null
}

export function opsiCookie(maxAge) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

export async function buatSesi(res, wargaId) {
  const token = randomBytes(32).toString('base64url')
  const { error } = await supabase.from('sesi').insert({
    token_hash: hash(token),
    warga_id: wargaId,
    kedaluwarsa: new Date(Date.now() + UMUR_MS).toISOString(),
  })
  if (error) throw error
  res.cookie(NAMA_COOKIE, token, opsiCookie(UMUR_MS))
}

export async function wargaDariSesi(req) {
  const token = bacaCookie(req, NAMA_COOKIE)
  if (!token) return null

  const { data, error } = await supabase
    .from('sesi')
    .select('kedaluwarsa,warga:warga_id(id,email,nama,kecamatan,pengingat_kecamatan)')
    .eq('token_hash', hash(token))
    .maybeSingle()

  if (error) throw error
  if (!data || new Date(data.kedaluwarsa) < new Date()) return null
  return data.warga
}

export async function sesiOpsional(req, _res, next) {
  req.warga = await wargaDariSesi(req)
  next()
}
