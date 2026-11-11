import test from 'node:test'
import assert from 'node:assert/strict'
import { HttpError, teks, angkaDesimal, pilihan, nomorWa, batas } from '../src/validasi.js'

test('teks memangkas spasi dan memeriksa panjang', () => {
  assert.equal(teks('  jalan berlubang  ', 'Deskripsi'), 'jalan berlubang')
  assert.throws(() => teks('', 'Deskripsi'), HttpError)
  assert.throws(() => teks('x'.repeat(1001), 'Deskripsi', { max: 1000 }), HttpError)
  assert.equal(teks('', 'Catatan', { min: 0 }), '')
  assert.throws(() => teks(123, 'Deskripsi'), HttpError)
})

test('angkaDesimal memeriksa rentang', () => {
  assert.equal(angkaDesimal('-7.45', 'Latitude', { min: -90, max: 90 }), -7.45)
  assert.throws(() => angkaDesimal('abc', 'Latitude', { min: -90, max: 90 }), HttpError)
  assert.throws(() => angkaDesimal(91, 'Latitude', { min: -90, max: 90 }), HttpError)
})

test('pilihan menolak nilai di luar daftar', () => {
  assert.equal(pilihan('masuk', 'Status', ['masuk', 'selesai']), 'masuk')
  assert.throws(() => pilihan('hapus', 'Status', ['masuk', 'selesai']), HttpError)
})

test('nomorWa menerima format Indonesia umum', () => {
  assert.equal(nomorWa('0812-3456-7890'), '081234567890')
  assert.equal(nomorWa('+62 812 3456 7890'), '6281234567890')
  assert.equal(nomorWa('6281234567890'), '6281234567890')
  assert.throws(() => nomorWa('12345'), HttpError)
  assert.throws(() => nomorWa(null), HttpError)
})

test('batas membatasi limit', () => {
  assert.equal(batas(undefined), 20)
  assert.equal(batas('7'), 7)
  assert.equal(batas(0), 20)
  assert.equal(batas(999), 50)
  assert.equal(batas('abc'), 20)
})

test('csv menetralkan sel yang bisa jadi formula', async () => {
  const { csv } = await import('../src/ekspor.js')
  const hasil = csv([{ a: '=HYPERLINK("x")', b: -7.44, c: '+1' }], ['a', 'b', 'c'])
  assert.equal(hasil, `a,b,c\r\n"'=HYPERLINK(""x"")",-7.44,'+1\r\n`)
})
