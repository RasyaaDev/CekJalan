import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, ZoomControl, useMap } from 'react-leaflet'
import { Centang, Foto, Ikon, Muat, StatusGaransi, Tombol } from '../components/ui'
import { useData } from '../lib/api'
import { LABEL_LAPORAN, tanggalPendek, teksTenggat, waktuRelatif } from '../lib/format'

const GRUP = [
  ['belum', 'Belum ditangani', 'Belum ditangani', '#9F1717', 'bg-merah'],
  ['dikerjakan', 'Dikerjakan kontraktor', 'Dikerjakan', '#C4420E', 'bg-oranye'],
  ['selesai', 'Selesai diperbaiki', 'Selesai', '#1E7F3A', 'bg-hijau'],
]
const INFO = Object.fromEntries(GRUP.map(([k, panjang, pendek, warna, kelas]) => [k, { panjang, pendek, warna, kelas }]))
const SEMUA = GRUP.map(([k]) => k)

function Titik({ grup, className = 'size-3' }) {
  return <span className={`inline-block shrink-0 rounded-full ${INFO[grup].kelas} ${className}`} />
}

function Arahkan({ posisi }) {
  const peta = useMap()
  useEffect(() => {
    if (posisi) peta.flyTo(posisi, Math.max(peta.getZoom(), 15), { duration: 0.6 })
  }, [peta, posisi])
  return null
}

function Kartu({ laporan, onTutup }) {
  const baris = [
    ['Kerusakan', laporan.deskripsi],
    ['Ruas', laporan.ruas ?? 'Lokasi belum dicocokkan'],
    ['Proyek', laporan.ruas ? [laporan.ruas, laporan.tahun_proyek].filter(Boolean).join(' ') : '—'],
    ['Penanggung jawab', laporan.penanggung_jawab],
    ['Status perbaikan', `${LABEL_LAPORAN[laporan.status] ?? laporan.status} · ${teksTenggat(laporan.tenggat_pada, laporan.status).toLowerCase()}`],
  ]
  const ditanggung = laporan.garansi === 'ok' || laporan.garansi === 'warn'

  return (
    <div className="absolute inset-x-4 top-4 z-[500] overflow-hidden rounded-md border border-[#d9d2cc] bg-white shadow-[0_8px_24px_rgba(43,23,20,0.18)] sm:left-auto sm:right-6 sm:top-[60px] sm:w-[380px]">
      <div className="flex items-center justify-between gap-3 bg-merah px-4 py-3">
        <p className="text-sm font-bold text-white">Laporan {laporan.kode}</p>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-[3px] bg-white py-[3px] pl-1.5 pr-2 text-[11px] font-bold text-hijau">
            <Ikon nama="centang" className="size-3" />
            Terverifikasi
          </span>
          <button type="button" onClick={onTutup} aria-label="Tutup kartu laporan" className="px-1 text-xl font-bold leading-none text-white">×</button>
        </div>
      </div>
      <Foto src={laporan.foto_url} alt={laporan.deskripsi} className="h-[150px] w-full !rounded-none" />
      <dl className="px-4 py-1 text-[13px] leading-normal">
        {baris.map(([label, nilai]) => (
          <div key={label} className="flex gap-3 border-t border-[#d9d2cc] py-[9px] first:border-0">
            <dt className="w-[130px] shrink-0 text-redup">{label}</dt>
            <dd className="min-w-0 flex-1 font-semibold">{nilai}</dd>
          </div>
        ))}
      </dl>
      {laporan.garansi && (
        <div className="flex items-center gap-2.5 bg-sorot px-4 py-2.5">
          <StatusGaransi status={laporan.garansi} className="shrink-0" />
          <p className="text-xs leading-normal">
            {ditanggung
              ? `Garansi sampai ${tanggalPendek(laporan.akhir_garansi)}. Perbaikan ditanggung kontraktor.`
              : 'Garansi sudah habis. Perbaikan ditanggung Dinas PU Bina Marga.'}
          </p>
        </div>
      )}
      <div className="flex gap-2.5 px-4 pb-3.5 pt-3">
        <Tombol to={`/lacak/${laporan.kode}`} varian="garis" className="flex-1 text-base">Lihat detail</Tombol>
        {laporan.slug_proyek && (
          <Tombol to={`/pantau/${laporan.slug_proyek}`} className="flex-1 text-base">Pantau ruas ini</Tombol>
        )}
      </div>
    </div>
  )
}

