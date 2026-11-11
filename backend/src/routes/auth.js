import { Router } from 'express'
import { randomBytes, randomInt } from 'node:crypto'
import { supabase } from '../supabase.js'
import { kirimEmail } from '../email.js'
import { batasi } from '../limiter.js'
import { NAMA_COOKIE, bacaCookie, buatSesi, hash, opsiCookie, wargaDariSesi } from '../sesi.js'
import { HttpError, email as validEmail, teks } from '../validasi.js'
import { cocokSandi, hashSandi } from '../petugas.js'

const OTP_MS = 10 * 60_000
const JEDA_KIRIM_MS = 42_000
const MAKS_PERCOBAAN = 5
const COOKIE_STATE = 'cj_google_state'

const router = Router()

const MAKS_KECAMATAN = 60

function sandiBaru(nilai) {
  const sandi = typeof nilai === 'string' ? nilai : ''
  if (sandi.length < 8 || sandi.length > 200) throw new HttpError(400, 'VALIDASI', 'Kata sandi minimal 8 karakter')
  return sandi
}

router.post('/daftar', batasi({ maks: 5, jendelaMs: 15 * 60_000 }), async (req, res) => {
  const alamat = validEmail(req.body?.email)
  if (req.body?.setuju !== true) {
    throw new HttpError(400, 'VALIDASI', 'Setujui Syarat Penggunaan dan Kebijakan Privasi dulu')
  }
  const profil = {
    nama: teks(req.body?.nama, 'Nama lengkap', { max: 100 }),
    kecamatan: req.body?.kecamatan ? teks(req.body.kecamatan, 'Kecamatan', { max: MAKS_KECAMATAN }) : null,
    pengingat_kecamatan: req.body?.pengingat_kecamatan === true,
    sandi_hash: hashSandi(sandiBaru(req.body?.sandi)),
  }

  const { data: ada, error: galatAda } = await supabase.from('warga').select('sandi_hash').eq('email', alamat).maybeSingle()
  if (galatAda) throw galatAda
  if (ada?.sandi_hash) throw new HttpError(409, 'SUDAH_DAFTAR', 'Email ini sudah terdaftar. Silakan masuk.')

  const { data: terakhir, error } = await supabase
    .from('otp')
    .select('dibuat_pada')
    .eq('email', alamat)
    .order('dibuat_pada', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (terakhir && Date.now() - new Date(terakhir.dibuat_pada).getTime() < JEDA_KIRIM_MS) {
    throw new HttpError(429, 'TERLALU_CEPAT', 'Tunggu sebentar sebelum meminta kode baru')
  }

  const kode = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const { error: galat } = await supabase.from('otp').insert({
    email: alamat,
    kode_hash: hash(`${alamat}:${kode}`),
    profil,
    kedaluwarsa: new Date(Date.now() + OTP_MS).toISOString(),
  })
  if (galat) throw galat

  await kirimEmail({
    ke: alamat,
    subjek: `Kode verifikasi CekJalan: ${kode}`,
    teks: `Kode verifikasi akun CekJalan kamu: ${kode}\n\nBerlaku 10 menit. Abaikan email ini kalau kamu tidak mendaftar.`,
  })

  res.json({ data: { terkirim: true, jeda_detik: JEDA_KIRIM_MS / 1000 } })
})

router.post('/verifikasi', batasi({ maks: 10, jendelaMs: 15 * 60_000 }), async (req, res) => {
  const alamat = validEmail(req.body?.email)
  const kode = String(req.body?.kode ?? '').replace(/\D/g, '')
  if (kode.length !== 6) throw new HttpError(400, 'VALIDASI', 'Kode verifikasi harus 6 angka')

  const { data: otp, error } = await supabase
    .from('otp')
    .select('id,kode_hash,profil,percobaan,kedaluwarsa')
    .eq('email', alamat)
    .order('dibuat_pada', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!otp?.profil?.sandi_hash || new Date(otp.kedaluwarsa) < new Date() || otp.percobaan >= MAKS_PERCOBAAN) {
    throw new HttpError(400, 'OTP_KEDALUWARSA', 'Kode sudah tidak berlaku. Minta kode baru.')
  }
  if (otp.kode_hash !== hash(`${alamat}:${kode}`)) {
    await supabase.from('otp').update({ percobaan: otp.percobaan + 1 }).eq('id', otp.id)
    throw new HttpError(400, 'OTP_SALAH', 'Kode verifikasi salah')
  }
  await supabase.from('otp').update({ percobaan: MAKS_PERCOBAAN }).eq('id', otp.id)

  const { data: ada, error: galatCari } = await supabase.from('warga').select('id,sandi_hash').eq('email', alamat).maybeSingle()
  if (galatCari) throw galatCari
  if (ada?.sandi_hash) throw new HttpError(409, 'SUDAH_DAFTAR', 'Email ini sudah terdaftar. Silakan masuk.')

  let wargaId = ada?.id
  if (wargaId) {
    const { error: galatUbah } = await supabase.from('warga').update(otp.profil).eq('id', wargaId).is('sandi_hash', null)
    if (galatUbah) throw galatUbah
  } else {
    const { data, error: galatBuat } = await supabase
      .from('warga')
      .insert({ email: alamat, ...otp.profil })
      .select('id')
      .single()
    if (galatBuat) throw galatBuat
    wargaId = data.id
  }

  await buatSesi(res, wargaId)
  res.json({ data: await wargaDariSesiId(wargaId) })
})

const SANDI_PALSU = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(128)

router.post('/masuk', batasi({ maks: 10, jendelaMs: 15 * 60_000 }), async (req, res) => {
  const alamat = validEmail(req.body?.email)
  const sandi = typeof req.body?.sandi === 'string' ? req.body.sandi : ''

  const { data, error } = await supabase.from('warga').select('id,sandi_hash,google_sub').eq('email', alamat).maybeSingle()
  if (error) throw error

  const cocok = cocokSandi(sandi, data?.sandi_hash ?? SANDI_PALSU)
  if (data && !data.sandi_hash && data.google_sub) {
    throw new HttpError(400, 'AKUN_GOOGLE', 'Akun ini dibuat lewat Google. Masuk dengan Google.')
  }
  if (!data || !cocok) throw new HttpError(401, 'TIDAK_AUTORISASI', 'Email atau kata sandi salah')

  await buatSesi(res, data.id)
  res.json({ data: await wargaDariSesiId(data.id) })
})

router.get('/saya', async (req, res) => {
  res.json({ data: await wargaDariSesi(req) })
})

router.post('/keluar', async (req, res) => {
  const token = bacaCookie(req, NAMA_COOKIE)
  if (token) await supabase.from('sesi').delete().eq('token_hash', hash(token))
  res.clearCookie(NAMA_COOKIE, opsiCookie(0))
  res.json({ data: { keluar: true } })
})

function konfigurasiGoogle() {
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: rahasia, GOOGLE_REDIRECT_URI: redirect } = process.env
  if (!id || !rahasia || !redirect) {
    throw new HttpError(503, 'BELUM_DIKONFIGURASI', 'Login Google belum diatur di server.')
  }
  return { id, rahasia, redirect }
}

