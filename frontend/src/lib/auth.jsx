import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getData, kirim } from './api'

const KonteksWarga = createContext({ warga: null, siap: false, segarkan: () => {}, keluar: () => {} })

export function PenyediaWarga({ children }) {
  const [warga, setWarga] = useState(null)
  const [siap, setSiap] = useState(false)

  const segarkan = useCallback(async () => {
    try {
      setWarga(await getData('/api/auth/saya'))
    } catch {
      setWarga(null)
    } finally {
      setSiap(true)
    }
  }, [])

  const keluar = useCallback(async () => {
    await kirim('/api/auth/keluar').catch(() => {})
    setWarga(null)
  }, [])

  useEffect(() => {
    segarkan()
  }, [segarkan])

  return <KonteksWarga.Provider value={{ warga, siap, segarkan, setWarga, keluar }}>{children}</KonteksWarga.Provider>
}

export function useWarga() {
  return useContext(KonteksWarga)
}
