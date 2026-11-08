const HARI_MS = 86_400_000
export const BATAS_WARN_HARI = 30

export function akhirGaransi(proyek) {
  if (!proyek?.selesai_pada || proyek.masa_pemeliharaan_bulan == null) return null
  const dasar = new Date(proyek.selesai_pada)
  if (Number.isNaN(dasar.getTime())) return null
  const bulan = Number(proyek.masa_pemeliharaan_bulan)
  const tanggal = dasar.getUTCDate()
  dasar.setUTCDate(1)
  dasar.setUTCMonth(dasar.getUTCMonth() + bulan)
  const hariTerakhir = new Date(Date.UTC(dasar.getUTCFullYear(), dasar.getUTCMonth() + 1, 0)).getUTCDate()
  dasar.setUTCDate(Math.min(tanggal, hariTerakhir))
  return dasar
}

export function sisaHariGaransi(proyek, sekarang = new Date()) {
  const akhir = akhirGaransi(proyek)
  if (!akhir) return null
  return Math.ceil((akhir.getTime() - sekarang.getTime()) / HARI_MS)
}

export function statusGaransi(proyek, sekarang = new Date()) {
  const sisa = sisaHariGaransi(proyek, sekarang)
  if (sisa == null) return null
  if (sisa < 0) return 'exp'
  if (sisa <= BATAS_WARN_HARI) return 'warn'
  return 'ok'
}

export function telat(laporan, sekarang = new Date()) {
  if (!laporan?.tenggat_pada || laporan.status === 'selesai') return false
  return new Date(laporan.tenggat_pada).getTime() < sekarang.getTime()
}

export function denganGaransi(proyek, sekarang = new Date()) {
  return {
    ...proyek,
    garansi: statusGaransi(proyek, sekarang),
    akhir_garansi: akhirGaransi(proyek)?.toISOString().slice(0, 10) ?? null,
    sisa_hari: sisaHariGaransi(proyek, sekarang),
  }
}
