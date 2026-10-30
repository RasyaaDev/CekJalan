export default function Footer() {
  return (
    <footer className="bg-aspal px-4 py-12 text-[#D9D2CC] md:px-0">
      <div className="mx-auto flex max-w-konten flex-col gap-6 md:flex-row md:justify-between">
        <div>
          <p className="font-judul text-2xl text-white">CekJalan</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm font-semibold text-white">
          {['Peta proyek', 'Lacak laporan', 'Rapor kontraktor', 'Tentang data'].map((m) => <a key={m} href="#" className="hover:text-kuning">{m}</a>)}
        </nav>
      </div>
    </footer>
  )
}
