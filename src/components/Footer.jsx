const TAUTAN = [
  ['Peta proyek', '#peta'],
  ['Lacak laporan', '#laporan'],
  ['Rapor kontraktor', '#rapor'],
  ['Tentang data', '#faq'],
]

export default function Footer() {
  return (
    <footer className="bg-aspal px-4 py-12 text-[#D9D2CC]">
      <div className="mx-auto flex max-w-konten flex-col gap-6 md:flex-row md:justify-between">
        <div>
          <p className="font-judul text-2xl text-white">CekJalan</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm font-semibold text-white">
          {TAUTAN.map(([label, href]) => <a key={label} href={href} className="hover:text-kuning">{label}</a>)}
        </nav>
      </div>
    </footer>
  )
}
