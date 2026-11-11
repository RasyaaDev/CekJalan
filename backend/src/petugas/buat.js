import { randomBytes } from 'node:crypto'
import { supabase } from '../supabase.js'
import { hashSandi } from '../petugas.js'
import { email as validEmail, teks } from '../validasi.js'

const arg = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=')
    return [k, v.join('=')]
  }),
)

const alamat = validEmail(arg.email)
const nama = teks(arg.nama, 'Nama', { max: 100 })
const sandi = process.env.PETUGAS_SANDI || randomBytes(9).toString('base64url')

const { error } = await supabase
  .from('petugas')
  .insert({ email: alamat, nama, nip: arg.nip || null, sandi_hash: hashSandi(sandi) })

if (error) {
  console.error(error.code === '23505' ? 'Email atau NIP sudah terdaftar' : error.message)
  process.exit(1)
}
console.log(`Petugas ${nama} <${alamat}> dibuat.`)
if (!process.env.PETUGAS_SANDI) console.log(`Kata sandi sementara: ${sandi}`)
