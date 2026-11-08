import express from 'express'
import { fileURLToPath } from 'node:url'
import proyek from './routes/proyek.js'
import laporan from './routes/laporan.js'
import kontraktor from './routes/kontraktor.js'
import peta from './routes/peta.js'

export const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))
app.use(
  '/uploads',
  express.static(fileURLToPath(new URL('../uploads/', import.meta.url)), {
    maxAge: '7d',
    immutable: true,
  }),
)

app.get('/api/health', (_req, res) => {
  res.json({ data: { ok: true, waktu: new Date().toISOString() } })
})

app.use('/api/proyek', proyek)
app.use('/api/laporan', laporan)
app.use('/api/kontraktor', kontraktor)
app.use('/api/peta', peta)

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: { code: 'TIDAK_DITEMUKAN', message: 'Endpoint tidak ditemukan' },
  })
})

app.use((err, _req, res, _next) => {
  if (err?.name === 'MulterError') {
    const batas = err.code === 'LIMIT_FILE_SIZE'
    return res.status(batas ? 413 : 400).json({
      error: {
        code: 'UNGGAHAN',
        message: batas ? 'Ukuran foto maksimal 5MB' : 'Gagal mengunggah foto',
      },
    })
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'VALIDASI', message: 'Body JSON tidak valid' },
    })
  }

  if (err?.status && err?.code) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    })
  }

  console.error(err)
  res.status(500).json({
    error: { code: 'SERVER', message: 'Terjadi kesalahan pada server' },
  })
})
