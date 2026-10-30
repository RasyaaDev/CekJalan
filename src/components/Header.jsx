import { useState } from 'react'
import { Tombol } from './ui'

const MENU = ['Peta proyek', 'Lacak laporan', 'Rapor kontraktor']

export default function Header() {
  const [buka, setBuka] = useState(false)
  return (
    <header className="sticky top-0 z-[1000] border-b border-garis bg-white">
      <div className="mx-auto flex max-w-konten items-center justify-between px-4 py-3 md:px-0">
        <a href="#" className="flex items-baseline gap-2">
          <span className="font-judul text-2xl text-merah">CekJalan</span>
          <span className="text-xs text-redup">Sidoarjo</span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {MENU.map((m) => (
            <a key={m} href="#" className="text-[15px] font-semibold hover:text-merah">{m}</a>
          ))}
          <Tombol varian="utama" className="!py-2.5">Lapor kerusakan</Tombol>
        </nav>
        <button className="rounded border border-garis px-3 py-2 text-sm font-semibold md:hidden" onClick={() => setBuka(!buka)} aria-expanded={buka}>
          Menu
        </button>
      </div>
      {buka && (
        <nav className="flex flex-col gap-1 border-t border-garis px-4 py-3 md:hidden">
          {MENU.map((m) => (<a key={m} href="#" className="py-2 font-semibold">{m}</a>))}
          <Tombol varian="utama" className="mt-2">Lapor kerusakan</Tombol>
        </nav>
      )}
    </header>
  )
}
