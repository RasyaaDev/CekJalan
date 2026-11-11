import { jarakMeter } from './exif.js'

export const BATAS_JARAK_M = 50
export const BATAS_UMUR_JAM = 24
const JAM_MS = 3_600_000

function jarakTeks(meter) {
  return meter >= 1000 ? `${(meter / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(meter)} m`
}

export function asalFoto(exif, kamera) {
  if (kamera?.lat != null && kamera?.lng != null && kamera?.pada) {
    return { sumber: 'kamera', lat: kamera.lat, lng: kamera.lng, pada: new Date(kamera.pada), asli: true }
  }
  const software = (exif?.software ?? '').toLowerCase()
  return {
    sumber: 'galeri',
    lat: exif?.lat ?? null,
    lng: exif?.lng ?? null,
    pada: exif?.diambil_pada ?? null,
    asli: Boolean(exif?.merek || exif?.model) && !software.includes('screenshot'),
  }
}

export function periksaFoto({ asal, titik, duplikat, sekarang = new Date() }) {
  const hasil = []

  if (asal.lat == null || asal.lng == null) {
    hasil.push({
      kode: 'lokasi',
      lolos: false,
      judul: 'Lokasi geotag',
      detail: 'Foto tidak menyimpan lokasi. Nyalakan izin lokasi kamera atau ambil foto lewat tombol kamera.',
    })
  } else if (!titik) {
    hasil.push({ kode: 'lokasi', lolos: false, judul: 'Lokasi geotag', detail: 'Pilih titik kerusakan di peta dulu.' })
  } else {
    const jarak = jarakMeter([asal.lat, asal.lng], titik)
    hasil.push({
      kode: 'lokasi',
      lolos: jarak <= BATAS_JARAK_M,
      judul: jarak <= BATAS_JARAK_M ? 'Lokasi foto cocok' : 'Lokasi geotag',
      detail:
        jarak <= BATAS_JARAK_M
          ? `Geotag foto berjarak ${jarakTeks(jarak)} dari titik yang kamu pilih di peta.`
          : `${jarakTeks(jarak)} dari titik laporan. Batas maksimal ${BATAS_JARAK_M} m.`,
      jarak_m: Math.round(jarak),
    })
  }

  if (!asal.pada || Number.isNaN(asal.pada.getTime())) {
    hasil.push({ kode: 'waktu', lolos: false, judul: 'Waktu pengambilan', detail: 'Waktu pengambilan foto tidak terbaca.' })
  } else {
    const umur = sekarang.getTime() - asal.pada.getTime()
    const lolos = umur <= BATAS_UMUR_JAM * JAM_MS && umur >= -5 * 60_000
    hasil.push({
      kode: 'waktu',
      lolos,
      judul: lolos ? 'Foto baru' : 'Waktu pengambilan',
      detail: lolos
        ? 'Bukan foto lama atau unduhan.'
        : `Foto harus diambil maksimal ${BATAS_UMUR_JAM} jam sebelum melapor.`,
      diambil_pada: asal.pada.toISOString(),
    })
  }

  hasil.push({
    kode: 'asli',
    lolos: asal.asli,
    judul: 'Foto asli dari kamera',
    detail: asal.asli ? 'Bukan tangkapan layar atau gambar hasil unduhan.' : 'Tidak ada data kamera. Bisa jadi tangkapan layar atau unduhan.',
  })

  hasil.push({
    kode: 'duplikat',
    lolos: !duplikat,
    judul: duplikat ? 'Foto sudah pernah dilaporkan' : 'Belum pernah dilaporkan',
    detail: duplikat ? `Foto yang sama sudah dipakai di laporan ${duplikat}.` : 'Foto ini belum pernah diunggah ke CekJalan.',
  })

  return { lolos: hasil.every((c) => c.lolos), sumber: asal.sumber, cek: hasil }
}
