import { app } from './app.js'

const port = Number(process.env.PORT) || 3000

app.listen(port, process.env.HOST || undefined, () => {
  console.log(`CekJalan API berjalan di http://localhost:${port}`)
})
