import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { proyekPeta, laporanWarga } from '../data'

const WARNA = { ok: '#1E7F3A', warn: '#F2B400', exp: '#7A7F85' }

export default function PetaProyek({ className = '' }) {
  return (
    <MapContainer center={[-7.452, 112.72]} zoom={14} scrollWheelZoom={false} className={className}>
      <TileLayer
        attribution='&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {proyekPeta.map((p) => (
        <CircleMarker key={p.nama} center={p.posisi} radius={11} pathOptions={{ color: '#2B1714', weight: 2, fillColor: WARNA[p.status], fillOpacity: 1 }}>
          <Tooltip permanent direction="right" offset={[12, 0]}>
            <strong>{p.nama}</strong><br />{p.sub}
          </Tooltip>
        </CircleMarker>
      ))}
      {laporanWarga.map((l, i) => (
        <CircleMarker key={i} center={l.posisi} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#C4420E', fillOpacity: 1 }} />
      ))}
    </MapContainer>
  )
}
