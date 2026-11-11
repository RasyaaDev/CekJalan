import { sisaHariGaransi } from './garansi.js'

export const JADWAL = [
  { jenis: 'h7', hari: 7 },
  { jenis: 'h30', hari: 30 },
  { jenis: 'h60', hari: 60 },
]

export const PENGATURAN_AWAL = { h60: true, h30: true, h7: true, kontraktor: true, ppk: true, warga: true }

export function perluDiingatkan(proyek, hariIni, log = [], pengaturan = PENGATURAN_AWAL) {
  const sisa = sisaHariGaransi(proyek, hariIni)
  if (sisa == null || sisa < 0) return null

  const jatuh = JADWAL.find((j) => pengaturan[j.jenis] && sisa <= j.hari)
  if (!jatuh) return null

  const sudah = new Set(log.filter((l) => l.proyek_id === proyek.id).map((l) => l.jenis))
  const lebihKetat = JADWAL.filter((j) => j.hari <= jatuh.hari).some((j) => sudah.has(j.jenis))
  if (lebihKetat) return null

  return { proyek_id: proyek.id, jenis: jatuh.jenis, sisa_hari: sisa }
}

export function pemantauRuas(proyek, pantauan, jarakMeter) {
  return pantauan.filter((p) => {
    if (!p.aktif) return false
    if ((p.proyek_ids ?? []).includes(proyek.id)) return true
    if (p.lat == null || p.lng == null || proyek.lat == null || proyek.lng == null) return false
    return jarakMeter([p.lat, p.lng], [proyek.lat, proyek.lng]) <= p.radius_m
  })
}

export function mauKabar(pantauan, jenis) {
  if (jenis === 'h7') return pantauan.kabar_7_hari
  return pantauan.kabar_30_hari
}
