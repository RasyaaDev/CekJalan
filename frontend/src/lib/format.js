const FMT_RUPIAH = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export const LABEL_LAPORAN = {
  masuk: 'Masuk',
  diverifikasi: 'Diverifikasi',
  diteruskan: 'Diteruskan',
  dikerjakan: 'Dikerjakan',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
  perlu_foto_ulang: 'Perlu foto ulang',
}

export function rupiah(nilai) {
  return nilai == null ? 'Belum tercatat' : FMT_RUPIAH.format(nilai)
}

export function tanggal(iso) {
  if (!iso) return 'Belum tercatat'
  const waktu = new Date(iso)
  if (Number.isNaN(waktu.getTime())) return 'Belum tercatat'
  return waktu.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function waktuRelatif(iso) {
  if (!iso) return 'waktu tidak diketahui'
  const detik = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (!Number.isFinite(detik) || detik < 60) return 'baru saja'
  const menit = Math.round(detik / 60)
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.round(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  const hari = Math.round(jam / 24)
  if (hari < 30) return `${hari} hari lalu`
  return tanggal(iso)
}

export function teksTenggat(iso, status) {
  if (status === 'selesai') return 'Selesai'
  if (!iso) return 'Tenggat belum diatur'
  const hari = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (!Number.isFinite(hari)) return 'Tenggat belum diatur'
  if (hari < 0) return `Lewat tenggat ${-hari} hari`
  if (hari === 0) return 'Tenggat hari ini'
  return `Tenggat ${hari} hari lagi`
}

const FMT_DESIMAL = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

export function rupiahSingkat(nilai) {
  if (nilai == null) return 'Belum tercatat'
  if (nilai >= 1e9) return `Rp ${FMT_DESIMAL.format(nilai / 1e9)} miliar`
  if (nilai >= 1e6) return `Rp ${FMT_DESIMAL.format(Math.round(nilai / 1e6))} juta`
  return rupiah(nilai)
}

export function tanggalPendek(iso) {
  if (!iso) return 'Belum tercatat'
  const waktu = new Date(iso)
  if (Number.isNaN(waktu.getTime())) return 'Belum tercatat'
  return waktu.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function jam(iso) {
  const waktu = new Date(iso)
  if (Number.isNaN(waktu.getTime())) return ''
  return waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function tanggalJam(iso) {
  if (!iso) return 'Belum tercatat'
  return `${tanggalPendek(iso)}, ${jam(iso)}`
}

export function waktuFoto(iso) {
  if (!iso) return 'Waktu tidak terbaca'
  const waktu = new Date(iso)
  const hariIni = new Date().toDateString() === waktu.toDateString()
  return hariIni ? `Diambil hari ini pukul ${jam(iso)}` : `Diambil ${tanggalJam(iso)}`
}
