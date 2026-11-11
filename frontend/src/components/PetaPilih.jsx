import { useEffect, useMemo } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const PIN = L.divIcon({
  className: '',
  html: '<span style="display:block;width:44px;height:44px;border-radius:50%;background:rgba(159,23,23,.18);display:grid;place-items:center"><span style="display:block;width:18px;height:18px;border-radius:50%;background:#9F1717;border:3px solid #fff;box-shadow:0 0 0 1px #9F1717"></span></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

const WARNA = { ok: '#1E7F3A', warn: '#F2B400', exp: '#7A7F85' }

function Ikuti({ titik, radius }) {
  const peta = useMap()
  useEffect(() => {
    if (!titik) return
    if (radius) peta.fitBounds(L.latLng(titik).toBounds(radius * 2.4))
    else peta.setView(titik, Math.max(peta.getZoom(), 16))
  }, [peta, titik, radius])
  return null
}

function Klik({ onPilih }) {
  useMapEvents({ click: (e) => onPilih([e.latlng.lat, e.latlng.lng]) })
  return null
}

export default function PetaPilih({ titik, onPilih, radius, proyek = [], label, className = '' }) {
  const handler = useMemo(
    () => ({ dragend: (e) => onPilih?.([e.target.getLatLng().lat, e.target.getLatLng().lng]) }),
    [onPilih],
  )

  return (
    <MapContainer center={titik ?? [-7.4478, 112.7183]} zoom={15} scrollWheelZoom={false} className={className}>
      <TileLayer
        attribution='&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Ikuti titik={titik} radius={radius} />
      {onPilih && <Klik onPilih={onPilih} />}
      {proyek.map((p) => (
        <CircleMarker
          key={p.slug}
          center={[p.lat, p.lng]}
          radius={7}
          pathOptions={{ color: '#2B1714', weight: 2, fillColor: WARNA[p.garansi] ?? WARNA.exp, fillOpacity: 1 }}
        />
      ))}
      {titik && radius && (
        <Circle
          center={titik}
          radius={radius}
          pathOptions={{ color: '#C4420E', weight: 1.5, dashArray: '6 6', fillColor: '#C4420E', fillOpacity: 0.12 }}
        />
      )}
      {titik && <Marker position={titik} icon={PIN} draggable={Boolean(onPilih)} eventHandlers={handler} title={label} />}
    </MapContainer>
  )
}
