import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Muat, StatusGaransi } from '../../components/ui'
import { Kartu, JudulDinas, Pilih, Sakelar, gayaTombol, LABEL_STATUS_DINAS } from '../../components/dinas'
import { getData } from '../../lib/api'
import { waktuRelatif } from '../../lib/format'

const WARNA_GRUP = { belum: '#9F1717', dikerjakan: '#C4420E', selesai: '#1E7F3A' }
const WARNA_GARANSI = { ok: '#1E7F3A', warn: '#F2B400', exp: '#7A7F85' }
const SEGARKAN_MS = 30_000

function daftarBulan() {
  const hasil = []
  const d = new Date()
  d.setDate(1)
  for (let i = 0; i < 12; i++) {
    hasil.push([d.toLocaleDateString('sv').slice(0, 7), d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })])
    d.setMonth(d.getMonth() - 1)
  }
  return hasil
}

function usePetaHidup(path) {
  const [state, setState] = useState({ data: null, error: null })
  const [ulangKe, setUlangKe] = useState(0)

  useEffect(() => {
    let kontrol = new AbortController()
    const muat = () =>
      getData(path, kontrol.signal)
        .then((data) => setState({ data, error: null }))
        .catch((error) => error.name !== 'AbortError' && setState((lama) => ({ data: lama.data, error })))
    setState((lama) => ({ data: lama.data, error: null }))
    muat()
    const jeda = setInterval(() => {
      kontrol.abort()
      kontrol = new AbortController()
      muat()
    }, SEGARKAN_MS)
    return () => {
      clearInterval(jeda)
      kontrol.abort()
    }
  }, [path, ulangKe])

  return { ...state, ulang: () => setUlangKe((n) => n + 1) }
}

