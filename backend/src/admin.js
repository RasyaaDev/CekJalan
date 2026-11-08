import { timingSafeEqual } from 'node:crypto'

export function admin(req, res, next) {
  const kunci = process.env.ADMIN_KEY
  if (!kunci) {
    return res.status(503).json({
      error: { code: 'BELUM_DIKONFIGURASI', message: 'ADMIN_KEY belum diatur di server.' },
    })
  }

  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(token)
  const b = Buffer.from(kunci)

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({
      error: { code: 'TIDAK_AUTORISASI', message: 'Kunci admin tidak valid.' },
    })
  }

  next()
}
