import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasilPerbaikan, hitungRapor, nilaiHuruf } from '../src/rapor.js'

const sekarang = new Date('2026-11-01T00:00:00Z')
const proyek = [
  { id: 'p1', nilai_kontrak: 4_200_000_000, selesai_pada: '2025-11-07', masa_pemeliharaan_bulan: 12 },
  { id: 'p2', nilai_kontrak: 1_000_000_000, selesai_pada: '2023-01-01', masa_pemeliharaan_bulan: 6 },
]

test('nilaiHuruf mengikuti ambang A/B/C/D', () => {
  assert.equal(nilaiHuruf(96), 'A')
  assert.equal(nilaiHuruf(89), 'B')
  assert.equal(nilaiHuruf(71), 'C')
  assert.equal(nilaiHuruf(52), 'D')
  assert.equal(nilaiHuruf(null), null)
})

test('hasilPerbaikan membedakan tepat waktu, terlambat, dan belum jatuh tempo', () => {
  assert.deepEqual(hasilPerbaikan({ tenggat_pada: '2026-10-27', selesai_pada: '2026-10-25' }, sekarang), {
    jatuh_tempo: true,
    tepat: true,
    selisih_hari: 2,
  })
  assert.equal(hasilPerbaikan({ tenggat_pada: '2026-10-20', selesai_pada: '2026-10-23' }, sekarang).tepat, false)
  assert.equal(hasilPerbaikan({ tenggat_pada: '2026-10-25', selesai_pada: null }, sekarang).selisih_hari, -7)
  assert.equal(hasilPerbaikan({ tenggat_pada: '2026-11-10', selesai_pada: null }, sekarang).jatuh_tempo, false)
})

test('hitungRapor hanya menghitung laporan selama masa garansi', () => {
  const laporan = [
    { proyek_id: 'p1', dibuat_pada: '2026-10-12', tenggat_pada: '2026-10-26', selesai_pada: '2026-10-24', buka_lagi_count: 0 },
    { proyek_id: 'p1', dibuat_pada: '2026-10-01', tenggat_pada: '2026-10-15', selesai_pada: null, buka_lagi_count: 1 },
    { proyek_id: 'p2', dibuat_pada: '2026-10-01', tenggat_pada: '2026-10-15', selesai_pada: null, buka_lagi_count: 0 },
  ]
  const rapor = hitungRapor(proyek, laporan, sekarang)
  assert.equal(rapor.paket, 2)
  assert.equal(rapor.nilai_kontrak, 5_200_000_000)
  assert.equal(rapor.laporan_garansi, 2)
  assert.equal(rapor.tepat_waktu, 1)
  assert.equal(rapor.lewat_tenggat, 1)
  assert.equal(rapor.persen_tepat, 50)
  assert.equal(rapor.skor, 45)
  assert.equal(rapor.nilai, 'D')
  assert.equal(rapor.rata_hari, 12)
})
