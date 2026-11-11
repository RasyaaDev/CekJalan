import { test } from 'node:test'
import assert from 'node:assert/strict'
import { htmlEmail, samarkanEmail } from '../src/email.js'

test('htmlEmail memuat judul, kode, dan tombol', () => {
  const html = htmlEmail({ judul: 'Verifikasi', teks: 'Baris satu\n\nBaris dua', kode: '123456', tombol: { label: 'Buka', url: 'https://contoh.id/x' } })
  assert.match(html, /Verifikasi/)
  assert.match(html, />123456</)
  assert.match(html, /href="https:\/\/contoh\.id\/x"/)
  assert.equal(html.match(/<p style="margin:0 0 14px/g).length, 2)
})

test('htmlEmail menetralkan HTML dari isian pengguna', () => {
  const html = htmlEmail({ judul: 'Kabar', teks: 'Alasan: <script>alert(1)</script> & "kutip"' })
  assert.equal(html.includes('<script>'), false)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;kutip&quot;/)
})

test('samarkanEmail menyembunyikan sebagian nama', () => {
  assert.equal(samarkanEmail('rasya@gmail.com'), 'ra•••@gmail.com')
  assert.equal(samarkanEmail(null), null)
})
