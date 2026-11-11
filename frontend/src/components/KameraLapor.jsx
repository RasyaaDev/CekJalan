import { useEffect, useRef, useState } from 'react'
import { Ikon } from './ui'
import { jam, tanggalPendek } from '../lib/format'

export default function KameraLapor({ ke, total, onAmbil, onTutup }) {
  const video = useRef(null)
  const [posisi, setPosisi] = useState(null)
  const [galat, setGalat] = useState(null)
  const [sekarang, setSekarang] = useState(() => new Date())

  useEffect(() => {
    let aliran = null
    let batal = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false })
      .then((s) => {
        if (batal) return s.getTracks().forEach((t) => t.stop())
        aliran = s
        if (video.current) video.current.srcObject = s
      })
      .catch(() => setGalat('Kamera tidak bisa dibuka. Izinkan akses kamera di browser, lalu coba lagi.'))

    if (!navigator.mediaDevices) setGalat('Browser ini tidak mendukung kamera langsung.')

    const pantau = navigator.geolocation?.watchPosition(
      (p) => setPosisi({ lat: p.coords.latitude, lng: p.coords.longitude, akurasi: Math.round(p.coords.accuracy) }),
      () => setGalat((g) => g ?? 'Izin lokasi ditolak. Lokasi wajib aktif supaya foto bisa dipakai.'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
    const jamJalan = setInterval(() => setSekarang(new Date()), 1000)

    return () => {
      batal = true
      aliran?.getTracks().forEach((t) => t.stop())
      if (pantau != null) navigator.geolocation.clearWatch(pantau)
      clearInterval(jamJalan)
    }
  }, [])

  function jepret() {
    const v = video.current
    if (!v?.videoWidth || !posisi) return
    const kanvas = document.createElement('canvas')
    kanvas.width = v.videoWidth
    kanvas.height = v.videoHeight
    kanvas.getContext('2d').drawImage(v, 0, 0)
    const pada = new Date().toISOString()
    kanvas.toBlob(
      (blob) => {
        const file = new File([blob], `cekjalan-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onAmbil({ file, kamera: { lat: posisi.lat, lng: posisi.lng, akurasi: posisi.akurasi, pada } })
      },
      'image/jpeg',
      0.9,
    )
  }

  const siap = Boolean(posisi) && !galat

  return (
    <div role="dialog" aria-modal="true" aria-label="Ambil foto kerusakan" className="fixed inset-0 z-[2000] flex flex-col bg-black text-white">
      <video ref={video} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[150px] bg-gradient-to-b from-black/65 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[330px] bg-gradient-to-b from-transparent to-black/75" />

      <div className="relative flex h-10 items-center justify-between px-4 pt-14 sm:pt-6">
        <button type="button" onClick={onTutup} aria-label="Tutup kamera" className="flex size-10 items-center justify-center">
          <Ikon nama="silang" className="size-6" />
        </button>
        <p className="text-[17px] font-bold">Foto kerusakan</p>
        <p className="w-10 text-right text-[13px] font-semibold text-[#e8dcd6]">{ke}/{total}</p>
      </div>

      <div className="relative mx-auto mt-[18vh] h-[220px] w-[300px] rounded-xl border-2 border-dashed border-white" />

      <div className="relative mt-auto flex flex-col items-center gap-3 px-6 pb-8">
        {galat ? (
          <p className="max-w-[320px] rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-[#b3261e]">{galat}</p>
        ) : (
          <>
            <p className="flex items-center gap-2 rounded-full bg-white py-2 pl-3 pr-3.5 text-[13px] font-bold text-tinta">
              <span className={`size-2.5 rounded-full ${posisi ? 'bg-hijau' : 'animate-pulse bg-kuning'}`} />
              {posisi ? `Lokasi aktif · akurasi ${posisi.akurasi} m` : 'Mencari lokasi…'}
            </p>
            <p className="text-xs font-semibold">
              {posisi ? `${posisi.lat.toFixed(5).replace('.', ',')}; ${posisi.lng.toFixed(5).replace('.', ',')} · ` : ''}
              {tanggalPendek(sekarang)}, {jam(sekarang)}
            </p>
          </>
        )}
        <button
          type="button"
          onClick={jepret}
          disabled={!siap}
          aria-label="Ambil foto"
          className="mt-4 size-[76px] rounded-full border-[6px] border-white/60 bg-white bg-clip-padding disabled:opacity-40"
        />
        <p className="max-w-[300px] text-center text-[13px] text-[#f0e6e1]">
          Ambil foto langsung di lokasi. Foto dari galeri tidak bisa dipakai kalau tidak menyimpan lokasi.
        </p>
      </div>
    </div>
  )
}
