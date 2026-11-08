const URL_NOMINATIM = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org'
const UA = process.env.NOMINATIM_UA || 'cekjalan/0.1 (isi-kontak-anda)'

export async function geocode(ruas) {
  const inti = ruas.split(/\s+[-–]\s+/)[0].trim()
  if (!inti) return null

  const params = new URLSearchParams({
    q: `${inti}, Sidoarjo, Jawa Timur`,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'id',
    viewbox: '112.55,-7.30,112.90,-7.60',
    bounded: '1',
  })

  const res = await fetch(`${URL_NOMINATIM.replace(/\/$/, '')}/search?${params}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  })

  if (!res.ok) return null

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  const lat = Number(data[0].lat)
  const lng = Number(data[0].lon)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}
