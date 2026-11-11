import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Ikon, Tombol } from './ui'
import { useWarga } from '../lib/auth'

const MENU = [
  ['Peta proyek', '/peta', '/proyek'],
  ['Lacak laporan', '/lacak'],
  ['Rapor kontraktor', '/rapor'],
]

export default function Header() {
  const [buka, setBuka] = useState(false)
  const { pathname } = useLocation()
  const { warga, keluar } = useWarga()
  const aktif = (to, alias) => pathname.startsWith(to) || (alias && pathname.startsWith(alias))
  return (
    <header className="sticky top-0 z-[1000] border-b border-garis bg-white">
      <div className="mx-auto flex h-[72px] max-w-konten items-center justify-between px-4">
        <Link to="/" className="flex items-end gap-2.5">
          <span className="font-judul text-[30px] leading-none text-merah">CekJalan</span>
          <span className="text-sm font-semibold text-redup">Sidoarjo</span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {MENU.map(([label, to, alias]) => (
            <NavLink key={label} to={to} aria-current={aktif(to, alias) ? 'page' : undefined} className="group flex flex-col items-center gap-1.5 pt-[9px] text-base font-semibold">
              <span className={aktif(to, alias) ? 'text-merah' : 'group-hover:text-merah'}>{label}</span>
              <span className={`h-[3px] w-full ${aktif(to, alias) ? 'bg-merah' : ''}`} />
            </NavLink>
          ))}
          <Tombol to="/lapor" className="text-base">Lapor kerusakan</Tombol>
          <span className="h-6 w-px bg-[#d9d2cc]" />
          {warga ? (
            <>
              <span className="flex items-center gap-1.5 px-1.5 text-[15px] font-semibold">
                <Ikon nama="pengguna" className="size-[18px]" />
                {warga.nama?.split(' ')[0] ?? warga.email}
              </span>
              <button type="button" onClick={keluar} className="rounded border-[1.5px] border-tinta px-5 py-3 text-base font-bold hover:bg-beton">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/masuk" className="flex items-center gap-1.5 px-1.5 text-[15px] font-semibold hover:text-merah">
                <Ikon nama="pengguna" className="size-[18px]" />
                Masuk
              </Link>
              <Tombol to="/daftar" varian="garis" className="text-base">Daftar</Tombol>
            </>
          )}
        </nav>
        <button
          type="button"
          className="rounded border border-garis px-3 py-2 text-sm font-semibold lg:hidden"
          onClick={() => setBuka(!buka)}
          aria-expanded={buka}
          aria-controls="menu-mobile"
        >
          Menu
        </button>
      </div>
      {buka && (
        <nav id="menu-mobile" className="flex flex-col gap-1 border-t border-garis px-4 py-3 lg:hidden">
          {MENU.map(([label, to, alias]) => (
            <NavLink key={label} to={to} className={`py-2 font-semibold ${aktif(to, alias) ? 'text-merah' : ''}`} onClick={() => setBuka(false)}>
              {label}
            </NavLink>
          ))}
          {warga ? (
            <button type="button" className="py-2 text-left font-semibold" onClick={() => { keluar(); setBuka(false) }}>
              Keluar ({warga.nama?.split(' ')[0] ?? warga.email})
            </button>
          ) : (
            <Link to="/masuk" className="py-2 font-semibold" onClick={() => setBuka(false)}>Masuk</Link>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Tombol to="/lapor" onClick={() => setBuka(false)}>Lapor kerusakan</Tombol>
            {!warga && <Tombol to="/daftar" varian="garis" onClick={() => setBuka(false)}>Daftar</Tombol>}
          </div>
        </nav>
      )}
    </header>
  )
}