router.get('/google', (req, res) => {
  const { id, redirect } = konfigurasiGoogle()
  const state = randomBytes(16).toString('base64url')
  res.cookie(COOKIE_STATE, state, opsiCookie(10 * 60_000))
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({
    client_id: id,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  res.redirect(url.toString())
})

router.get('/google/callback', async (req, res) => {
  const { id, rahasia, redirect } = konfigurasiGoogle()
  const tujuan = process.env.FRONTEND_URL ?? '/'
  const state = bacaCookie(req, COOKIE_STATE)
  res.clearCookie(COOKIE_STATE, opsiCookie(0))

  if (!req.query.code || !state || state !== req.query.state) {
    return res.redirect(`${tujuan}masuk?galat=google`)
  }

  const token = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: String(req.query.code),
      client_id: id,
      client_secret: rahasia,
      redirect_uri: redirect,
      grant_type: 'authorization_code',
    }),
  }).then((r) => r.json())

  if (!token.access_token) return res.redirect(`${tujuan}masuk?galat=google`)

  const profil = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${token.access_token}` },
  }).then((r) => r.json())

  if (!profil.sub || !profil.email || profil.email_verified === false) {
    return res.redirect(`${tujuan}masuk?galat=google`)
  }

  const alamat = profil.email.toLowerCase()
  let { data: ada, error } = await supabase.from('warga').select('id,google_sub').eq('google_sub', profil.sub).maybeSingle()
  if (error) throw error
  if (!ada) {
    ;({ data: ada, error } = await supabase.from('warga').select('id,google_sub').eq('email', alamat).maybeSingle())
    if (error) throw error
  }

  let wargaId = ada?.id
  if (!wargaId) {
    const { data, error: galat } = await supabase
      .from('warga')
      .insert({ email: alamat, nama: profil.name ?? null, google_sub: profil.sub })
      .select('id')
      .single()
    if (galat) throw galat
    wargaId = data.id
  } else if (!ada.google_sub) {
    await supabase.from('warga').update({ google_sub: profil.sub }).eq('id', wargaId)
  }

  await buatSesi(res, wargaId)
  res.redirect(tujuan)
})

export default router
