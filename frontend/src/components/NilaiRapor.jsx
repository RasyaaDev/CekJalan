const GAYA = {
  A: 'bg-hijau text-white',
  B: 'bg-[#5f8f2a] text-white',
  C: 'bg-kuning text-tinta',
  D: 'bg-oranye text-white',
}

export default function NilaiRapor({ nilai, className = 'size-9 text-xl' }) {
  if (!nilai) {
    return (
      <span title="Belum ada laporan yang jatuh tempo" className={`flex items-center justify-center rounded-xs bg-beton font-judul text-redup ${className}`}>
        –
      </span>
    )
  }
  return <span className={`flex items-center justify-center rounded-xs font-judul ${GAYA[nilai]} ${className}`}>{nilai}</span>
}

export function warnaPersen(persen) {
  if (persen == null) return 'bg-isian'
  if (persen >= 90) return 'bg-hijau'
  if (persen >= 70) return 'bg-kuning'
  return 'bg-oranye'
}
