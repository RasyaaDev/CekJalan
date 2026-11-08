export class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function teks(nilai, nama, { min = 1, max = 500 } = {}) {
  if (typeof nilai !== 'string') throw new HttpError(400, 'VALIDASI', `${nama} wajib diisi`)
  const hasil = nilai.trim()
  if (hasil.length < min || hasil.length > max) {
    throw new HttpError(400, 'VALIDASI', `${nama} harus ${min}-${max} karakter`)
  }
  return hasil
}

export function angkaDesimal(nilai, nama, { min, max }) {
  const hasil = Number(nilai)
  if (!Number.isFinite(hasil) || hasil < min || hasil > max) {
    throw new HttpError(400, 'VALIDASI', `${nama} harus antara ${min} dan ${max}`)
  }
  return hasil
}

export function pilihan(nilai, nama, daftar) {
  if (!daftar.includes(nilai)) {
    throw new HttpError(400, 'VALIDASI', `${nama} harus salah satu dari: ${daftar.join(', ')}`)
  }
  return nilai
}

export function nomorWa(nilai) {
  const digit = String(nilai ?? '').replace(/\D/g, '')
  if (!/^(?:62|0)8\d{7,12}$/.test(digit)) {
    throw new HttpError(400, 'VALIDASI', 'Nomor WhatsApp tidak valid')
  }
  return digit
}

export function batas(nilai, bawaan = 20) {
  const hasil = Number(nilai)
  if (!Number.isInteger(hasil) || hasil < 1) return bawaan
  return Math.min(hasil, 50)
}
