import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import PapanProyek from '../components/PapanProyek'
import PetaProyek from '../components/PetaProyek'
import { Centang, Ikon, Marka, Muat, StatusGaransi, Tag, Tombol } from '../components/ui'
import { useData } from '../lib/api'
import { rupiahSingkat } from '../lib/format'

const STATUS = [['ok', 'Masih garansi'], ['warn', 'Hampir habis'], ['exp', 'Garansi habis']]
const SEMUA = STATUS.map(([s]) => s)

function Pilihan({ label, value, onChange, children }) {
  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none truncate rounded border border-isian bg-white py-2.5 pl-3.5 pr-9 text-sm font-semibold"
      >
        {children}
      </select>
      <Ikon nama="chevron" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
    </label>
  )
}

export default function HalamanPeta() {
  const [kata, setKata] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState(SEMUA)
  const [lokasi, setLokasi] = useState('')
  const [tahun, setTahun] = useState('')
  const [aktif, setAktif] = useState(null)

  useEffect(() => {
    const jeda = setTimeout(() => setQ(kata.trim()), 300)
    return () => clearTimeout(jeda)
  }, [kata])

  const ringkasan = useData('/api/proyek/ringkasan')

  const semuaStatus = status.length === SEMUA.length
  const param = new URLSearchParams({ limit: '50' })
  if (q) param.set('q', q)
  if (!semuaStatus) param.set('status', status.join(','))
  if (lokasi) param.set('lokasi', lokasi)
  if (tahun) param.set('tahun', tahun)
  const daftar = useData(status.length ? `/api/proyek?${param}` : null)
  const proyek = status.length ? daftar.data : []

  const tanpaFilter = !q && semuaStatus && !lokasi && !tahun
  const jumlah = tanpaFilter && ringkasan.data ? ringkasan.data.total : proyek?.length
  const teksJumlah = jumlah == null ? '' : `${jumlah}${!tanpaFilter && jumlah >= 50 ? '+' : ''} paket`

  function ubahStatus(s, nyala) {
    setStatus((lama) => (nyala ? SEMUA.filter((x) => x === s || lama.includes(x)) : lama.filter((x) => x !== s)))
  }

  return (
    <div className="flex flex-col lg:h-[calc(100vh-72px)] lg:min-h-[640px] lg:flex-row">
      <aside className="flex flex-col gap-5 border-garis p-4 sm:p-7 lg:w-[420px] lg:shrink-0 lg:overflow-y-auto lg:border-r">
        <div role="tablist" className="flex gap-2">
          <span role="tab" aria-selected="true" className="rounded bg-tinta px-3.5 py-2 text-sm font-bold text-white">Proyek jalan</span>
          <Link role="tab" aria-selected="false" to="/peta-kerusakan" className="rounded border-[1.5px] border-tinta px-3.5 py-2 text-sm font-bold hover:bg-beton">Kerusakan</Link>
        </div>
        <h1 className="font-judul text-[34px] leading-none text-merah">Peta proyek jalan</h1>
        <p className="text-[15px] leading-normal text-redup">
          Paket pekerjaan jalan Kabupaten Sidoarjo dari LPSE
          {ringkasan.data?.tahun.length ? `, ${Math.min(...ringkasan.data.tahun)}–${Math.max(...ringkasan.data.tahun)}` : ''}.
        </p>

        <label className="flex items-center gap-2.5 rounded border border-isian bg-white px-3.5 py-3 focus-within:outline-3 focus-within:outline-kuning">
          <Ikon nama="cari" className="size-5 text-redup" />
          <span className="sr-only">Cari ruas atau kecamatan</span>
          <input
            type="search"
            value={kata}
            onChange={(e) => setKata(e.target.value)}
            placeholder="Cari ruas atau kecamatan"
            className="min-w-0 flex-1 text-base outline-none placeholder:text-redup"
          />
        </label>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-bold">Status garansi</legend>
          {STATUS.map(([s, label]) => (
            <Centang key={s} checked={status.includes(s)} onChange={(nyala) => ubahStatus(s, nyala)}>
              <Marka status={s} />
              <span className="flex-1 text-[15px]">{label}</span>
              <span className="text-sm text-redup">{ringkasan.data?.garansi[s] ?? ''}</span>
            </Centang>
          ))}
        </fieldset>

        <div className="flex gap-2">
          <Pilihan label="Kecamatan" value={lokasi} onChange={setLokasi}>
            <option value="">Semua kecamatan</option>
            {ringkasan.data?.lokasi.map((l) => <option key={l} value={l}>{l}</option>)}
          </Pilihan>
          <Pilihan label="Tahun anggaran" value={tahun} onChange={setTahun}>
            <option value="">Semua tahun</option>
            {ringkasan.data?.tahun.map((t) => <option key={t} value={t}>{t}</option>)}
          </Pilihan>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-sm font-bold" aria-live="polite">{teksJumlah}</p>
          <Tag />
        </div>

        <div className="border-t border-garis">
          <Muat loading={daftar.loading} error={daftar.error} onUlang={daftar.ulang} />
          {proyek?.length === 0 && <p className="py-6 text-sm text-redup">Tidak ada paket yang cocok dengan filter ini.</p>}
          <ul>
            {proyek?.map((p) => (
              <li key={p.slug} className="border-b border-garis">
                <button
                  type="button"
                  onClick={() => setAktif(p.slug)}
                  aria-pressed={aktif === p.slug}
                  className={`flex w-full flex-col gap-1.5 px-3 py-3.5 text-left hover:bg-beton ${aktif === p.slug ? '!bg-sorot' : ''}`}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 text-base font-bold">{p.ruas}</span>
                    <StatusGaransi status={p.garansi} className="shrink-0" />
                  </span>
                  <span className="text-[13px] text-redup">
                    {[p.lokasi, p.pelaksana, rupiahSingkat(p.nilai_kontrak)].filter(Boolean).join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="relative h-[520px] flex-1 bg-[#e9e7e2] lg:h-auto">
        <PetaProyek
          className="size-full"
          status={semuaStatus ? undefined : status}
          aktif={aktif}
          onPilih={setAktif}
          laporan={false}
          posisiZoom="bottomright"
        />

        {aktif && (
          <div className="absolute inset-x-4 top-4 z-[500] flex flex-col gap-3 rounded border-[1.5px] border-tinta bg-white p-3 sm:left-auto sm:right-6 sm:top-6 sm:w-[400px]">
            <button
              type="button"
              onClick={() => setAktif(null)}
              aria-label="Tutup papan proyek"
              className="absolute -right-3 -top-3 z-10 flex size-8 items-center justify-center rounded-full border-[1.5px] border-tinta bg-white text-lg font-bold leading-none hover:bg-beton"
            >
              ×
            </button>
            <PapanProyek slug={aktif} />
            <div className="flex flex-wrap gap-2">
              <Tombol to={`/proyek/${aktif}`} className="text-base">Lihat detail</Tombol>
              <Tombol to={`/lapor?proyek=${aktif}`} varian="garis" className="text-base">Lapor di ruas ini</Tombol>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-6 z-[500] hidden flex-col gap-2 rounded-xs border border-garis bg-white px-3.5 py-3 sm:flex">
          <p className="text-[13px] font-bold">Titik proyek di peta</p>
          {STATUS.map(([s, label]) => (
            <p key={s} className="flex items-center gap-2 text-[13px]"><Marka status={s} />{label}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
