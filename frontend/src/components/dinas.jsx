import { Ikon } from './ui'

export const LABEL_STATUS_DINAS = {
  masuk: 'Masuk',
  perlu_foto_ulang: 'Perlu foto ulang',
  ditolak: 'Ditolak',
  diverifikasi: 'Diverifikasi',
  diteruskan: 'Diteruskan',
  dikerjakan: 'Dikerjakan',
  selesai: 'Selesai',
}

export function labelStatus(l) {
  if (l.status === 'dikerjakan' && l.foto_sesudah_url) return 'Menunggu persetujuan'
  if (l.status === 'dikerjakan' && l.buka_lagi_count > 0) return 'Ditolak warga'
  return LABEL_STATUS_DINAS[l.status] ?? l.status
}

export function sisaTenggat(l) {
  if (l.status === 'selesai') return { teks: 'Selesai', telat: false }
  if (l.status === 'ditolak' || !l.tenggat_pada) return { teks: '', telat: false }
  const hari = Math.ceil((new Date(l.tenggat_pada).getTime() - Date.now()) / 86_400_000)
  if (hari < 0) return { teks: `Lewat ${-hari} hari`, telat: true }
  if (hari === 0) return { teks: 'Tenggat hari ini', telat: false }
  return { teks: `${hari} hari lagi`, telat: false }
}

export function JudulDinas({ children, sub }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h1 className="font-judul text-[32px] leading-tight text-navy md:text-[34px]">{children}</h1>
      {sub && <p className="text-sm text-redup">{sub}</p>}
    </div>
  )
}

export function Kartu({ judul, className = '', children }) {
  return (
    <section className={`flex flex-col gap-4 rounded-md border border-garis-dinas bg-white p-5 ${className}`}>
      {judul && <h2 className="font-judul text-lg leading-tight text-tinta">{judul}</h2>}
      {children}
    </section>
  )
}

export function BarisAngka({ isi }) {
  return (
    <dl className="grid grid-cols-2 border-garis-dinas md:grid-cols-4">
      {isi.map(([angka, label, warna = 'text-tinta'], i) => (
        <div key={label} className={`flex flex-col gap-1 py-2 md:px-6 md:first:pl-0 ${i ? 'md:border-l md:border-garis-dinas' : ''}`}>
          <dd className={`font-judul text-[40px] leading-none ${warna}`}>{angka ?? '–'}</dd>
          <dt className="text-[13px] text-redup">{label}</dt>
        </div>
      ))}
    </dl>
  )
}

export function Tab({ pilihan, aktif, onPilih }) {
  return (
    <div role="tablist" className="flex gap-7 overflow-x-auto border-b border-garis-dinas">
      {pilihan.map(([kunci, label]) => (
        <button
          key={kunci}
          type="button"
          role="tab"
          aria-selected={aktif === kunci}
          onClick={() => onPilih(kunci)}
          className={`shrink-0 border-b-[3px] pb-2.5 text-sm font-semibold ${aktif === kunci ? 'border-merah text-merah' : 'border-transparent text-redup hover:text-tinta'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Pilih({ value, onChange, children, label }) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded border border-garis-dinas bg-white py-2.5 pl-3.5 pr-9 text-sm font-semibold"
      >
        {children}
      </select>
      <Ikon nama="chevron" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
    </label>
  )
}

export function Sakelar({ checked, onChange, label, sub, disabled }) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        {sub && <span className="text-xs text-redup">{sub}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-isian transition-colors peer-checked:bg-hijau peer-focus-visible:outline-3 peer-focus-visible:outline-kuning after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  )
}

export function Daftar({ isi }) {
  return (
    <dl className="flex flex-col">
      {isi.map(([a, b]) => (
        <div key={a} className="grid grid-cols-[110px_1fr] gap-3 border-t border-garis-dinas py-3 text-[13px]">
          <dt className="text-redup">{a}</dt>
          <dd className="font-semibold">{b}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Lencana({ warna = 'kuning', children }) {
  const gaya = {
    kuning: 'bg-[#fff3cc] [&>span]:bg-kuning',
    oranye: 'bg-[#fde6dc] [&>span]:bg-oranye',
    hijau: 'bg-[#e3f1e7] [&>span]:bg-hijau',
    merah: 'bg-[#fbe3e1] [&>span]:bg-merah',
    abu: 'bg-beton [&>span]:bg-abu',
  }[warna]
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold ${gaya}`}>
      <span className="size-1.5 rounded-full" />
      {children}
    </span>
  )
}

export const gayaTombol = {
  utama: 'rounded bg-oranye px-5 py-3 text-sm font-bold text-white hover:bg-[#a9380b] disabled:opacity-50',
  merah: 'rounded bg-merah px-5 py-3 text-sm font-bold text-white hover:bg-[#861313] disabled:opacity-50',
  garis: 'rounded border-[1.5px] border-tinta bg-white px-5 py-3 text-sm font-bold text-tinta hover:bg-beton disabled:opacity-50',
}

export function Galat({ children }) {
  if (!children) return null
  return <p role="alert" className="text-sm text-[#b3261e]">{children}</p>
}
