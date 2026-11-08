import test from 'node:test'
import assert from 'node:assert/strict'
import { akhirGaransi, sisaHariGaransi, statusGaransi, telat, denganGaransi } from '../src/garansi.js'

const iso = (tanggal) => tanggal?.toISOString().slice(0, 10) ?? null

test('akhir garansi menambah bulan dan menjaga akhir bulan', () => {
  assert.equal(iso(akhirGaransi({ selesai_pada: '2025-01-31', masa_pemeliharaan_bulan: 1 })), '2025-02-28')
  assert.equal(iso(akhirGaransi({ selesai_pada: '2024-01-31', masa_pemeliharaan_bulan: 1 })), '2024-02-29')
  assert.equal(iso(akhirGaransi({ selesai_pada: '2025-03-15', masa_pemeliharaan_bulan: 12 })), '2026-03-15')
})

test('akhir garansi null jika data kurang', () => {
  assert.equal(akhirGaransi({ selesai_pada: null, masa_pemeliharaan_bulan: 12 }), null)
  assert.equal(akhirGaransi({ selesai_pada: '2025-01-01', masa_pemeliharaan_bulan: null }), null)
  assert.equal(akhirGaransi({ selesai_pada: 'bukan tanggal', masa_pemeliharaan_bulan: 12 }), null)
})

test('status garansi ok, warn, exp', () => {
  const proyek = { selesai_pada: '2025-01-01', masa_pemeliharaan_bulan: 2 }
  assert.equal(statusGaransi(proyek, new Date('2025-01-15T00:00:00Z')), 'ok')
  assert.equal(statusGaransi(proyek, new Date('2025-02-05T00:00:00Z')), 'warn')
  assert.equal(statusGaransi(proyek, new Date('2025-03-02T00:00:00Z')), 'exp')
  assert.equal(statusGaransi({ selesai_pada: null }, new Date()), null)
})

test('sisa hari garansi', () => {
  const proyek = { selesai_pada: '2025-01-01', masa_pemeliharaan_bulan: 1 }
  assert.equal(sisaHariGaransi(proyek, new Date('2025-01-31T00:00:00Z')), 1)
  assert.equal(sisaHariGaransi(proyek, new Date('2025-02-01T00:00:00Z')), 0)
  assert.equal(sisaHariGaransi(proyek, new Date('2025-02-02T00:00:00Z')), -1)
})

test('telat hanya untuk laporan belum selesai yang melewati tenggat', () => {
  const tenggat = '2025-01-10T00:00:00Z'
  assert.equal(telat({ status: 'dikerjakan', tenggat_pada: tenggat }, new Date('2025-01-11T00:00:00Z')), true)
  assert.equal(telat({ status: 'selesai', tenggat_pada: tenggat }, new Date('2025-01-11T00:00:00Z')), false)
  assert.equal(telat({ status: 'masuk', tenggat_pada: tenggat }, new Date('2025-01-09T00:00:00Z')), false)
  assert.equal(telat({ status: 'masuk', tenggat_pada: null }, new Date()), false)
})

test('denganGaransi menambahkan field turunan', () => {
  const hasil = denganGaransi(
    { ruas: 'Jl. Uji', selesai_pada: '2025-01-01', masa_pemeliharaan_bulan: 12 },
    new Date('2025-06-01T00:00:00Z'),
  )
  assert.equal(hasil.ruas, 'Jl. Uji')
  assert.equal(hasil.garansi, 'ok')
  assert.equal(hasil.akhir_garansi, '2026-01-01')
  assert.equal(hasil.sisa_hari, 214)
})
