import { useState } from 'react'
import { useNavigate } from 'react-router'
import NilaiRapor, { warnaPersen } from '../components/NilaiRapor'
import { Ikon, Muat, Tag } from '../components/ui'
import { useData } from '../lib/api'
import { rupiahSingkat } from '../lib/format'

const URUT = [
  ['nilai', 'Urutkan: nilai terbaik'],
  ['laporan', 'Urutkan: laporan terbanyak'],
  ['nama', 'Urutkan: nama'],
]
const KOLOM = ['Kontraktor', 'Paket', 'Nilai kontrak', 'Laporan masuk', 'Diperbaiki tepat waktu', 'Rata-rata perbaikan', 'Nilai']

function Pilihan({ label, value, onChange, children }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded border border-isian bg-white py-2.5 pl-3.5 pr-9 text-sm font-semibold"
      >
        {children}
      </select>
      <Ikon nama="chevron" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
    </label>
  )
}

export default function RaporKontraktor() {
  const navigate = useNavigate()
  const [tahun, setTahun] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [urut, setUrut] = useState('nilai')
  const ringkasan = useData('/api/proyek/ringkasan')

  const param = new URLSearchParams({ urut })
  if (tahun) param.set('tahun', tahun)
  if (lokasi) param.set('lokasi', lokasi)
  const { data, error, loading, ulang } = useData(`/api/kontraktor?${param}`)

  const daftarTahun = ringkasan.data?.tahun ?? []
  const rentang = daftarTahun.length ? `${Math.min(...daftarTahun)}–${Math.max(...daftarTahun)}` : ''

  return (
    <div className="mx-auto flex max-w-konten flex-col px-4 pb-24 pt-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-judul text-[36px] leading-tight text-merah md:text-5xl">Rapor kontraktor</h1>
        <Tag />
      </div>
      <p className="mt-3 max-w-[820px] text-lg leading-normal text-redup">
        Rekam jejak kontraktor yang mengerjakan jalan kabupaten di Sidoarjo. Dihitung dari laporan warga selama masa pemeliharaan.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Pilihan label="Tahun anggaran" value={tahun} onChange={setTahun}>
          <option value="">Tahun {rentang || 'semua'}</option>
          {daftarTahun.map((t) => <option key={t} value={t}>Tahun {t}</option>)}
        </Pilihan>
        <Pilihan label="Kecamatan" value={lokasi} onChange={setLokasi}>
          <option value="">Semua kecamatan</option>
          {ringkasan.data?.lokasi.map((l) => <option key={l} value={l}>{l}</option>)}
        </Pilihan>
        <Pilihan label="Urutan" value={urut} onChange={setUrut}>
          {URUT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Pilihan>
      </div>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b-[1.5px] border-tinta">
              {KOLOM.map((k) => <th key={k} scope="col" className="px-3 py-3.5 text-xs font-bold text-redup">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {(loading || error) && (
              <tr><td colSpan={KOLOM.length} className="px-3"><Muat loading={loading} error={error} onUlang={ulang} /></td></tr>
            )}
            {data?.length === 0 && (
              <tr><td colSpan={KOLOM.length} className="px-3 py-6 text-sm text-redup">Tidak ada kontraktor untuk filter ini.</td></tr>
            )}
            {data?.map((k) => (
              <tr
                key={k.id}
                onClick={() => navigate(`/rapor/${k.id}`)}
                className={`cursor-pointer border-b border-garis hover:bg-beton ${k.nilai === 'D' ? 'bg-sorot' : ''}`}
              >
                <td className="px-3 py-3.5">
                  <a href={`/rapor/${k.id}`} onClick={(e) => { e.preventDefault(); navigate(`/rapor/${k.id}`) }} className="text-base font-bold hover:text-merah">
                    {k.nama}
                  </a>
                </td>
                <td className="px-3 text-[15px]">{k.paket} paket</td>
                <td className="px-3 text-[15px]">{rupiahSingkat(k.nilai_kontrak)}</td>
                <td className="px-3 text-[15px]">{k.laporan_garansi}</td>
                <td className="px-3">
                  <span className="flex items-center gap-3">
                    <span className="relative h-2 w-[200px] overflow-hidden rounded-full bg-garis">
                      <span className={`absolute inset-y-0 left-0 ${warnaPersen(k.persen_tepat)}`} style={{ width: `${k.persen_tepat ?? 0}%` }} />
                    </span>
                    <span className="text-[15px] font-bold">{k.persen_tepat == null ? '—' : `${k.persen_tepat}%`}</span>
                  </span>
                </td>
                <td className="px-3 text-[15px]">{k.rata_hari == null ? '—' : `${Math.round(k.rata_hari)} hari`}</td>
                <td className="px-3"><NilaiRapor nilai={k.nilai} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[13px] leading-normal text-redup">
        Nilai dihitung dari persentase laporan yang diperbaiki tepat waktu dan jumlah status “Selesai” yang ditolak warga. Klik nama kontraktor untuk melihat rapornya.
      </p>
    </div>
  )
}
