import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Centang, Ikon, Isian } from '../../components/ui'
import { Galat, gayaTombol } from '../../components/dinas'
import { kirim } from '../../lib/api'

const POIN = [
  ['lokasi', 'Laporan dicek otomatis lewat geotag foto'],
  ['lonceng', 'Pengingat sebelum masa garansi habis'],
  ['surat', 'Teruskan perbaikan ke kontraktor penanggung jawab'],
]

function tujuanAman(lanjut) {
  return lanjut?.startsWith('/dinas') && !lanjut.startsWith('//') ? lanjut : '/dinas'
}

export default function MasukPetugas() {
  const navigate = useNavigate()
  const [param] = useSearchParams()
  const [isian, setIsian] = useState({ akun: '', sandi: '', ingat: true })
  const [proses, setProses] = useState({ jalan: false, galat: null })

  async function masuk(e) {
    e.preventDefault()
    setProses({ jalan: true, galat: null })
    try {
      await kirim('/api/dinas/masuk', { body: { akun: isian.akun.trim(), sandi: isian.sandi, ingat: isian.ingat } })
      navigate(tujuanAman(param.get('lanjut')), { replace: true })
    } catch (galat) {
      setProses({ jalan: false, galat: galat.message })
    }
  }

  return (
    <div className="grid min-h-screen bg-kanvas lg:grid-cols-[600px_1fr]">
      <aside className="flex flex-col justify-between gap-12 bg-navy px-6 py-10 text-white md:px-16 md:py-14">
        <p className="flex items-end gap-3">
          <span className="font-judul text-[28px] leading-none">CekJalan</span>
          <span className="text-[13px] text-teks-menu">Dinas PU</span>
        </p>
        <div className="flex flex-col gap-6">
          <h1 className="font-judul text-[38px] leading-[1.15] md:text-[44px]">Ruang kerja petugas Dinas PU</h1>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-teks-menu">
            Satu tempat untuk memverifikasi laporan warga, memantau masa garansi proyek, dan menagih perbaikan ke kontraktor.
          </p>
          <ul className="flex flex-col gap-4 text-sm">
            {POIN.map(([ikon, teks]) => (
              <li key={teks} className="flex items-center gap-3">
                <Ikon nama={ikon} className="size-[18px] text-kuning" />
                {teks}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-teks-menu">Dinas PU Bina Marga Kabupaten Sidoarjo</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12">
        <form onSubmit={masuk} className="flex w-full max-w-[480px] flex-col gap-5 rounded-md border border-garis-dinas bg-white p-6 md:p-10">
          <div className="flex flex-col gap-2">
            <h2 className="font-judul text-[32px] leading-tight text-navy">Masuk</h2>
            <p className="text-sm leading-normal text-redup">Khusus petugas Dinas PU Bina Marga. Akun dibuat oleh admin dinas.</p>
          </div>
          <Isian id="akun-petugas" label="NIP atau email dinas" required autoComplete="username" value={isian.akun} onChange={(e) => setIsian({ ...isian, akun: e.target.value })} />
          <Isian id="sandi-petugas" label="Kata sandi" type="password" required autoComplete="current-password" value={isian.sandi} onChange={(e) => setIsian({ ...isian, sandi: e.target.value })} />
          <Centang warna="oranye" checked={isian.ingat} onChange={(ingat) => setIsian({ ...isian, ingat })}>
            <span className="text-sm">Ingat perangkat ini</span>
          </Centang>
          <Galat>{proses.galat}</Galat>
          <button type="submit" disabled={proses.jalan || !isian.akun || !isian.sandi} className={gayaTombol.utama}>
            {proses.jalan ? 'Memproses…' : 'Masuk'}
          </button>
          <p className="border-t border-garis-dinas pt-5 text-sm text-redup">
            Lupa kata sandi? Hubungi admin Dinas PU untuk mengatur ulang.
          </p>
        </form>
      </main>
    </div>
  )
}
