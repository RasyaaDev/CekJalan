import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { LayoutAkun, Pemisah, TombolGoogle } from '../components/Akun'
import { Isian } from '../components/ui'
import { kirim } from '../lib/api'
import { useWarga } from '../lib/auth'

export default function Masuk() {
  const navigate = useNavigate()
  const [param] = useSearchParams()
  const { setWarga } = useWarga()
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [proses, setProses] = useState({ jalan: false, galat: param.get('galat') === 'google' ? 'Masuk dengan Google gagal. Coba lagi.' : null })
  const lanjut = param.get('lanjut')

  async function masuk(e) {
    e.preventDefault()
    setProses({ jalan: true, galat: null })
    try {
      setWarga(await kirim('/api/auth/masuk', { body: { email: email.trim(), sandi } }))
      navigate(lanjut?.startsWith('/') && !lanjut.startsWith('//') && !lanjut.startsWith('/dinas') ? lanjut : '/lacak')
    } catch (galat) {
      setProses({ jalan: false, galat: galat.message })
    }
  }

  return (
    <LayoutAkun>
      <h1 className="font-judul text-[36px] leading-[1.15] text-merah">Masuk</h1>
      <p className="text-[15px] leading-normal text-redup">Masuk untuk melapor kerusakan dan memantau laporanmu.</p>
      <form onSubmit={masuk} className="flex flex-col gap-[18px]">
        <Isian id="email-masuk" label="Email" type="email" required autoComplete="email" placeholder="nama@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Isian id="sandi-masuk" label="Kata sandi" type="password" required autoComplete="current-password" value={sandi} onChange={(e) => setSandi(e.target.value)} />
        {proses.galat && <p role="alert" className="text-sm text-[#b3261e]">{proses.galat}</p>}
        <button
          type="submit"
          disabled={proses.jalan || !email || !sandi}
          className="rounded bg-oranye px-5 py-3 text-base font-bold text-white hover:bg-[#a9380b] disabled:opacity-50"
        >
          {proses.jalan ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
      <Pemisah />
      <TombolGoogle>Masuk dengan Google</TombolGoogle>
      <p className="text-sm text-redup">
        Belum punya akun?{' '}
        <Link to={`/daftar${lanjut ? `?lanjut=${encodeURIComponent(lanjut)}` : ''}`} className="font-bold text-oranye hover:underline">Daftar</Link>
      </p>
    </LayoutAkun>
  )
}
