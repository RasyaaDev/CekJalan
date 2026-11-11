import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'

function pin(warna) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:32px;height:32px;border-radius:50%;background:${warna}2e;display:grid;place-items:center"><span style="display:block;width:14px;height:14px;border-radius:50%;background:${warna};border:3px solid #fff;box-shadow:0 0 0 1px ${warna}"></span></span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function Pas({ titik }) {
  const peta = useMap()
  const kunci = JSON.stringify(titik)
  useEffect(() => {
    const posisi = JSON.parse(kunci)
    if (posisi.length > 1) peta.fitBounds(L.latLngBounds(posisi), { padding: [48, 48], maxZoom: 18 })
    else if (posisi.length) peta.setView(posisi[0], 17)
  }, [peta, kunci])
  return null
}

export default function PetaTitik({ titik, garis, labelGaris, className = '' }) {
  const ada = titik.filter((t) => t.posisi)
  if (!ada.length) {
    return <div className={`flex items-center justify-center rounded bg-beton text-xs text-redup ${className}`}>Lokasi tidak tercatat</div>
  }
  return (
    <MapContainer center={ada[0].posisi} zoom={17} scrollWheelZoom={false} attributionControl={false} className={`rounded ${className}`}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Pas titik={ada.map((t) => t.posisi)} />
      {garis && ada.length > 1 && (
        <Polyline positions={ada.map((t) => t.posisi)} pathOptions={{ color: '#2B1714', weight: 2, dashArray: '4 5' }}>
          {labelGaris && (
            <Tooltip permanent direction="top" className="!rounded !border-0 !bg-tinta !px-2.5 !py-1 !text-xs !font-bold !text-white">
              {labelGaris}
            </Tooltip>
          )}
        </Polyline>
      )}
      {ada.map((t) => (
        <Marker key={t.label} position={t.posisi} icon={pin(t.warna)} title={t.label} />
      ))}
    </MapContainer>
  )
}
