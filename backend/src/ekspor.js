const AWAL_FORMULA = /^[=+\-@\t\r]/

export function csv(baris, kolom) {
  const sel = (nilai) => {
    if (nilai == null) return ''
    let teks = String(nilai)
    if (typeof nilai === 'string' && AWAL_FORMULA.test(teks)) teks = `'${teks}`
    return /[",\n\r]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks
  }
  return [kolom.join(','), ...baris.map((b) => kolom.map((k) => sel(b[k])).join(','))].join('\r\n') + '\r\n'
}

export function geojson(baris) {
  return {
    type: 'FeatureCollection',
    features: baris
      .filter((b) => b.lat != null && b.lng != null)
      .map(({ lat, lng, ...properti }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: properti,
      })),
  }
}
