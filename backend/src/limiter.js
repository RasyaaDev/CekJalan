const catatan = new Map()

// ponytail: in-memory per instance; pindah ke Redis/express-rate-limit jika API dijalankan multi-instance
export function batasi({ maks = 10, jendelaMs = 60_000 } = {}) {
  return (req, res, next) => {
    const kunci = req.ip
    const sekarang = Date.now()
    const riwayat = (catatan.get(kunci) ?? []).filter((waktu) => sekarang - waktu < jendelaMs)
    if (riwayat.length >= maks) {
      res.set('Retry-After', String(Math.ceil(jendelaMs / 1000)))
      return res.status(429).json({
        error: { code: 'TERLALU_BANYAK', message: 'Terlalu banyak permintaan, coba lagi nanti.' },
      })
    }
    riwayat.push(sekarang)
    catatan.set(kunci, riwayat)
    next()
  }
}
