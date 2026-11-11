import * as cheerio from 'cheerio'

const BASE = (process.env.LPSE_BASE || 'https://spse.inaproc.id/sidoarjokab').replace(/\/$/, '')
const UA =
  process.env.LPSE_UA ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const JEDA_MS = 1500

export function tidur(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function bersihkan(html) {
  return cheerio.load(html ?? '').text().replace(/\s+/g, ' ').trim()
}

export function judul(teks) {
  return teks
    .toLowerCase()
    .replace(/(^|[\s(/-])(\p{L})/gu, (_, awal, huruf) => awal + huruf.toUpperCase())
}

export function rapikanTanda(teks) {
  return teks
    .replace(/\(\s*\*+\s*\)|\*+/g, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/^[\s,./;:-]+|[\s,./;:-]+$/g, '')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
}

export function rapikanRuas(nama) {
  return rapikanTanda(
    bersihkan(nama)
      .replace(/^[\s,./;:-]+/, '')
      .replace(/^(peningkatan|pembangunan|rehabilitasi|pemeliharaan|penataan|pelebaran)\s+/i, '')
      .replace(/\b(tender ulang|tender gagal|dibatalkan|dilelang ulang)\b/gi, ''),
  )
}

export function slugify(teks) {
  return teks
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

export function rupiah(nilai) {
  const cocok = String(nilai ?? '').replace(/\s/g, '').match(/Rp\.?([\d.,]+)/i)
  if (!cocok) return null
  const angka = Number(cocok[1].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(angka) && angka > 0 ? Math.round(angka) : null
}

export function parseBaris(row, tahun) {
  const kategori = bersihkan(row?.[8])
  return {
    kode_tender: String(row?.[0] ?? '').trim(),
    nama: bersihkan(row?.[1]),
    lokasi: bersihkan(row?.[2]),
    tahapan: bersihkan(row?.[3]),
    nilai_kontrak: rupiah(row?.[10]),
    kategori,
    tahun: Number(kategori.match(/TA\s+(\d{4})/i)?.[1]) || tahun,
    sumber_url: `${BASE}/lelang/${String(row?.[0] ?? '').trim()}/pengumumanlelang`,
  }
}

export function parsePemenang(html) {
  const $ = cheerio.load(html)
  const hasil = { pemenang: null, nilai_kontrak: null }

  $('table').each((_, tabel) => {
    const kepala = $(tabel)
      .find('tr')
      .first()
      .find('th')
      .map((_, sel) => $(sel).text().replace(/\s+/g, ' ').trim())
      .get()

    const iNama = kepala.indexOf('Nama Pemenang')
    if (iNama === -1) return

    const isi = $(tabel).find('tr').eq(1).find('td')
    hasil.pemenang = isi.eq(iNama).text().replace(/\s+/g, ' ').trim() || null

    const iHarga = kepala.indexOf('Harga Kontrak')
    if (iHarga !== -1) hasil.nilai_kontrak = rupiah(isi.eq(iHarga).text())

    return false
  })

  return hasil
}

export class SesiLpse {
  #cookies = new Map()
  #token = null

  #simpanCookies(res) {
    for (const baris of res.headers.getSetCookie?.() ?? []) {
      const pasangan = baris.split(';')[0]
      const posisi = pasangan.indexOf('=')
      if (posisi > 0) this.#cookies.set(pasangan.slice(0, posisi), pasangan.slice(posisi + 1))
    }
  }

  #headers(tambahan = {}) {
    const headers = {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      ...tambahan,
    }
    if (this.#cookies.size) {
      headers.Cookie = [...this.#cookies].map(([nama, nilai]) => `${nama}=${nilai}`).join('; ')
    }
    return headers
  }

  async buka(tahun) {
    const url = `${BASE}/lelang?kategoriId=2&tahun=${tahun}`
    const res = await fetch(url, { headers: this.#headers(), redirect: 'follow' })
    this.#simpanCookies(res)
    const html = await res.text()

    if (!res.ok) throw new Error(`LPSE menolak halaman daftar (${res.status})`)

    const token = html.match(/authenticityToken\s*=\s*'([^']+)'/)
    if (!token) throw new Error('Token LPSE tidak ditemukan di halaman daftar')

    this.#token = token[1]
  }

  async halaman(tahun, start, length = 100, bolehUlang = true) {
    if (!this.#token) await this.buka(tahun)

    const body = new URLSearchParams({
      authenticityToken: this.#token,
      draw: '1',
      start: String(start),
      length: String(length),
      'search[value]': '',
      'search[regex]': 'false',
      'order[0][column]': '5',
      'order[0][dir]': 'desc',
    })

    const res = await fetch(`${BASE}/dt/lelang?tahun=${tahun}&kategoriId=2`, {
      method: 'POST',
      headers: this.#headers({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${BASE}/lelang?kategoriId=2&tahun=${tahun}`,
      }),
      body,
    })
    this.#simpanCookies(res)

    if (res.status === 403 && bolehUlang) {
      this.#token = null
      await tidur(JEDA_MS)
      return this.halaman(tahun, start, length, false)
    }

    const teks = await res.text()
    if (!res.ok) throw new Error(`LPSE menolak daftar paket (${res.status}): ${teks.slice(0, 160)}`)

    try {
      const json = JSON.parse(teks)
      return Array.isArray(json.data) ? json.data : []
    } catch {
      throw new Error(`Balasan LPSE bukan JSON: ${teks.slice(0, 160)}`)
    }
  }

  async detailPemenang(kode, tahun) {
    const res = await fetch(`${BASE}/evaluasi/${kode}/pemenangberkontrak`, {
      headers: this.#headers({
        Referer: `${BASE}/lelang?kategoriId=2&tahun=${tahun}`,
      }),
    })

    const html = await res.text()
    if (!res.ok) throw new Error(`LPSE menolak detail pemenang ${kode} (${res.status})`)
    return parsePemenang(html)
  }
}

export async function ambilPaket(tahun, { filter = /jalan|paving|trotoar|aspal/i, batas = 5 } = {}) {
  const sesi = new SesiLpse()
  const hasil = []

  for (let halaman = 0; halaman < 10; halaman++) {
    const baris = await sesi.halaman(tahun, halaman * 100, 100)

    for (const row of baris) {
      const paket = parseBaris(row, tahun)
      if (!filter.test(paket.nama)) continue
      if (paket.nilai_kontrak == null) continue
      hasil.push(paket)
      if (hasil.length >= batas) return { sesi, hasil }
    }

    if (baris.length < 100) break
    await tidur(JEDA_MS)
  }

  return { sesi, hasil }
}
