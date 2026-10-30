import { proyekUtama } from '../data'

const BARIS = [
  ['Pekerjaan', 'pekerjaan'], ['Lokasi', 'lokasi'], ['Nilai kontrak', 'nilaiKontrak'], ['Sumber dana', 'sumberDana'],
  ['Pelaksana', 'pelaksana'], ['Selesai dikerjakan', 'selesai'], ['Masa pemeliharaan', 'masaPemeliharaan'],
]
const PITA = { ok: 'bg-hijau text-white', warn: 'bg-kuning text-tinta', exp: 'bg-abu text-white' }

export default function PapanProyek({ data = proyekUtama, className = '' }) {
  return (
    <div className={`overflow-hidden rounded border-2 border-tinta bg-white ${className}`}>
      <div className="flex items-center justify-between gap-3 bg-merah px-4 py-2.5 text-white">
        <span className="text-sm font-bold">Papan informasi proyek</span>
        <span className="text-xs">Kabupaten Sidoarjo</span>
      </div>
      <dl className="px-4">
        {BARIS.map(([label, key]) => (
          <div key={key} className="grid grid-cols-[42%_1fr] gap-3 border-b border-garis py-2 last:border-0">
            <dt className="text-[13px] text-redup">{label}</dt>
            <dd className="text-[13px] font-bold">{data[key]}</dd>
          </div>
        ))}
      </dl>
      <p className={`px-4 py-3 text-[13px] font-bold ${PITA[data.status]}`}>{data.catatan}</p>
    </div>
  )
}
