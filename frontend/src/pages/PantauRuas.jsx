import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import PetaPilih from '../components/PetaPilih'
import { Centang, Ikon, Muat, StatusGaransi } from '../components/ui'
import { getData, kirim, useData } from '../lib/api'
import { useWarga } from '../lib/auth'
import { tanggal, tanggalPendek } from '../lib/format'

const RADIUS = [
  [500, '500 m'],
  [1000, '1 km'],
  [2000, '2 km'],
]
const KABAR = [
  ['hari30', 'Garansi tinggal 30 hari', 'Waktu yang cukup untuk melapor sebelum tanggung jawab kontraktor berakhir.', true],
  ['hari7', 'Garansi tinggal 7 hari', 'Pengingat terakhir untuk ruas yang kamu pantau.', true],
  ['selesai', 'Laporan di ruas ini selesai', 'Supaya kamu bisa ikut mengecek hasil perbaikannya.', true],
  ['proyekBaru', 'Ada proyek baru di ruas ini', 'Kabar saat kontrak baru tercatat di LPSE.', false],
]

function keteranganAkhir(p) {
  if (!p.akhir_garansi) return 'Masa pemeliharaan belum tercatat'
  if (p.garansi === 'exp') return `Berakhir ${tanggalPendek(p.akhir_garansi)}`
  if (p.garansi === 'warn') return `Berakhir ${tanggalPendek(p.akhir_garansi)} · ${p.sisa_hari} hari lagi`
  return `Berakhir ${tanggalPendek(p.akhir_garansi)}`
}

