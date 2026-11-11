import { test } from 'node:test'
import assert from 'node:assert/strict'
import { batasi } from '../src/limiter.js'

function panggil(pembatas, ip = '1.1.1.1') {
  let status = 200
  const res = { set() {}, status(s) { status = s; return { json() {} } } }
  pembatas({ ip }, res, () => {})
  return status
}

test('membatasi setelah kuota habis, per alamat IP', () => {
  const pembatas = batasi({ maks: 2, jendelaMs: 60_000 })
  assert.equal(panggil(pembatas), 200)
  assert.equal(panggil(pembatas), 200)
  assert.equal(panggil(pembatas), 429)
  assert.equal(panggil(pembatas, '2.2.2.2'), 200)
})

test('kuota tiap pembatas tidak saling memakan', () => {
  const masuk = batasi({ maks: 1, jendelaMs: 60_000 })
  const lapor = batasi({ maks: 1, jendelaMs: 60_000 })
  assert.equal(panggil(masuk), 200)
  assert.equal(panggil(lapor), 200)
  assert.equal(panggil(masuk), 429)
})
