import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asalFoto, periksaFoto } from '../src/cekFoto.js'

const sekarang = new Date('2026-10-26T01:00:00Z')
const titik = [-7.4478, 112.7042]

test('foto kamera dalam 50 m dan baru lolos semua cek', () => {
  const asal = asalFoto(null, { lat: -7.4479, lng: 112.7042, pada: '2026-10-26T00:38:00Z' })
  const hasil = periksaFoto({ asal, titik, duplikat: null, sekarang })
  assert.equal(hasil.lolos, true)
  assert.equal(hasil.sumber, 'kamera')
  assert.equal(hasil.cek.find((c) => c.kode === 'lokasi').jarak_m, 11)
})

test('foto galeri jauh dan lama gagal di lokasi dan waktu', () => {
  const asal = asalFoto(
    { merek: 'Samsung', model: 'A15', lat: -7.4278, lng: 112.7042, diambil_pada: new Date('2026-09-14T10:02:00Z') },
    null,
  )
  const hasil = periksaFoto({ asal, titik, duplikat: null, sekarang })
  assert.equal(hasil.lolos, false)
  assert.equal(hasil.cek.find((c) => c.kode === 'lokasi').lolos, false)
  assert.match(hasil.cek.find((c) => c.kode === 'lokasi').detail, /2,2 km/)
  assert.equal(hasil.cek.find((c) => c.kode === 'waktu').lolos, false)
  assert.equal(hasil.cek.find((c) => c.kode === 'asli').lolos, true)
})

test('tangkapan layar tanpa data kamera dan duplikat ditolak', () => {
  const asal = asalFoto({ software: 'Android Screenshot', lat: null, lng: null, diambil_pada: null }, null)
  const hasil = periksaFoto({ asal, titik, duplikat: 'CJ-1024', sekarang })
  assert.equal(hasil.lolos, false)
  assert.deepEqual(
    hasil.cek.map((c) => c.lolos),
    [false, false, false, false],
  )
  assert.match(hasil.cek.at(-1).detail, /CJ-1024/)
})
