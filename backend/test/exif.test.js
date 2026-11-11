import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bacaExif, jarakMeter } from '../src/exif.js'

function ifd(entri, mulai) {
  const kepala = 2 + entri.length * 12 + 4
  const tabel = Buffer.alloc(kepala)
  const ekstra = []
  let sisa = mulai + kepala
  tabel.writeUInt16LE(entri.length, 0)

  entri.forEach(({ tag, tipe, nilai }, i) => {
    const o = 2 + i * 12
    tabel.writeUInt16LE(tag, o)
    tabel.writeUInt16LE(tipe, o + 2)
    if (tipe === 2) {
      const isi = Buffer.from(nilai + '\0', 'ascii')
      tabel.writeUInt32LE(isi.length, o + 4)
      if (isi.length <= 4) isi.copy(tabel, o + 8)
      else {
        tabel.writeUInt32LE(sisa, o + 8)
        ekstra.push(isi)
        sisa += isi.length
      }
    } else if (tipe === 4) {
      tabel.writeUInt32LE(1, o + 4)
      tabel.writeUInt32LE(nilai, o + 8)
    } else if (tipe === 5) {
      const isi = Buffer.alloc(nilai.length * 8)
      nilai.forEach(([p, q], j) => {
        isi.writeUInt32LE(p, j * 8)
        isi.writeUInt32LE(q, j * 8 + 4)
      })
      tabel.writeUInt32LE(nilai.length, o + 4)
      tabel.writeUInt32LE(sisa, o + 8)
      ekstra.push(isi)
      sisa += isi.length
    }
  })
  return Buffer.concat([tabel, ...ekstra])
}

function jpegDenganExif({ gps = true } = {}) {
  const ifd0Mulai = 8
  const ukuranIfd0 = ifd(
    [
      { tag: 0x010f, tipe: 2, nilai: 'Samsung' },
      { tag: 0x0110, tipe: 2, nilai: 'SM-A155' },
      { tag: 0x8769, tipe: 4, nilai: 0 },
      ...(gps ? [{ tag: 0x8825, tipe: 4, nilai: 0 }] : []),
    ],
    ifd0Mulai,
  ).length
  const exifMulai = ifd0Mulai + ukuranIfd0
  const exifIfd = ifd([{ tag: 0x9003, tipe: 2, nilai: '2026:10:26 07:38:00' }], exifMulai)
  const gpsMulai = exifMulai + exifIfd.length
  const gpsIfd = ifd(
    [
      { tag: 0x0001, tipe: 2, nilai: 'S' },
      { tag: 0x0002, tipe: 5, nilai: [[7, 1], [26, 1], [5212, 100]] },
      { tag: 0x0003, tipe: 2, nilai: 'E' },
      { tag: 0x0004, tipe: 5, nilai: [[112, 1], [43, 1], [618, 100]] },
    ],
    gpsMulai,
  )
  const ifd0 = ifd(
    [
      { tag: 0x010f, tipe: 2, nilai: 'Samsung' },
      { tag: 0x0110, tipe: 2, nilai: 'SM-A155' },
      { tag: 0x8769, tipe: 4, nilai: exifMulai },
      ...(gps ? [{ tag: 0x8825, tipe: 4, nilai: gpsMulai }] : []),
    ],
    ifd0Mulai,
  )
  const tiff = Buffer.concat([Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0, 0, 0]), ifd0, exifIfd, ...(gps ? [gpsIfd] : [])])
  const app1 = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff])
  const panjang = Buffer.alloc(2)
  panjang.writeUInt16BE(app1.length + 2)
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), panjang, app1, Buffer.from([0xff, 0xd9])])
}

test('bacaExif membaca merek, waktu, dan GPS', () => {
  const exif = bacaExif(jpegDenganExif())
  assert.equal(exif.merek, 'Samsung')
  assert.equal(exif.model, 'SM-A155')
  assert.equal(exif.diambil_pada.toISOString(), '2026-10-26T00:38:00.000Z')
  assert.ok(Math.abs(exif.lat - -7.447811) < 1e-5)
  assert.ok(Math.abs(exif.lng - 112.718383) < 1e-5)
})

test('bacaExif tanpa GPS mengembalikan koordinat null', () => {
  const exif = bacaExif(jpegDenganExif({ gps: false }))
  assert.equal(exif.lat, null)
  assert.equal(exif.lng, null)
  assert.equal(exif.merek, 'Samsung')
})

test('bacaExif mengembalikan null untuk file bukan JPEG', () => {
  assert.equal(bacaExif(Buffer.from('bukan gambar')), null)
  assert.equal(bacaExif(Buffer.from([0x89, 0x50, 0x4e, 0x47])), null)
})

test('jarakMeter menghitung jarak dua titik', () => {
  const d = jarakMeter([-7.4478, 112.7042], [-7.4478, 112.7051])
  assert.ok(d > 95 && d < 105)
})
