import { useState } from 'react'

export const WARNA_STATUS = { ok: 'bg-hijau', warn: 'bg-kuning', exp: 'bg-abu', lap: 'bg-oranye' }
const LABEL_STATUS = { ok: 'Masih garansi', warn: 'Hampir habis', exp: 'Garansi habis', lap: 'Laporan warga' }

export function StatusGaransi({ status, label, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-semibold text-tinta ${className}`}>
      <span className={`h-1.5 w-[22px] rounded-full ${WARNA_STATUS[status] ?? 'bg-isian'}`} />
      {label ?? LABEL_STATUS[status] ?? 'Garansi belum tercatat'}
    </span>
  )
}

export function Marka({ status, className = 'w-[22px]' }) {
  return <span className={`inline-block h-1.5 shrink-0 rounded-full ${WARNA_STATUS[status] ?? 'bg-isian'} ${className}`} />
}

const GAYA_TOMBOL = {
  utama: 'bg-oranye text-white hover:bg-[#a9380b]',
  merah: 'bg-merah text-white hover:bg-[#861313]',
  kuning: 'bg-kuning text-tinta hover:bg-[#dba300]',
}

export function Tombol({ varian = 'utama', href = '#', children, className = '' }) {
  return (
    <a href={href} className={`inline-flex items-center justify-center rounded px-5 py-3 text-[15px] font-bold transition-colors ${GAYA_TOMBOL[varian]} ${className}`}>
      {children}
    </a>
  )
}

export function Tag({ children = 'Data terbuka' }) {
  return (
    <span className="inline-block rounded-xs border border-dashed border-redup px-2 py-0.5 text-xs font-semibold text-redup">
      {children}
    </span>
  )
}

export function Foto({ src, alt, className = '', eager = false }) {
  const [gagal, setGagal] = useState(false)
  if (gagal || !src) {
    return (
      <div role="img" aria-label={alt} className={`flex items-center justify-center rounded bg-beton text-xs text-redup ${className}`}>
        {alt}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      onError={() => setGagal(true)}
      className={`rounded object-cover ${className}`}
    />
  )
}

export function Muat({ loading, error, onUlang, className = '' }) {
  if (loading) return <p className={`py-4 text-sm text-redup ${className}`}>Memuat…</p>
  if (!error) return null
  return (
    <p className={`py-4 text-sm text-redup ${className}`}>
      Gagal memuat data.{' '}
      <button type="button" onClick={onUlang} className="font-bold text-oranye underline">
        Coba lagi
      </button>
    </p>
  )
}

export function JudulSeksi({ children, className = '', terang = false }) {
  return (
    <h2 className={`font-judul text-3xl leading-[1.05] md:text-[42px] ${terang ? 'text-[#FFF4E8]' : 'text-merah'} ${className}`}>
      {children}
    </h2>
  )
}
