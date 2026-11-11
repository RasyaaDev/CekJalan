import { statusGaransi } from './garansi.js'

const HARI_MS = 86_400_000

export function nilaiHuruf(skor) {
  if (skor == null) return null
  if (skor >= 90) return 'A'
  if (skor >= 80) return 'B'
  if (skor >= 65) return 'C'
  return 'D'
}

export function saatGaransi(laporan, proyek) {
  const status = statusGaransi(proyek, new Date(laporan.dibuat_pada))
  return status === 'ok' || status === 'warn'
}

export function hasilPerbaikan(laporan, sekarang = new Date()) {
  if (laporan.selesai_pada) {
    const selisih = Math.round((new Date(laporan.tenggat_pada) - new Date(laporan.selesai_pada)) / HARI_MS)
    return { jatuh_tempo: true, tepat: !laporan.tenggat_pada || selisih >= 0, selisih_hari: laporan.tenggat_pada ? selisih : null }
  }
  if (laporan.tenggat_pada && new Date(laporan.tenggat_pada) < sekarang) {
    return { jatuh_tempo: true, tepat: false, selisih_hari: -Math.ceil((sekarang - new Date(laporan.tenggat_pada)) / HARI_MS) }
  }
  return { jatuh_tempo: false, tepat: null, selisih_hari: null }
}

export function hitungRapor(proyek, laporan, sekarang = new Date()) {
  const proyekById = new Map(proyek.map((p) => [p.id, p]))
  const garansi = laporan.filter((l) => proyekById.has(l.proyek_id) && saatGaransi(l, proyekById.get(l.proyek_id)))
  const hasil = garansi.map((l) => hasilPerbaikan(l, sekarang))
  const jatuhTempo = hasil.filter((h) => h.jatuh_tempo)
  const tepat = jatuhTempo.filter((h) => h.tepat).length
  const selesai = garansi.filter((l) => l.selesai_pada)
  const ditolak = garansi.reduce((total, l) => total + (l.buka_lagi_count ?? 0), 0)

  const persen = jatuhTempo.length ? Math.round((tepat / jatuhTempo.length) * 100) : null
  const skor = persen == null ? null : persen - Math.min(30, ditolak * 5)

  return {
    paket: proyek.length,
    nilai_kontrak: proyek.reduce((total, p) => total + (p.nilai_kontrak ?? 0), 0),
    laporan_garansi: garansi.length,
    jatuh_tempo: jatuhTempo.length,
    tepat_waktu: tepat,
    lewat_tenggat: jatuhTempo.length - tepat,
    persen_tepat: persen,
    rata_hari: selesai.length
      ? Math.round(
          (selesai.reduce((t, l) => t + (new Date(l.selesai_pada) - new Date(l.dibuat_pada)) / HARI_MS, 0) / selesai.length) * 10,
        ) / 10
      : null,
    ditolak,
    skor,
    nilai: nilaiHuruf(skor),
  }
}
