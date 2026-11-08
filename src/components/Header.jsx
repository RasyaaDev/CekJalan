import { useState } from 'react'
import { Tombol } from './ui'

const MENU = [
  ['Peta proyek', '#peta'],
  ['Lacak laporan', '#laporan'],
  ['Rapor kontraktor', '#rapor'],
]

export default function Header() {
  const [buka, setBuka] = useState(false)
  return (
    <header className="sticky top-0 z-[1000] border-b border-garis bg-white">
      <div className="mx-auto flex max-w-konten items-center justify-between px-4 py-3">
        <a href="#" className="flex items-baseline gap-2">
          <span className="font-judul text-2xl text-merah">CekJalan</span>
          <span className="text-xs text-redup">Sidoarjo</span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {MENU.map(([label, href]) => (
            <a key={label} href={href} className="text-[15px] font-semibold hover:text-merah">{label}</a>
          ))}
          <Tombol varian="utama" href="#lapor" className="!py-2.5">Lapor kerusakan</Tombol>
        </nav>
        <button
          type="button"
          className="rounded border border-garis px-3 py-2 text-sm font-semibold md:hidden"
          onClick={() => setBuka(!buka)}
          aria-expanded={buka}
          aria-controls="menu-mobile"
        >
          Menu
        </button>
      </div>
      {buka && (
        <nav id="menu-mobile" className="flex flex-col gap-1 border-t border-garis px-4 py-3 md:hidden">
          {MENU.map(([label, href]) => (<a key={label} href={href} className="py-2 font-semibold" onClick={() => setBuka(false)}>{label}</a>))}
          <Tombol varian="utama" href="#lapor" className="mt-2">Lapor kerusakan</Tombol>
        </nav>
      )}
    </header>
  )
}
