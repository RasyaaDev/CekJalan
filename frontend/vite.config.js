import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || 'http://localhost:3000'
  const proxy = { '/api': target, '/uploads': target }
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
  }
})
