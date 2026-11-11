import { useState } from 'react'
import { Link } from 'react-router'

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
  garis: 'border-[1.5px] border-tinta bg-white text-tinta hover:bg-beton',
}

export function Tombol({ varian = 'utama', href = '#', to, children, className = '', ...lain }) {
  const kelas = `inline-flex items-center justify-center rounded px-5 py-3 text-[15px] font-bold transition-colors ${GAYA_TOMBOL[varian]} ${className}`
  if (to) {
    return <Link to={to} className={kelas} {...lain}>{children}</Link>
  }
  return (
    <a href={href} className={kelas} {...lain}>
      {children}
    </a>
  )
}

const JALUR_IKON = {
  pengguna: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  cari: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  centang: <path d="m5 12 5 5 9-10" />,
  silang: <path d="M6 6l12 12M18 6 6 18" />,
  kembali: <path d="m15 18-6-6 6-6" />,
  kamera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  peringatan: <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17v.5" /></>,
  lonceng: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></>,
  database: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>,
  unduh: <><path d="M12 4v11m-5-5 5 5 5-5" /><path d="M5 20h14" /></>,
  daftar: <path d="M9 6h11M9 12h11M9 18h11M4 6h.5M4 12h.5M4 18h.5" />,
  surat: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lokasi: <><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
}

const GAYA_TANDA = {
  ok: ['bg-[#e3f1e7] text-hijau', 'centang'],
  gagal: ['bg-[#fbe3e1] text-[#b3261e]', 'silang'],
  waspada: ['bg-[#fff3cc] text-[#8a6500]', 'peringatan'],
}

export function TandaCek({ status, className = 'size-7' }) {
  const [warna, ikon] = GAYA_TANDA[status]
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${warna} ${className}`}>
      <Ikon nama={ikon} className="size-[57%]" />
    </span>
  )
}

export function BarisCek({ status, judul, children }) {
  return (
    <li className="flex items-start gap-3.5">
      <TandaCek status={status} />
      <div className="flex min-w-0 flex-col gap-0.5 leading-normal">
        <p className="text-[15px] font-bold">{judul}</p>
        <p className="text-sm text-redup">{children}</p>
      </div>
    </li>
  )
}

export function Isian({ label, id, className = '', ...lain }) {
  return (
    <label htmlFor={id} className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-semibold">{label}</span>
      <input
        id={id}
        className="w-full rounded border border-[#d9d2cc] bg-white px-3.5 py-3 text-[15px] outline-none placeholder:text-redup focus:border-tinta"
        {...lain}
      />
    </label>
  )
}

export function Langkah({ n, warna = 'garis', children }) {
  const gaya = {
    selesai: 'bg-hijau text-white',
    aktif: 'bg-oranye text-white',
    garis: 'border-[1.5px] border-[#d9d2cc] bg-white text-redup',
    nomor: 'border-2 border-oranye text-oranye',
  }[warna]
  return (
    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${gaya}`}>
      {warna === 'selesai' ? <Ikon nama="centang" className="size-4" /> : n}
      {children}
    </span>
  )
}

export function Ikon({ nama, className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      {JALUR_IKON[nama]}
    </svg>
  )
}

export function Centang({ checked, onChange, warna = 'tinta', className = 'items-center', children }) {
  const isi = warna === 'oranye' ? 'peer-checked:border-oranye peer-checked:bg-oranye' : 'peer-checked:border-tinta peer-checked:bg-tinta'
  return (
    <label className={`flex cursor-pointer gap-2.5 ${className}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`flex size-5 items-center justify-center rounded border-[1.5px] border-isian bg-white text-white peer-focus-visible:outline-3 peer-focus-visible:outline-kuning ${isi}`}>
        {checked && <Ikon nama="centang" className="size-3.5" />}
      </span>
      {children}
    </label>
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
