import { useCallback, useEffect, useState } from 'react'

export async function getData(path, signal) {
  const res = await fetch(path, { signal })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
  return body?.data
}

export async function kirim(path, { method = 'POST', body } = {}) {
  const form = body instanceof FormData
  const res = await fetch(path, {
    method,
    headers: form || body === undefined ? undefined : { 'content-type': 'application/json' },
    body: form ? body : body === undefined ? undefined : JSON.stringify(body),
  })
  const isi = await res.json().catch(() => null)
  if (!res.ok) {
    const galat = new Error(isi?.error?.message ?? `HTTP ${res.status}`)
    galat.kode = isi?.error?.code
    galat.cek = isi?.error?.cek
    galat.status = res.status
    throw galat
  }
  return isi?.data
}

export function useData(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [ulangKe, setUlangKe] = useState(0)

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, loading: false })
      return
    }
    const kontrol = new AbortController()
    setState({ data: null, error: null, loading: true })

    getData(path, kontrol.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, loading: false })
      })

    return () => kontrol.abort()
  }, [path, ulangKe])

  const ulang = useCallback(() => setUlangKe((n) => n + 1), [])

  return { ...state, ulang }
}
