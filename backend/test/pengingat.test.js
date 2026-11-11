import { test } from 'node:test'
import assert from 'node:assert/strict'
import { perluDiingatkan, pemantauRuas, PENGATURAN_AWAL } from '../src/pengingat.js'
import { jarakMeter } from '../src/exif.js'

const hariIni = new Date('2026-11-01T00:00:00Z')
const proyek = (sisaHari) => {
  const akhir = new Date(hariIni.getTime() + sisaHari * 86_400_000)
  akhir.setUTCMonth(akhir.getUTCMonth() - 12)
  return { id: 'p1', selesai_pada: akhir.toISOString().slice(0, 10), masa_pemeliharaan_bulan: 12 }
}

test('memilih jadwal terdekat yang sudah jatuh tempo', () => {
  assert.equal(perluDiingatkan(proyek(45), hariIni).jenis, 'h60')
  assert.equal(perluDiingatkan(proyek(20), hariIni).jenis, 'h30')
  assert.equal(perluDiingatkan(proyek(5), hariIni).jenis, 'h7')
})

test('tidak mengingatkan proyek yang masih jauh atau sudah habis', () => {
  assert.equal(perluDiingatkan(proyek(90), hariIni), null)
  assert.equal(perluDiingatkan(proyek(-3), hariIni), null)
  assert.equal(perluDiingatkan({ id: 'x' }, hariIni), null)
})

test('tidak mengirim jenis yang sama dua kali', () => {
  assert.equal(perluDiingatkan(proyek(20), hariIni, [{ proyek_id: 'p1', jenis: 'h30' }]), null)
  assert.equal(perluDiingatkan(proyek(20), hariIni, [{ proyek_id: 'p2', jenis: 'h30' }]).jenis, 'h30')
})

test('h60 yang sudah terkirim tidak menghalangi h30', () => {
  assert.equal(perluDiingatkan(proyek(20), hariIni, [{ proyek_id: 'p1', jenis: 'h60' }]).jenis, 'h30')
})

test('jadwal yang dimatikan dilewati', () => {
  const pengaturan = { ...PENGATURAN_AWAL, h30: false }
  assert.equal(perluDiingatkan(proyek(20), hariIni, [], pengaturan).jenis, 'h60')
  assert.equal(perluDiingatkan(proyek(20), hariIni, [], { ...pengaturan, h60: false }), null)
})

test('pemantauRuas mencocokkan pilihan ruas atau radius', () => {
  const p = { id: 'p1', lat: -7.4478, lng: 112.7183 }
  const pantauan = [
    { email: 'a', aktif: true, proyek_ids: ['p1'] },
    { email: 'b', aktif: true, proyek_ids: [], lat: -7.4479, lng: 112.7184, radius_m: 500 },
    { email: 'c', aktif: true, proyek_ids: [], lat: -7.5, lng: 112.8, radius_m: 500 },
    { email: 'd', aktif: false, proyek_ids: ['p1'] },
  ]
  assert.deepEqual(pemantauRuas(p, pantauan, jarakMeter).map((x) => x.email), ['a', 'b'])
})
