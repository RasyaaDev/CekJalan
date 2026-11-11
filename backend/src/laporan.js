export const STATUS = ['masuk', 'diverifikasi', 'diteruskan', 'dikerjakan', 'selesai', 'ditolak', 'perlu_foto_ulang']
export const STATUS_PUBLIK = ['diverifikasi', 'diteruskan', 'dikerjakan', 'selesai']

export const TRANSISI = {
  masuk: ['diverifikasi', 'ditolak', 'perlu_foto_ulang'],
  perlu_foto_ulang: ['diverifikasi', 'ditolak'],
  diverifikasi: ['diteruskan'],
  diteruskan: ['dikerjakan'],
  dikerjakan: ['selesai'],
  selesai: ['dikerjakan'],
  ditolak: [],
}

export function bolehTransisi(dari, ke) {
  return (TRANSISI[dari] ?? []).includes(ke)
}

export function statusPublik(status) {
  return STATUS_PUBLIK.includes(status)
}

export function laporanPublik(row) {
  const { pelapor_nama, pelapor_wa, pelapor_email, warga_id, foto_hash, ...publik } = row
  return publik
}