export default function PantauRuas() {
  const { slug } = useParams()
  const { warga } = useWarga()
  const [titik, setTitik] = useState(null)
  const [kata, setKata] = useState('')
  const [radius, setRadius] = useState(1000)
  const [pilihan, setPilihan] = useState(null)
  const [kabar, setKabar] = useState(Object.fromEntries(KABAR.map(([k, , , awal]) => [k, awal])))
  const [email, setEmail] = useState('')
  const [simpan, setSimpan] = useState({ jalan: false, galat: null, hasil: null })
  const [cari, setCari] = useState({ jalan: false, galat: null })

  useEffect(() => {
    if (slug) {
      getData(`/api/proyek/${encodeURIComponent(slug)}`)
        .then((p) => {
          if (p.lat != null) setTitik([p.lat, p.lng])
          setKata(p.ruas)
        })
        .catch(() => {})
      return
    }
    navigator.geolocation?.getCurrentPosition(
      (p) => setTitik((t) => t ?? [p.coords.latitude, p.coords.longitude]),
      () => {},
      { timeout: 10_000 },
    )
  }, [slug])

  const sekitar = useData(titik ? `/api/proyek/sekitar?lat=${titik[0]}&lng=${titik[1]}&radius=${radius}&limit=30` : null)
  const proyek = sekitar.data ?? []

  useEffect(() => {
    if (sekitar.data) setPilihan(new Set(sekitar.data.filter((p) => p.garansi === 'ok' || p.garansi === 'warn').map((p) => p.slug)))
  }, [sekitar.data])

  async function cariLokasi(e) {
    e.preventDefault()
    if (!kata.trim()) return
    setCari({ jalan: true, galat: null })
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.search = new URLSearchParams({
        q: `${kata.trim()}, Sidoarjo`,
        format: 'jsonv2',
        limit: '1',
        countrycodes: 'id',
        viewbox: '112.55,-7.30,112.90,-7.60',
        bounded: '1',
        'accept-language': 'id',
      })
      const [hasil] = await fetch(url).then((r) => r.json())
      if (!hasil) throw new Error('Lokasi tidak ditemukan di Sidoarjo.')
      setTitik([Number(hasil.lat), Number(hasil.lon)])
      setCari({ jalan: false, galat: null })
    } catch (galat) {
      setCari({ jalan: false, galat: galat.message })
    }
  }

  async function simpanPengingat(e) {
    e.preventDefault()
    setSimpan({ jalan: true, galat: null, hasil: null })
    try {
      const hasil = await kirim('/api/pantau', {
        body: {
          email: warga ? undefined : email.trim(),
          proyek: [...(pilihan ?? [])],
          lat: titik?.[0],
          lng: titik?.[1],
          radius_m: radius,
          kabar,
        },
      })
      setSimpan({ jalan: false, galat: null, hasil })
    } catch (galat) {
      setSimpan({ jalan: false, galat: galat.message, hasil: null })
    }
  }

  const contoh = proyek.find((p) => pilihan?.has(p.slug) && p.akhir_garansi) ?? proyek[0]
  const bisaSimpan = pilihan?.size > 0 && (warga || email) && !simpan.jalan

  return (
    <div className="mx-auto flex max-w-konten flex-col gap-8 px-4 pb-24 pt-12">
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm font-bold text-oranye">
          <Ikon nama="lonceng" className="size-[18px]" />
          Pengingat garansi
        </p>
        <h1 className="font-judul text-[34px] leading-[1.15] text-merah md:text-[40px]">Pantau jalan yang sering kamu lewati</h1>
        <p className="max-w-[780px] text-[17px] leading-normal text-redup">
          Pilih ruas jalan di sekitarmu. CekJalan mengirim kabar lewat email sebelum masa garansinya habis, supaya kerusakan sempat dilaporkan dan diperbaiki dengan biaya kontraktor.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="flex min-w-0 flex-col gap-5">
          <form onSubmit={cariLokasi} className="flex items-center gap-2.5 rounded border border-[#d9d2cc] bg-white px-4 py-3.5 focus-within:outline-3 focus-within:outline-kuning">
            <Ikon nama="cari" className="size-[18px] text-redup" />
            <label className="sr-only" htmlFor="cari-lokasi">Cari jalan atau kelurahan</label>
            <input
              id="cari-lokasi"
              value={kata}
              onChange={(e) => setKata(e.target.value)}
              placeholder="Cari jalan atau kelurahan di Sidoarjo"
              className="min-w-0 flex-1 text-[15px] outline-none placeholder:text-redup"
            />
            <label className="relative shrink-0">
              <span className="sr-only">Radius</span>
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="appearance-none bg-transparent pr-6 text-sm font-semibold text-redup">
                {RADIUS.map(([n, l]) => <option key={n} value={n}>Radius {l}</option>)}
              </select>
              <Ikon nama="chevron" className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-redup" />
            </label>
          </form>
          {cari.galat && <p className="-mt-3 text-sm text-[#b3261e]">{cari.galat}</p>}

          <div className="relative overflow-hidden rounded-md border border-[#d9d2cc]">
            <PetaPilih
              titik={titik}
              onPilih={setTitik}
              radius={radius}
              proyek={proyek}
              label="Titik pantauanmu"
              className="h-[400px] w-full"
            />
            {!titik && (
              <p className="absolute inset-x-4 top-4 z-[500] rounded bg-white px-3 py-2 text-sm font-semibold shadow">
                Ketuk peta atau cari jalan untuk menaruh titik pantauan.
              </p>
            )}
          </div>

          <section className="rounded-md border border-[#d9d2cc] bg-white px-6 pb-1 pt-3">
            <p className="pb-3 text-base font-bold">
              {titik ? `${proyek.length} ruas proyek dalam radius ${RADIUS.find(([n]) => n === radius)[1]}` : 'Belum ada titik pantauan'}
            </p>
            <Muat loading={sekitar.loading} error={sekitar.error} onUlang={sekitar.ulang} />
            {titik && sekitar.data?.length === 0 && (
              <p className="border-t border-[#d9d2cc] py-4 text-sm text-redup">Belum ada proyek jalan kabupaten di sekitar titik ini. Coba perbesar radiusnya.</p>
            )}
            <ul>
              {proyek.map((p) => (
                <li key={p.slug} className="border-t border-[#d9d2cc] py-4">
                  <Centang
                    warna="oranye"
                    checked={pilihan?.has(p.slug) ?? false}
                    onChange={(nyala) =>
                      setPilihan((lama) => {
                        const baru = new Set(lama)
                        nyala ? baru.add(p.slug) : baru.delete(p.slug)
                        return baru
                      })
                    }
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-normal">
                      <span className="truncate text-[15px] font-bold">{p.ruas}</span>
                      <span className="truncate text-[13px] text-redup">
                        {[p.tahun_anggaran && `Paket ${p.tahun_anggaran}`, p.pelaksana].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusGaransi status={p.garansi} />
                      <span className="text-[13px] text-redup">{keteranganAkhir(p)}</span>
                    </span>
                  </Centang>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <form onSubmit={simpanPengingat} className="flex flex-col gap-[18px] rounded-md border border-[#d9d2cc] bg-white p-7">
            <h2 className="font-judul text-[26px] leading-tight">Atur pengingat</h2>
            {warga ? (
              <p className="text-[15px]">Kabar dikirim ke <strong>{warga.email}</strong>.</p>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold">Email</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@gmail.com" className="rounded border border-[#d9d2cc] bg-white px-3.5 py-3 text-[15px] outline-none placeholder:text-redup focus:border-tinta" />
              </label>
            )}
            <fieldset className="flex flex-col gap-[18px]">
              <legend className="mb-[18px] text-[13px] font-semibold">Kirim kabar saat</legend>
              {KABAR.map(([k, judul, isi]) => (
                <Centang key={k} warna="oranye" className="items-start" checked={kabar[k]} onChange={(nyala) => setKabar((lama) => ({ ...lama, [k]: nyala }))}>
                  <span className="flex flex-col gap-0.5 leading-normal">
                    <span className="text-[15px] font-semibold">{judul}</span>
                    <span className="text-[13px] text-redup">{isi}</span>
                  </span>
                </Centang>
              ))}
            </fieldset>
            {simpan.galat && <p role="alert" className="text-sm text-[#b3261e]">{simpan.galat}</p>}
            {simpan.hasil ? (
              <p role="status" className="rounded bg-[#e3f1e7] px-4 py-3 text-sm font-semibold text-hijau">
                Pengingat tersimpan untuk {simpan.hasil.ruas} ruas. Cek email konfirmasinya.
              </p>
            ) : (
              <button type="submit" disabled={!bisaSimpan} className="rounded bg-oranye px-5 py-3 text-base font-bold text-white hover:bg-[#a9380b] disabled:opacity-50">
                {simpan.jalan ? 'Menyimpan…' : 'Simpan pengingat'}
              </button>
            )}
            <p className="text-[13px] leading-normal text-redup">Berhenti kapan saja lewat tautan di setiap email.</p>
          </form>

          <div className="flex flex-col gap-3 rounded-md bg-beton p-5 leading-normal">
            <p className="text-[13px] font-semibold text-redup">Pratinjau email yang kamu terima</p>
            <div className="flex flex-col gap-1.5 rounded-[10px] bg-white px-4 pb-2.5 pt-3.5">
              <p className="text-sm">
                {contoh
                  ? `CekJalan: Garansi perbaikan ${contoh.ruas}${contoh.pelaksana ? ` (${contoh.pelaksana})` : ''} habis ${contoh.akhir_garansi ? tanggal(contoh.akhir_garansi) : 'segera'}. Ada lubang atau retak baru? Laporkan sekarang supaya diperbaiki tanpa biaya tambahan.`
                  : 'CekJalan: Garansi perbaikan ruas yang kamu pantau habis 30 hari lagi. Ada lubang atau retak baru? Laporkan sekarang supaya diperbaiki tanpa biaya tambahan.'}
              </p>
              <p className="text-[11px] text-redup">07.00</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