export default function PetaLaporan() {
  const bulanPilihan = useMemo(daftarBulan, [])
  const [filter, setFilter] = useState({ bulan: bulanPilihan[0][0], kecamatan: '', status: '' })
  const [lapis, setLapis] = useState({ ruas: true, titik: true, kepadatan: true })
  const query = new URLSearchParams(Object.entries(filter).filter(([, v]) => v)).toString()
  const { data, error, ulang } = usePetaHidup(`/api/dinas/peta?${query}`)
  const [, setDetak] = useState(0)

  useEffect(() => {
    const jeda = setInterval(() => setDetak((n) => n + 1), 30_000)
    return () => clearInterval(jeda)
  }, [])

  const kecamatan = useMemo(() => [...new Set((data?.ruas ?? []).map((r) => r.kecamatan).filter(Boolean))].sort(), [data])
  const namaBulan = bulanPilihan.find(([k]) => k === filter.bulan)?.[1]
  const ubah = (kunci) => (nilai) => setFilter((lama) => ({ ...lama, [kunci]: nilai }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <JudulDinas sub={`Sebaran laporan warga dan status garansi ruas proyek, ${namaBulan ?? 'semua bulan'}`}>Peta laporan</JudulDinas>
        <a href={`/api/dinas/peta.geojson?${query}`} className={gayaTombol.garis}>Unduh GeoJSON</a>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Pilih label="Bulan" value={filter.bulan} onChange={ubah('bulan')}>
          {bulanPilihan.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          <option value="">Semua bulan</option>
        </Pilih>
        <Pilih label="Kecamatan" value={filter.kecamatan} onChange={ubah('kecamatan')}>
          <option value="">Semua kecamatan</option>
          {kecamatan.map((k) => <option key={k}>{k}</option>)}
        </Pilih>
        <Pilih label="Status laporan" value={filter.status} onChange={ubah('status')}>
          <option value="">Semua status laporan</option>
          <option value="belum">Belum ditangani</option>
          <option value="dikerjakan">Sedang dikerjakan</option>
          <option value="selesai">Selesai</option>
        </Pilih>
        {data && <span className="text-xs text-redup">Diperbarui {waktuRelatif(data.diperbarui_pada)}</span>}
      </div>

      {!data && <Muat loading={!error} error={error} onUlang={ulang} />}

      {data && (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
          <div className="relative overflow-hidden rounded-md border border-garis-dinas">
            <MapContainer center={[-7.4478, 112.7183]} zoom={13} className="h-[460px] w-full md:h-[640px]">
              <TileLayer
                attribution='&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {lapis.kepadatan &&
                data.laporan.map((l) => (
                  <Circle key={`k-${l.kode}`} center={l.posisi} radius={260} interactive={false} pathOptions={{ stroke: false, fillColor: '#C9302C', fillOpacity: 0.13 }} />
                ))}
              {lapis.ruas &&
                data.ruas.map((r) => (
                  <CircleMarker key={r.slug} center={[r.lat, r.lng]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: WARNA_GARANSI[r.garansi] ?? '#B8B2AC', fillOpacity: 0.95 }}>
                    <Popup>
                      <p className="font-bold">{r.ruas}</p>
                      <p>{r.kontraktor ?? 'Kontraktor tidak tercatat'}</p>
                      <StatusGaransi status={r.garansi} className="!text-xs" />
                    </Popup>
                  </CircleMarker>
                ))}
              {lapis.titik &&
                data.laporan.map((l) => (
                  <CircleMarker key={l.kode} center={l.posisi} radius={5.5} pathOptions={{ color: '#fff', weight: 1.5, fillColor: WARNA_GRUP[l.grup], fillOpacity: 1 }}>
                    <Popup>
                      <p className="font-bold">{l.kode} · {l.label_jenis ?? 'Kerusakan'}</p>
                      <p>{l.ruas ?? 'Belum dicocokkan'} · {LABEL_STATUS_DINAS[l.status]}</p>
                      <p>Penanggung jawab: {l.penanggung_jawab}</p>
                      <Link to={`/dinas/laporan/${l.kode}`} className="font-bold text-oranye">Buka laporan</Link>
                    </Popup>
                  </CircleMarker>
                ))}
            </MapContainer>
            <div className="absolute bottom-4 left-4 z-[500] flex flex-col gap-1.5 rounded bg-white p-3.5 text-xs shadow">
              <p className="font-semibold text-redup">Ruas proyek</p>
              {[['ok', 'Masih garansi'], ['warn', 'Hampir habis'], ['exp', 'Garansi habis']].map(([k, l]) => (
                <span key={k} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: WARNA_GARANSI[k] }} />{l}</span>
              ))}
              <p className="mt-1.5 font-semibold text-redup">Titik laporan</p>
              {[['belum', 'Belum ditangani'], ['dikerjakan', 'Sedang dikerjakan'], ['selesai', 'Selesai']].map(([k, l]) => (
                <span key={k} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: WARNA_GRUP[k] }} />{l}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Kartu judul="Lapisan peta">
              <Sakelar label="Ruas proyek" sub="Warna sesuai status garansi" checked={lapis.ruas} onChange={(v) => setLapis({ ...lapis, ruas: v })} />
              <Sakelar label="Titik laporan" sub={`${data.laporan.length} laporan`} checked={lapis.titik} onChange={(v) => setLapis({ ...lapis, titik: v })} />
              <Sakelar label="Kepadatan kerusakan" checked={lapis.kepadatan} onChange={(v) => setLapis({ ...lapis, kepadatan: v })} />
            </Kartu>
            <Kartu judul="Titik rawan">
              {data.rawan.length ? (
                <ul className="flex flex-col">
                  {data.rawan.map((r) => (
                    <li key={r.slug} className="flex items-center justify-between gap-3 border-t border-garis-dinas py-3">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold">{r.ruas}</span>
                        <span className="text-xs text-redup">{r.jumlah} laporan</span>
                      </span>
                      <StatusGaransi status={r.garansi} className="shrink-0 !text-xs" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-redup">Belum ada laporan di periode ini.</p>
              )}
            </Kartu>
            <p className="text-xs leading-normal text-redup">Ruas yang masih bergaransi dan punya banyak laporan diprioritaskan untuk ditagih ke kontraktor.</p>
          </div>
        </div>
      )}
    </div>
  )
}
