import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { IsianOtp, LayoutAkun, Pemisah, TombolGoogle, teksMundur, useHitungMundur } from '../components/Akun'
import { Centang, Ikon, Isian } from '../components/ui'
import { kirim } from '../lib/api'
import { useWarga } from '../lib/auth'

const KECAMATAN = [
  'Balongbendo', 'Buduran', 'Candi', 'Gedangan', 'Jabon', 'Krembung', 'Krian', 'Porong', 'Prambon',
  'Sedati', 'Sidoarjo', 'Sukodono', 'Taman', 'Tanggulangin', 'Tarik', 'Tulangan', 'Waru', 'Wonoayu',
]

const tombol = 'rounded bg-oranye px-5 py-3 text-base font-bold text-white hover:bg-[#a9380b] disabled:opacity-50'

function Verifikasi({ email, onKirimUlang, sisa, onKembali }) {
  const navigate = useNavigate()
  const [param] = useSearchParams()
  const { setWarga } = useWarga()
  const [kode, setKode] = useState('')
  const [proses, setProses] = useState({ jalan: false, galat: null })
  const lanjut = param.get('lanjut')

  async function verifikasi(e) {
    e.preventDefault()
    setProses({ jalan: true, galat: null })
    try {
      setWarga(await kirim('/api/auth/verifikasi', { body: { email, kode } }))
      navigate(lanjut?.startsWith('/') && !lanjut.startsWith('//') ? lanjut : '/lacak')
    } catch (galat) {
      setProses({ jalan: false, galat: galat.message })
    }
  }

  async function ulang() {
    setProses({ jalan: false, galat: null })
    try {
      await onKirimUlang()
    } catch (galat) {
      setProses({ jalan: false, galat: galat.message })
    }
  }

  return (
    <>
      <h1 className="font-judul text-[36px] leading-[1.15] text-merah">Cek email kamu</h1>
      <p className="text-[15px] leading-normal text-redup">
        Kode verifikasi 6 angka dikirim ke <strong className="text-tinta">{email}</strong>. Cek juga folder Spam.
      </p>
      <form onSubmit={verifikasi} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-semibold">Kode verifikasi</p>
          <IsianOtp nilai={kode} onChange={setKode} />
          <p className="flex flex-wrap gap-1.5 text-[13px] leading-normal text-redup">
            Belum masuk?
            {sisa > 0 ? (
              <span className="font-semibold">Kirim ulang dalam {teksMundur(sisa)}</span>
            ) : (
              <button type="button" onClick={ulang} className="font-semibold text-oranye hover:underline">Kirim ulang kode</button>
            )}
          </p>
        </div>
        {proses.galat && <p role="alert" className="text-sm text-[#b3261e]">{proses.galat}</p>}
        <button type="submit" disabled={proses.jalan || kode.length !== 6} className={tombol}>
          {proses.jalan ? 'Memproses…' : 'Verifikasi dan masuk'}
        </button>
      </form>
      <button type="button" onClick={onKembali} className="self-start text-sm font-semibold text-redup hover:text-tinta">
        ← Ubah data pendaftaran
      </button>
    </>
  )
}

export default function Daftar() {
  const [param] = useSearchParams()
  const [isian, setIsian] = useState({ nama: '', email: '', sandi: '', kecamatan: 'Sidoarjo', pengingat: true, setuju: false })
  const [terkirim, setTerkirim] = useState(false)
  const [sisa, setSisa] = useHitungMundur()
  const [proses, setProses] = useState({ jalan: false, galat: null })
  const ubah = (kunci) => (nilai) => setIsian((lama) => ({ ...lama, [kunci]: nilai }))

  async function kirimKode() {
    const hasil = await kirim('/api/auth/daftar', {
      body: {
        email: isian.email.trim(),
        nama: isian.nama.trim(),
        sandi: isian.sandi,
        kecamatan: isian.kecamatan,
        pengingat_kecamatan: isian.pengingat,
        setuju: isian.setuju,
      },
    })
    setSisa(hasil.jeda_detik)
  }

  async function daftar(e) {
    e.preventDefault()
    setProses({ jalan: true, galat: null })
    try {
      await kirimKode()
      setTerkirim(true)
      setProses({ jalan: false, galat: null })
    } catch (galat) {
      setProses({ jalan: false, galat: galat.message })
    }
  }

  if (terkirim) {
    return (
      <LayoutAkun>
        <Verifikasi email={isian.email.trim()} sisa={sisa} onKirimUlang={kirimKode} onKembali={() => setTerkirim(false)} />
      </LayoutAkun>
    )
  }

  const lanjut = param.get('lanjut')
  const sandiPendek = isian.sandi.length > 0 && isian.sandi.length < 8

  return (
    <LayoutAkun>
      <h1 className="font-judul text-[36px] leading-[1.15] text-merah">Daftar</h1>
      <p className="text-[15px] leading-normal text-redup">Cukup 1 menit. Data pribadimu tidak ditampilkan ke publik maupun petugas.</p>
      <form onSubmit={daftar} className="flex flex-col gap-[18px]">
        <Isian id="nama-daftar" label="Nama lengkap" required autoComplete="name" maxLength={100} value={isian.nama} onChange={(e) => ubah('nama')(e.target.value)} />
        <Isian id="email-daftar" label="Email" type="email" required autoComplete="email" placeholder="nama@gmail.com" value={isian.email} onChange={(e) => ubah('email')(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <Isian id="sandi-daftar" label="Kata sandi" type="password" required minLength={8} autoComplete="new-password" value={isian.sandi} onChange={(e) => ubah('sandi')(e.target.value)} />
          <span className={`text-xs ${sandiPendek ? 'text-[#b3261e]' : 'text-redup'}`}>Minimal 8 karakter.</span>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Kecamatan tempat tinggal</span>
          <span className="relative">
            <select value={isian.kecamatan} onChange={(e) => ubah('kecamatan')(e.target.value)} className="w-full appearance-none rounded border border-[#d9d2cc] bg-white px-3.5 py-3 text-[15px]">
              {KECAMATAN.map((k) => <option key={k}>{k}</option>)}
            </select>
            <Ikon nama="chevron" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2" />
          </span>
        </label>
        <Centang warna="oranye" className="items-start" checked={isian.pengingat} onChange={ubah('pengingat')}>
          <span className="text-sm">Kirim pengingat garansi untuk jalan di kecamatanku</span>
        </Centang>
        <Centang warna="oranye" className="items-start" checked={isian.setuju} onChange={ubah('setuju')}>
          <span className="text-sm">
            Saya setuju dengan <strong className="text-oranye">Syarat Penggunaan</strong> dan <strong className="text-oranye">Kebijakan Privasi</strong>
          </span>
        </Centang>
        {proses.galat && <p role="alert" className="text-sm text-[#b3261e]">{proses.galat}</p>}
        <button
          type="submit"
          disabled={proses.jalan || !isian.setuju || !isian.nama || !isian.email || isian.sandi.length < 8}
          className={tombol}
        >
          {proses.jalan ? 'Mengirim kode…' : 'Daftar'}
        </button>
      </form>
      <Pemisah />
      <TombolGoogle>Daftar dengan Google</TombolGoogle>
      <p className="text-sm text-redup">
        Sudah punya akun?{' '}
        <Link to={`/masuk${lanjut ? `?lanjut=${encodeURIComponent(lanjut)}` : ''}`} className="font-bold text-oranye hover:underline">Masuk</Link>
      </p>
    </LayoutAkun>
  )
}
