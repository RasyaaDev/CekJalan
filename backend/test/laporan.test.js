import test from 'node:test'
import assert from 'node:assert/strict'
import { STATUS, TRANSISI, bolehTransisi, laporanPublik, statusPublik } from '../src/laporan.js'

test('alur status maju sesuai urutan', () => {
  assert.equal(bolehTransisi('masuk', 'diverifikasi'), true)
  assert.equal(bolehTransisi('diverifikasi', 'diteruskan'), true)
  assert.equal(bolehTransisi('diteruskan', 'dikerjakan'), true)
  assert.equal(bolehTransisi('dikerjakan', 'selesai'), true)
})

test('tidak boleh melompat atau mundur sembarangan', () => {
  assert.equal(bolehTransisi('masuk', 'dikerjakan'), false)
  assert.equal(bolehTransisi('selesai', 'diverifikasi'), false)
  assert.equal(bolehTransisi('ditolak', 'masuk'), false)
})

test('selesai bisa dibuka lagi ke dikerjakan', () => {
  assert.equal(bolehTransisi('selesai', 'dikerjakan'), true)
})

test('semua status punya definisi transisi', () => {
  for (const status of STATUS) {
    assert.ok(Array.isArray(TRANSISI[status]), status)
  }
})

test('laporanPublik membuang data pribadi pelapor', () => {
  const asli = {
    kode: 'CJ-1',
    status: 'masuk',
    pelapor_nama: 'Ani',
    pelapor_wa: '628123',
    pelapor_email: 'ani@contoh.id',
    warga_id: 'w1',
    foto_hash: ['abc'],
  }
  const publik = laporanPublik(asli)
  assert.deepEqual(publik, { kode: 'CJ-1', status: 'masuk' })
  assert.equal(asli.pelapor_nama, 'Ani')
  assert.equal('pelapor_nama' in publik, false)
  assert.equal('pelapor_wa' in publik, false)
})

test('petugas bisa menolak atau minta foto ulang laporan masuk', () => {
  assert.equal(bolehTransisi('masuk', 'ditolak'), true)
  assert.equal(bolehTransisi('masuk', 'perlu_foto_ulang'), true)
  assert.equal(bolehTransisi('perlu_foto_ulang', 'diverifikasi'), true)
  assert.equal(bolehTransisi('ditolak', 'diverifikasi'), false)
  assert.equal(bolehTransisi('diteruskan', 'ditolak'), false)
})

test('hanya laporan terverifikasi yang publik', () => {
  for (const s of ['diverifikasi', 'diteruskan', 'dikerjakan', 'selesai']) assert.equal(statusPublik(s), true, s)
  for (const s of ['masuk', 'ditolak', 'perlu_foto_ulang']) assert.equal(statusPublik(s), false, s)
})
