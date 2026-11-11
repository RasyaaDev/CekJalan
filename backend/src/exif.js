const UKURAN_TIPE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

function bacaIfd(view, tiff, offset, kecil) {
  const hasil = {}
  if (offset + 2 > view.byteLength) return hasil
  const jumlah = view.getUint16(offset, kecil)

  for (let i = 0; i < jumlah; i++) {
    const entri = offset + 2 + i * 12
    if (entri + 12 > view.byteLength) break
    const tag = view.getUint16(entri, kecil)
    const tipe = view.getUint16(entri + 2, kecil)
    const banyak = view.getUint32(entri + 4, kecil)
    const ukuran = (UKURAN_TIPE[tipe] ?? 1) * banyak
    const posisi = ukuran <= 4 ? entri + 8 : tiff + view.getUint32(entri + 8, kecil)
    if (posisi + ukuran > view.byteLength) continue

    if (tipe === 2) {
      let teks = ''
      for (let j = 0; j < banyak; j++) {
        const kode = view.getUint8(posisi + j)
        if (kode === 0) break
        teks += String.fromCharCode(kode)
      }
      hasil[tag] = teks.trim()
    } else if (tipe === 3) {
      hasil[tag] = view.getUint16(posisi, kecil)
    } else if (tipe === 4) {
      hasil[tag] = view.getUint32(posisi, kecil)
    } else if (tipe === 5) {
      const nilai = []
      for (let j = 0; j < banyak; j++) {
        const pembilang = view.getUint32(posisi + j * 8, kecil)
        const penyebut = view.getUint32(posisi + j * 8 + 4, kecil)
        nilai.push(penyebut ? pembilang / penyebut : 0)
      }
      hasil[tag] = nilai
    }
  }
  return hasil
}

function derajat([d = 0, m = 0, s = 0] = [], ref) {
  const nilai = d + m / 60 + s / 3600
  return ref === 'S' || ref === 'W' ? -nilai : nilai
}

function waktuExif(teks, offset) {
  const cocok = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(teks ?? '')
  if (!cocok) return null
  const [, th, bl, tg, jm, mn, dt] = cocok
  const zona = /^[+-]\d{2}:\d{2}$/.test(offset ?? '') ? offset : '+07:00'
  const waktu = new Date(`${th}-${bl}-${tg}T${jm}:${mn}:${dt}${zona}`)
  return Number.isNaN(waktu.getTime()) ? null : waktu
}

export function bacaExif(buffer) {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null

  let posisi = 2
  while (posisi + 4 <= view.byteLength) {
    if (view.getUint8(posisi) !== 0xff) return null
    const penanda = view.getUint8(posisi + 1)
    const panjang = view.getUint16(posisi + 2)
    if (penanda === 0xda || penanda === 0xd9) return null

    const isExif =
      penanda === 0xe1 &&
      posisi + 10 <= view.byteLength &&
      view.getUint32(posisi + 4) === 0x45786966 &&
      view.getUint16(posisi + 8) === 0

    if (isExif) {
      const tiff = posisi + 10
      const urutan = view.getUint16(tiff)
      if (urutan !== 0x4949 && urutan !== 0x4d4d) return null
      const kecil = urutan === 0x4949
      const ifd0 = bacaIfd(view, tiff, tiff + view.getUint32(tiff + 4, kecil), kecil)
      const exif = ifd0[0x8769] ? bacaIfd(view, tiff, tiff + ifd0[0x8769], kecil) : {}
      const gps = ifd0[0x8825] ? bacaIfd(view, tiff, tiff + ifd0[0x8825], kecil) : {}

      const punyaGps = Array.isArray(gps[2]) && Array.isArray(gps[4])
      return {
        merek: ifd0[0x010f] || null,
        model: ifd0[0x0110] || null,
        software: ifd0[0x0131] || null,
        diambil_pada: waktuExif(exif[0x9003] ?? ifd0[0x0132], exif[0x9011]),
        lat: punyaGps ? derajat(gps[2], gps[1]) : null,
        lng: punyaGps ? derajat(gps[4], gps[3]) : null,
      }
    }

    posisi += 2 + panjang
  }
  return null
}

export function jarakMeter(a, b) {
  const R = 6_371_000
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
