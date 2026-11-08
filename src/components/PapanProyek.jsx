import { useData } from '../lib/api'
import { rupiah, tanggal } from '../lib/format'
import { Muat } from './ui'

const PITA = { ok: 'bg-hijau text-white', warn: 'bg-kuning text-tinta', exp: 'bg-abu text-white' }

function catatanGaransi(proyek) {
  if (proyek.garansi === 'ok') {
    return `Masih garansi sampai ${tanggal(proyek.akhir_garansi)}. Sisa ${proyek.sisa_hari} hari.`
  }
  if (proyek.garansi === 'warn') {
    return `Garansi hampir habis: ${tanggal(proyek.akhir_garansi)} (${proyek.sisa_hari} hari lagi).`
  }
  if (proyek.garansi === 'exp') {
    return `Garansi habis ${tanggal(proyek.akhir_garansi)}. Perbaikan masuk anggaran Dinas PU.`
  }
  return 'Masa pemeliharaan belum tercatat.'
}

export default function PapanProyek({ slug = 'pahlawan', className = '' }) {
  const { data: proyek, error, loading, ulang } = useData(`/api/proyek/${slug}`)

  const baris = proyek
    ? [
        ['Pekerjaan', proyek.ruas],
        ['Lokasi', proyek.lokasi ?? 'Belum tercatat'],
        ['Nilai kontrak', rupiah(proyek.nilai_kontrak)],
        ['Sumber dana', proyek.sumber_dana ?? 'Belum tercatat'],
        ['Pelaksana', proyek.pelaksana ?? 'Belum tercatat'],
        ['Selesai dikerjakan', tanggal(proyek.selesai_pada)],
        [
          'Masa pemeliharaan',
          proyek.masa_pemeliharaan_bulan == null ? 'Belum tercatat' : `${proyek.masa_pemeliharaan_bulan} bulan`,
        ],
      ]
    : []

  return (
    <div className={`overflow-hidden rounded border-2 border-tinta bg-white ${className}`}>
      <div className="flex items-center justify-between gap-3 bg-merah px-4 py-2.5 text-white">
        <span className="text-sm font-bold">Papan informasi proyek</span>
        <span className="text-xs">Kabupaten Sidoarjo</span>
      </div>
      {proyek ? (
        <>
          <dl className="px-4">
            {baris.map(([label, nilai]) => (
              <div key={label} className="grid grid-cols-[42%_1fr] gap-3 border-b border-garis py-2 last:border-0">
                <dt className="text-[13px] text-redup">{label}</dt>
                <dd className="text-[13px] font-bold">{nilai}</dd>
              </div>
            ))}
          </dl>
          <p className={`px-4 py-3 text-[13px] font-bold ${PITA[proyek.garansi] ?? 'bg-abu text-white'}`}>
            {catatanGaransi(proyek)}
          </p>
        </>
      ) : (
        <Muat loading={loading} error={error} onUlang={ulang} className="px-4" />
      )}
    </div>
  )
}
