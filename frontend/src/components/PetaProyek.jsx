import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl, useMap } from 'react-leaflet'
import { useData } from '../lib/api'
import { Muat } from './ui'

const WARNA = { ok: '#1E7F3A', warn: '#F2B400', exp: '#7A7F85' }
const LABEL = { ok: 'Masih garansi', warn: 'Hampir habis', exp: 'Garansi habis' }

function keterangan(proyek) {
  if (!proyek.status) return 'Garansi belum tercatat'
  if (proyek.status === 'exp') return 'Garansi habis'
  return `${LABEL[proyek.status]} · ${proyek.sisa_hari} hari`
}

function Arahkan({ posisi }) {
  const peta = useMap()
  useEffect(() => {
    if (posisi) peta.flyTo(posisi, Math.max(peta.getZoom(), 15), { duration: 0.6 })
  }, [peta, posisi])
  return null
}

export default function PetaProyek({ className = '', status, aktif: aktifLuar, onPilih, laporan = true, posisiZoom = 'topleft' }) {
  const { data, error, loading, ulang } = useData('/api/peta')
  const [aktifDalam, setAktifDalam] = useState(null)
  const aktif = aktifLuar ?? aktifDalam

  if (!data) {
    return (
      <div className={`flex items-center justify-center bg-beton ${className}`}>
        <Muat loading={loading} error={error} onUlang={ulang} />
      </div>
    )
  }

  const proyek = status ? data.proyek.filter((p) => status.includes(p.status)) : data.proyek
  const terpilih = data.proyek.find((p) => p.slug === aktif)

  return (
    <MapContainer center={[-7.452, 112.72]} zoom={14} scrollWheelZoom={false} zoomControl={false} className={className}>
      <TileLayer
        attribution='&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position={posisiZoom} />
      {onPilih && <Arahkan posisi={terpilih?.posisi} />}
      {proyek.map((p) => (
        <CircleMarker
          key={p.slug}
          center={p.posisi}
          radius={p.slug === aktif ? 13 : 11}
          eventHandlers={{ click: () => (onPilih ? onPilih(p.slug) : setAktifDalam(p.slug)) }}
          pathOptions={{
            color: p.slug === aktif ? '#9F1717' : '#2B1714',
            weight: p.slug === aktif ? 4 : 2,
            fillColor: WARNA[p.status] ?? WARNA.exp,
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent={aktif === p.slug} direction="right" offset={[10, 0]}>
            <strong>{p.nama}</strong>
            <br />
            {keterangan(p)}
          </Tooltip>
        </CircleMarker>
      ))}
      {laporan &&
        data.laporan.map((l) => (
          <CircleMarker
            key={l.kode}
            center={l.posisi}
            radius={6}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#C4420E', fillOpacity: 1 }}
          />
        ))}
    </MapContainer>
  )
}