export default function PetaKerusakan() {
  const { data, error, loading, ulang } = useData('/api/peta/laporan')
  const [grup, setGrup] = useState(SEMUA)
  const [aktif, setAktif] = useState(null)

  const laporan = (data?.laporan ?? []).filter((l) => grup.includes(l.grup))
  const terpilih = data?.laporan.find((l) => l.kode === aktif)

  function ubahGrup(k, nyala) {
    setGrup((lama) => (nyala ? SEMUA.filter((x) => x === k || lama.includes(x)) : lama.filter((x) => x !== k)))
  }

  return (
    <div className="flex flex-col lg:h-[calc(100vh-72px)] lg:min-h-[720px] lg:flex-row">
      <aside className="flex flex-col gap-[18px] border-[#d9d2cc] px-4 py-7 sm:px-8 lg:w-[420px] lg:shrink-0 lg:overflow-y-auto lg:border-r">
        <div role="tablist" className="flex gap-2">
          <Link role="tab" aria-selected="false" to="/peta" className="rounded border-[1.5px] border-tinta px-3.5 py-2 text-sm font-bold hover:bg-beton">Proyek jalan</Link>
          <span role="tab" aria-selected="true" className="rounded bg-tinta px-3.5 py-2 text-sm font-bold text-white">Kerusakan</span>
        </div>
        <h1 className="font-judul text-[32px] leading-[1.15] text-merah">Peta kerusakan jalan</h1>
        <p className="text-[15px] leading-normal text-redup">
          Laporan warga yang sudah diverifikasi, lengkap dengan kontraktor penanggung jawab dan status perbaikannya.
        </p>
        {data && (
          <p className="flex items-center gap-2 self-start rounded bg-[#e3f1e7] py-1.5 pl-2.5 pr-3 text-[13px] font-semibold text-hijau">
            <Titik grup="selesai" className="size-2.5" />
            Langsung · diperbarui {waktuRelatif(data.diperbarui_pada)}
          </p>
        )}
        <Muat loading={loading} error={error} onUlang={ulang} />

        {data && (
          <>
            <dl className="flex">
              {[
                [data.total, 'terverifikasi', 'text-tinta'],
                [data.ringkasan.dikerjakan, 'dikerjakan', 'text-oranye'],
                [data.ringkasan.selesai, 'selesai', 'text-hijau'],
              ].map(([angka, label, warna]) => (
                <div key={label} className="flex flex-1 flex-col-reverse">
                  <dt className="text-[13px] text-redup">{label}</dt>
                  <dd className={`font-judul text-[30px] leading-[1.15] ${warna}`}>{angka}</dd>
                </div>
              ))}
            </dl>

            <fieldset className="flex flex-col gap-[18px]">
              <legend className="mb-[18px] text-[13px] font-semibold">Status perbaikan</legend>
              {GRUP.map(([k, panjang]) => (
                <Centang key={k} checked={grup.includes(k)} onChange={(nyala) => ubahGrup(k, nyala)} warna="oranye">
                  <Titik grup={k} />
                  <span className="flex-1 text-sm">{panjang}</span>
                  <span className="text-[13px] text-redup">{data.ringkasan[k]}</span>
                </Centang>
              ))}
            </fieldset>

            <div>
              <p className="pb-[18px] text-[13px] font-semibold">Laporan terbaru</p>
              {laporan.length === 0 && <p className="border-t border-[#d9d2cc] py-4 text-sm text-redup">Belum ada laporan dengan status ini.</p>}
              <ul>
                {laporan.slice(0, 4).map((l) => (
                  <li key={l.kode} className="border-t border-[#d9d2cc]">
                    <button
                      type="button"
                      onClick={() => setAktif(l.kode)}
                      className={`flex w-full items-center gap-2.5 py-3 text-left hover:bg-beton ${aktif === l.kode ? 'bg-sorot' : ''}`}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-px leading-normal">
                        <span className="truncate text-sm font-bold">{l.kode} · {l.deskripsi}</span>
                        <span className="truncate text-[13px] text-redup">{l.ruas ?? 'Lokasi belum dicocokkan'} · {l.penanggung_jawab}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold">
                        <Titik grup={l.grup} className="size-2.5" />
                        {INFO[l.grup].pendek}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </aside>

      <div className="relative h-[560px] flex-1 bg-beton lg:h-auto">
        <MapContainer center={[-7.452, 112.72]} zoom={14} scrollWheelZoom={false} zoomControl={false} className="size-full">
          <TileLayer
            attribution='&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />
          <Arahkan posisi={terpilih?.posisi} />
          {laporan
            .filter((l) => l.posisi)
            .map((l) => (
              <CircleMarker
                key={l.kode}
                center={l.posisi}
                radius={l.kode === aktif ? 11 : 8}
                eventHandlers={{ click: () => setAktif(l.kode) }}
                pathOptions={{ color: '#fff', weight: l.kode === aktif ? 3 : 2, fillColor: INFO[l.grup].warna, fillOpacity: 1 }}
              />
            ))}
        </MapContainer>

        {terpilih && <Kartu laporan={terpilih} onTutup={() => setAktif(null)} />}

        <div className="absolute bottom-6 left-6 z-[500] hidden flex-col gap-2 rounded-md border border-[#d9d2cc] bg-white px-4 py-3.5 sm:flex">
          <p className="text-xs font-bold text-redup">Titik kerusakan</p>
          {GRUP.map(([k, panjang]) => (
            <p key={k} className="flex items-center gap-2 text-[13px]"><Titik grup={k} />{panjang}</p>
          ))}
          <p className="w-[220px] text-xs leading-normal text-redup">
            Hanya laporan yang lolos cek geotag dan verifikasi petugas yang tampil di sini.
          </p>
        </div>
      </div>
    </div>
  )
}
