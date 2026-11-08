export const TRANSISI = {
  masuk: ['diverifikasi'],
  diverifikasi: ['diteruskan'],
  diteruskan: ['dikerjakan'],
  dikerjakan: ['selesai'],
  selesai: ['dikerjakan'],
}

export function bolehTransisi(dari, ke) {
  return (TRANSISI[dari] ?? []).includes(ke)
}

export function laporanPublik(row) {
  const { pelapor_nama, pelapor_wa, ...publik } = row
  return publik
}
