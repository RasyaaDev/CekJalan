import { useEffect, useRef, useState } from 'react'
import { Ikon } from './ui'

export function LayoutAkun({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-72px)]">
      <div className="relative hidden w-[620px] shrink-0 flex-col justify-end gap-5 overflow-hidden py-16 pl-20 pr-16 lg:flex">
        <img src="/foto/masuk.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(43,23,20,0.15)] to-[rgba(43,23,20,0.92)]" />
        <p className="relative font-judul text-[40px] leading-[1.15] text-white">Simpan laporanmu, pantau jalan langgananmu</p>
        {[
          ['daftar', 'Semua laporanmu tersimpan di satu tempat'],
          ['lonceng', 'Pengingat garansi untuk jalan yang kamu pantau'],
          ['centang', 'Isi formulir lapor lebih cepat'],
        ].map(([ikon, teks]) => (
          <p key={teks} className="relative flex items-center gap-3 text-base font-medium text-white">
            <Ikon nama={ikon} className="size-5 text-kuning" />
            {teks}
          </p>
        ))}
      </div>
      <div className="flex flex-1 items-center justify-center bg-[#faf8f6] px-4 py-12">
        <div className="flex w-full max-w-[480px] flex-col gap-[18px] rounded-md border border-[#d9d2cc] bg-white px-6 py-9 sm:px-10">{children}</div>
      </div>
    </div>
  )
}

export function Pemisah() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[#d9d2cc]" />
      <span className="text-[13px] text-redup">atau</span>
      <span className="h-px flex-1 bg-[#d9d2cc]" />
    </div>
  )
}

export function TombolGoogle({ children }) {
  return (
    <a href="/api/auth/google" className="flex items-center justify-center rounded border-[1.5px] border-tinta bg-white px-5 py-3 text-base font-bold hover:bg-beton">
      {children}
    </a>
  )
}

export function IsianOtp({ nilai, onChange }) {
  const kotak = useRef([])
  const angka = nilai.padEnd(6, ' ').split('')

  function isi(i, karakter) {
    const baru = angka.slice()
    baru[i] = karakter || ' '
    onChange(baru.join('').trimEnd())
  }

  return (
    <div className="flex gap-2.5" role="group" aria-label="Kode OTP 6 angka">
      {angka.map((a, i) => (
        <input
          key={i}
          ref={(el) => (kotak.current[i] = el)}
          value={a.trim()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Angka ke-${i + 1}`}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(-1)
            isi(i, d)
            if (d && i < 5) kotak.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !a.trim() && i > 0) kotak.current[i - 1]?.focus()
          }}
          onPaste={(e) => {
            const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
            if (!d) return
            e.preventDefault()
            onChange(d)
            kotak.current[Math.min(d.length, 5)]?.focus()
          }}
          className="h-14 min-w-0 flex-1 rounded border border-[#d9d2cc] bg-white text-center text-[22px] font-bold outline-none focus:border-2 focus:border-oranye"
        />
      ))}
    </div>
  )
}

export function useHitungMundur() {
  const [sisa, setSisa] = useState(0)
  useEffect(() => {
    if (sisa <= 0) return
    const jeda = setTimeout(() => setSisa((s) => s - 1), 1000)
    return () => clearTimeout(jeda)
  }, [sisa])
  return [sisa, setSisa]
}

export function teksMundur(detik) {
  return `${Math.floor(detik / 60)}.${String(detik % 60).padStart(2, '0')}`
}
