import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ??= 'http://localhost'
process.env.SUPABASE_SECRET_KEY ??= 'tes'
const { hashSandi, cocokSandi } = await import('../src/petugas.js')

test('sandi petugas di-hash dan bisa dicocokkan', () => {
  const simpanan = hashSandi('rahasia-123')
  assert.match(simpanan, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
  assert.equal(cocokSandi('rahasia-123', simpanan), true)
  assert.equal(cocokSandi('salah', simpanan), false)
  assert.notEqual(hashSandi('rahasia-123'), simpanan)
})

test('simpanan rusak tidak pernah cocok', () => {
  assert.equal(cocokSandi('a', ''), false)
  assert.equal(cocokSandi('a', null), false)
  assert.equal(cocokSandi('a', 'md5$x$y'), false)
})
