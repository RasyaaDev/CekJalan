import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useData } from '../lib/api'
import { Muat } from './ui'

const WARNA = { ok: '#1E7F3A', warn: '#F2B400', exp: '#7A7F85' }
const LABEL = { ok: 'Masih garansi', warn: 'Hampir habis', exp: 'Garansi habis' }

function keterangan(proyek) {
  if (!proyek.status) return 'Garansi belum tercatat'
  if (proyek.status === 'exp') return 'Garansi habis'
  return `${LABEL[proyek.status]} · ${proyek.sisa_hari} hari`
}

export default function PetaProyek({ className = '' }) {
  const { data, error, loading, ulang } = useData('/api/peta')
  const [aktif, setAktif] = useState(null)

  if (!data) {
    return (
      <div className={`flex items-center justify-center bg-beton ${className}`}>
        <Muat loading={loading} error={error} onUlang={ulang} />
      </div>
    )
  }

  return (
    <MapContainer center={[-7.452, 112.72]} zoom={14} scrollWheelZoom={false} className={className}>
      <TileLayer
        attribution='&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {data.proyek.map((proyek) => (
        <CircleMarker
          key={proyek.slug}
          center={proyek.posisi}
          radius={11}
          eventHandlers={{ click: () => setAktif(proyek.slug) }}
          pathOptions={{
            color: '#2B1714',
            weight: 2,
            fillColor: WARNA[proyek.status] ?? WARNA.exp,
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent={aktif === proyek.slug} direction="right" offset={[10, 0]}>
            <strong>{proyek.nama}</strong>
            <br />
            {keterangan(proyek)}
          </Tooltip>
        </CircleMarker>
      ))}
      {data.laporan.map((laporan) => (
        <CircleMarker
          key={laporan.kode}
          center={laporan.posisi}
          radius={6}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#C4420E', fillOpacity: 1 }}
        />
      ))}
    </MapContainer>
  )
}
