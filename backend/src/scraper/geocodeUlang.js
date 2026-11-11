import { supabase } from '../supabase.js'
import { geocode } from './geocode.js'
import { tidur } from './lpse.js'

const AWALAN = /\b(peningkatan|pembangunan|rehabilitasi|pemeliharaan|penataan|pelebaran|rekonstruksi|perbaikan|lanjutan|ljt|ruas|kegiatan|pekerjaan)\b/gi

export function kandidatNama(ruas) {
  const bersih = ruas
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^[^a-z0-9]+/i, '')
    .replace(AWALAN, ' ')
    .replace(/\bjalan\b/gi, ' ')
    .replace(/\bjl\.?\s/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const bagian = bersih.split(/\s*[-–,]\s*|\s+dan\s+/i).map((b) => b.trim()).filter((b) => b.length > 2)
  return [...new Set([bersih, ...bagian].filter(Boolean).flatMap((b) => [`Jalan ${b}`, b]))].slice(0, 5)
}

if (process.argv[1]?.endsWith('geocodeUlang.js')) {
  const { data, error } = await supabase.from('proyek').select('id,ruas').is('lat', null).limit(1000)
  if (error) throw error

  let ketemu = 0
  for (const proyek of data ?? []) {
    let titik = null
    for (const nama of kandidatNama(proyek.ruas)) {
      await tidur(1100)
      titik = await geocode(nama).catch(() => null)
      if (titik) {
        console.log(`${proyek.ruas} -> "${nama}" (${titik.lat}, ${titik.lng})`)
        break
      }
    }
    if (!titik) continue
    const { error: galat } = await supabase.from('proyek').update(titik).eq('id', proyek.id).is('lat', null)
    if (galat) throw galat
    ketemu++
  }
  console.log(`Selesai: ${ketemu} dari ${data?.length ?? 0} proyek dapat koordinat.`)
}
