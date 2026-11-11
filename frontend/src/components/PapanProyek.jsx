import { useData } from '../lib/api'
import { rupiahSingkat, tanggal } from '../lib/format'
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

export default function PapanProyek({ slug, proyek: data, className = '' }) {
  const ambil = useData(data ? null : slug ? `/api/proyek/${slug}` : '/api/proyek?status=ok,warn&limit=1')
  const proyek = data ?? (Array.isArray(ambil.data) ? ambil.data[0] : ambil.data)
  const { error, loading, ulang } = ambil

  const baris = proyek
    ? [
        ['Pekerjaan', proyek.ruas],
        ['Lokasi', proyek.lokasi ?? 'Belum tercatat'],
        ['Nilai kontrak', rupiahSingkat(proyek.nilai_kontrak)],
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
    <div className={`overflow-hidden rounded-xs border-2 border-tinta bg-white ${className}`}>
      <div className="flex items-center justify-between gap-3 bg-merah px-[18px] py-3 text-white">
        <span className="text-[15px] font-extrabold">Papan informasi proyek</span>
        <span className="text-[13px] font-semibold text-[#f6d4c6]">Kabupaten Sidoarjo</span>
      </div>
      {proyek ? (
        <>
          <dl className="px-[18px] pb-3 pt-2.5">
            {baris.map(([label, nilai]) => (
              <div key={label} className="flex gap-3 border-b border-[#eeeae6] py-[7px] last:border-0">
                <dt className="w-[110px] shrink-0 text-sm text-redup sm:w-[140px]">{label}</dt>
                <dd className="min-w-0 flex-1 text-[15px] font-bold">{nilai}</dd>
              </div>
            ))}
          </dl>
          <p className={`px-[18px] py-3 text-sm font-bold ${PITA[proyek.garansi] ?? 'bg-abu text-white'}`}>
            {catatanGaransi(proyek)}
          </p>
        </>
      ) : (
        <Muat loading={loading} error={error} onUlang={ulang} className="px-[18px]" />
      )}
    </div>
  )
}
