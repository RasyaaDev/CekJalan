import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Navigate, useLocation } from 'react-router'
import KameraLapor from '../components/KameraLapor'
import PapanProyek from '../components/PapanProyek'
import PetaPilih from '../components/PetaPilih'
import { BarisCek, Ikon, Muat, Tombol } from '../components/ui'
import { getData, kirim, useData } from '../lib/api'
import { useWarga } from '../lib/auth'
import { waktuFoto } from '../lib/format'

const MAKS_FOTO = 3
const JENIS = [
  ['lubang', 'Lubang'],
  ['retak', 'Retak'],
  ['ambles', 'Ambles'],
  ['bergelombang', 'Bergelombang'],
  ['genangan', 'Genangan'],
  ['lainnya', 'Lainnya'],
]
const KEPARAHAN = [
  ['ringan', 'Masih bisa dilewati', 'Perlu hati-hati, tapi tidak berbahaya.'],
  ['bahaya', 'Berbahaya untuk motor', 'Bisa bikin pengendara jatuh, apalagi malam hari.'],
  ['putus', 'Tidak bisa dilewati', 'Kendaraan harus memutar.'],
]

function Bagian({ n, judul, sub, children, id }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex items-start gap-3.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-tinta text-[15px] font-extrabold text-white">{n}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-xl font-bold">{judul}</h2>
          {sub && <p className="text-sm leading-normal text-redup">{sub}</p>}
        </div>
      </div>
      <div className="sm:pl-[46px]">{children}</div>
    </section>
  )
}

function ukuran(byte) {
  return `${(byte / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

function KartuFoto({ foto, onHapus, onKamera, onUbahTitik }) {
  const gagal = foto.hasil?.cek.find((c) => !c.lolos)
  return (
    <div className="flex flex-col gap-4 rounded-md border border-[#d9d2cc] bg-white p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <img src={foto.url} alt="Foto kerusakan yang dipilih" className="h-[120px] w-[160px] shrink-0 rounded object-cover" />
        <div className="flex min-w-0 flex-col gap-0.5 leading-normal">
          <p className="truncate text-[15px] font-bold">{foto.file.name}</p>
          <p className="text-[13px] text-redup">
            {foto.kamera ? 'Diambil lewat kamera' : 'Dipilih dari galeri'} · {ukuran(foto.file.size)}
          </p>
          <button type="button" onClick={onHapus} className="self-start text-[13px] font-semibold text-oranye hover:underline">
            Hapus foto
          </button>
        </div>
      </div>

      {foto.memeriksa && <p className="text-sm text-redup">Memeriksa foto…</p>}
      {foto.galat && (
        <p className="text-sm text-[#b3261e]">
          {foto.galat}{' '}
          <button type="button" onClick={foto.ulang} className="font-bold underline">Coba lagi</button>
        </p>
      )}

      {foto.hasil &&
        (foto.hasil.lolos ? (
          <div className="flex items-center gap-3 rounded-lg bg-[#e3f1e7] p-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hijau text-white">
              <Ikon nama="centang" className="size-[18px]" />
            </span>
            <div className="leading-normal">
              <p className="text-base font-bold text-hijau">Foto lolos pengecekan</p>
              <p className="text-[13px]">Laporanmu bisa langsung diproses.</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3.5 rounded-md border border-[#e8b4b0] bg-[#fdf0ef] p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fbe3e1] text-[#b3261e]">
              <Ikon nama="silang" className="size-[18px]" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-base font-bold text-[#b3261e]">
                {gagal.kode === 'lokasi' ? 'Lokasi foto tidak cocok' : 'Foto belum lolos pengecekan'}
              </p>
              <p className="text-sm leading-normal">
                {gagal.detail} Ambil foto langsung di lokasi supaya laporan bisa diproses.
              </p>
              <div className="flex flex-wrap gap-3 pt-1.5">
                <button type="button" onClick={onKamera} className="rounded bg-oranye px-5 py-3 text-base font-bold text-white hover:bg-[#a9380b]">
                  Ambil foto di lokasi
                </button>
                {gagal.kode === 'lokasi' && (
                  <button type="button" onClick={onUbahTitik} className="rounded border-[1.5px] border-tinta bg-white px-5 py-3 text-base font-bold hover:bg-beton">
                    Ubah titik lokasi
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

      {foto.hasil && (
        <div className="flex flex-col gap-4 border-t border-[#d9d2cc] pt-4">
          <p className="font-judul text-[22px] leading-tight">Hasil cek foto</p>
          <ul className="flex flex-col gap-4">
            {foto.hasil.cek.map((c) => (
              <BarisCek key={c.kode} status={c.lolos ? 'ok' : 'gagal'} judul={c.judul}>
                {c.kode === 'waktu' && c.lolos ? `${waktuFoto(c.diambil_pada)}. ${c.detail}` : c.detail}
              </BarisCek>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PanelRuas({ titik }) {
  const sekitar = useData(titik ? `/api/proyek/sekitar?lat=${titik[0]}&lng=${titik[1]}&radius=300&limit=1` : null)
  const proyek = sekitar.data?.[0]
  const ditanggung = proyek?.garansi === 'ok' || proyek?.garansi === 'warn'

  let judul = 'Pilih titik kerusakan'
  let isi = 'Geser pin di peta ke titik kerusakan. CekJalan langsung mencocokkannya dengan kontrak jalan terdekat.'
  if (titik && sekitar.data && !proyek) {
    judul = 'Ruas belum tercatat'
    isi = 'Belum ada kontrak jalan kabupaten di sekitar titik ini. Laporanmu tetap diteruskan ke Dinas PU Bina Marga.'
  } else if (proyek && ditanggung) {
    judul = 'Ruas ini masih garansi'
    isi = 'Laporanmu akan diteruskan ke pelaksana proyek. Perbaikannya jadi tanggungan kontraktor, bukan anggaran baru.'
  } else if (proyek) {
    judul = 'Garansi ruas ini sudah habis'
    isi = 'Laporanmu diteruskan ke Dinas PU Bina Marga dan diperbaiki dengan anggaran pemeliharaan.'
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-judul text-[28px] leading-tight text-merah">{judul}</h2>
      <p className="text-base leading-normal text-redup">{isi}</p>
      <Muat loading={sekitar.loading} error={sekitar.error} onUlang={sekitar.ulang} />
      {proyek && (
        <>
          <PapanProyek proyek={proyek} />
          <dl className="text-sm">
            {[
              ['Diteruskan ke', ditanggung ? proyek.pelaksana ?? 'Kontraktor pelaksana' : 'Dinas PU Bina Marga'],
              ['Tenggat perbaikan', '14 hari setelah diverifikasi'],
              ['Diawasi oleh', 'Dinas PU Bina Marga Kab. Sidoarjo'],
            ].map(([a, b]) => (
              <div key={a} className="flex justify-between gap-4 border-b border-garis py-3">
                <dt className="text-redup">{a}</dt>
                <dd className="text-right font-semibold">{b}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  )
}

export default function LaporKerusakan() {
  const { warga, siap } = useWarga()
  const { search } = useLocation()
  if (!siap) return <p className="mx-auto max-w-konten px-4 py-20 text-sm text-redup">Memuat…</p>
  if (!warga) return <Navigate to={`/masuk?lanjut=${encodeURIComponent('/lapor' + search)}`} replace />
  return <FormLapor />
}

function FormLapor() {
  const navigate = useNavigate()
  const [param] = useSearchParams()
  const { warga } = useWarga()
  const masukanFoto = useRef(null)
  const urutanCek = useRef({})
  const fotoTerkini = useRef([])

  const [titik, setTitik] = useState(null)
  const [alamat, setAlamat] = useState('')
  const [gps, setGps] = useState({ status: null, pesan: null })
  const [foto, setFoto] = useState([])
  const [kameraBuka, setKameraBuka] = useState(false)
  const [jenis, setJenis] = useState('')
  const [keparahan, setKeparahan] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [kirimState, setKirimState] = useState({ mengirim: false, galat: null })

  useEffect(() => {
    const slug = param.get('proyek')
    if (slug) {
      getData(`/api/proyek/${encodeURIComponent(slug)}`)
        .then((p) => p.lat != null && setTitik([p.lat, p.lng]))
        .catch(() => {})
      return
    }
    cariGps(false)
  }, [param])

  function cariGps(timpa = true) {
    if (!navigator.geolocation) return setGps({ status: 'galat', pesan: 'Browser ini tidak mendukung GPS. Ketuk peta untuk memilih titik.' })
    setGps({ status: 'mencari', pesan: 'Mencari lokasimu…' })
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setTitik((t) => (timpa || !t ? [p.coords.latitude, p.coords.longitude] : t))
        setGps({ status: 'ok', pesan: null })
      },
      (e) =>
        setGps({
          status: 'galat',
          pesan:
            e.code === 1
              ? 'Izin lokasi ditolak. Izinkan lokasi di pengaturan browser, lalu tekan "Pakai lokasi saya".'
              : 'GPS belum dapat sinyal. Coba lagi di tempat terbuka, atau ketuk peta.',
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }

  useEffect(() => {
    if (!titik) return
    const kontrol = new AbortController()
    const jeda = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=id&lat=${titik[0]}&lon=${titik[1]}`,
        { signal: kontrol.signal },
      )
        .then((r) => r.json())
        .then((d) => setAlamat(d.display_name?.split(', ').slice(0, 4).join(', ') ?? ''))
        .catch(() => {})
    }, 600)
    return () => {
      clearTimeout(jeda)
      kontrol.abort()
    }
  }, [titik])

  fotoTerkini.current = foto
  useEffect(() => () => fotoTerkini.current.forEach((f) => URL.revokeObjectURL(f.url)), [])

  const titikKunci = titik?.join(',')
  useEffect(() => {
    foto.forEach((f) => periksa(f.id))
  }, [titikKunci])

  function ubahFoto(id, ubah) {
    setFoto((daftar) => daftar.map((f) => (f.id === id ? { ...f, ...ubah } : f)))
  }

  async function periksa(id, sumber) {
    const f = sumber ?? foto.find((x) => x.id === id)
    if (!f) return
    const nomor = (urutanCek.current[id] ?? 0) + 1
    urutanCek.current[id] = nomor
    const masihTerbaru = () => urutanCek.current[id] === nomor
    ubahFoto(id, { memeriksa: true, galat: null })
    const data = new FormData()
    data.append('foto', f.file)
    if (f.kamera) data.append('kamera', JSON.stringify([f.kamera]))
    if (titik) {
      data.append('lat', titik[0])
      data.append('lng', titik[1])
    }
    try {
      const hasil = await kirim('/api/laporan/cek-foto', { body: data })
      if (masihTerbaru()) ubahFoto(id, { hasil, memeriksa: false })
    } catch (e) {
      if (masihTerbaru()) ubahFoto(id, { galat: e.message, memeriksa: false })
    }
  }

  function tambah(file, kamera = null) {
    if (foto.length >= MAKS_FOTO) return
    const baru = { id: crypto.randomUUID(), file, kamera, url: URL.createObjectURL(file), hasil: null }
    baru.ulang = () => periksa(baru.id, baru)
    setFoto((daftar) => [...daftar, baru])
    periksa(baru.id, baru)
  }

  function hapus(id) {
    const target = foto.find((f) => f.id === id)
    if (target) URL.revokeObjectURL(target.url)
    delete urutanCek.current[id]
    setFoto((daftar) => daftar.filter((f) => f.id !== id))
  }

  const semuaLolos = foto.length > 0 && foto.every((f) => f.hasil?.lolos)
  const bisaKirim = semuaLolos && titik && jenis && keparahan && !kirimState.mengirim

  async function kirimLaporan(e) {
    e.preventDefault()
    if (!bisaKirim) return
    setKirimState({ mengirim: true, galat: null })
    const data = new FormData()
    foto.forEach((f) => data.append('foto', f.file))
    data.append('kamera', JSON.stringify(foto.map((f) => f.kamera)))
    data.append('lat', titik[0])
    data.append('lng', titik[1])
    data.append('jenis', jenis)
    data.append('keparahan', keparahan)
    if (keterangan.trim()) data.append('keterangan', keterangan.trim())
    try {
      const laporan = await kirim('/api/laporan', { body: data })
      navigate(`/lapor/terkirim/${laporan.kode}`, { state: { laporan } })
    } catch (galat) {
      setKirimState({ mengirim: false, galat })
    }
  }

  const geserKePeta = () => document.getElementById('langkah-lokasi')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <div className="mx-auto flex max-w-konten flex-col gap-2.5 px-4 pb-2 pt-10">
        <h1 className="font-judul text-[36px] leading-tight text-merah md:text-5xl">Lapor kerusakan jalan</h1>
        <p className="max-w-[760px] text-lg leading-normal text-redup">
          Butuh sekitar dua menit. Laporanmu langsung dicocokkan dengan proyek dan masa pemeliharaannya.
        </p>
      </div>

      <form onSubmit={kirimLaporan} className="mx-auto grid max-w-konten gap-16 px-4 pb-24 pt-8 lg:grid-cols-[1fr_440px]">
        <div className="flex min-w-0 flex-col gap-10">
          <Bagian n="1" judul="Foto kerusakan" sub="Maksimal 3 foto. Ambil dari dekat dan dari jauh supaya ruasnya kelihatan.">
            <div className="flex flex-col gap-4">
              {foto.map((f) => (
                <KartuFoto
                  key={f.id}
                  foto={f}
                  onHapus={() => hapus(f.id)}
                  onKamera={() => {
                    hapus(f.id)
                    setKameraBuka(true)
                  }}
                  onUbahTitik={geserKePeta}
                />
              ))}
              {foto.length < MAKS_FOTO && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setKameraBuka(true)}
                    className="flex h-[135px] w-[180px] flex-col items-center justify-center gap-2 rounded border border-dashed border-redup text-sm font-semibold text-redup hover:bg-beton"
                  >
                    <Ikon nama="kamera" className="size-7" />
                    Ambil foto
                  </button>
                  <button
                    type="button"
                    onClick={() => masukanFoto.current?.click()}
                    className="flex h-[135px] w-[180px] flex-col items-center justify-center gap-2 rounded border border-dashed border-redup text-sm font-semibold text-redup hover:bg-beton"
                  >
                    <Ikon nama="unduh" className="size-7 rotate-180" />
                    Pilih dari galeri
                  </button>
                  <input
                    ref={masukanFoto}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) tambah(file)
                      e.target.value = ''
                    }}
                  />
                </div>
              )}
            </div>
          </Bagian>

          <Bagian id="langkah-lokasi" n="2" judul="Lokasi" sub="Diambil dari GPS ponselmu. Geser pin atau ketuk peta kalau kurang pas.">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => cariGps()}
                  disabled={gps.status === 'mencari'}
                  className="inline-flex items-center gap-2 rounded border-[1.5px] border-tinta bg-white px-4 py-2.5 text-sm font-bold hover:bg-beton disabled:opacity-50"
                >
                  <Ikon nama="lokasi" className="size-4" />
                  {gps.status === 'mencari' ? 'Mencari…' : 'Pakai lokasi saya'}
                </button>
                {gps.pesan && (
                  <span role="status" className={`text-sm ${gps.status === 'galat' ? 'text-[#b3261e]' : gps.status === 'ok' ? 'text-hijau' : 'text-redup'}`}>
                    {gps.pesan}
                  </span>
                )}
              </div>
              <PetaPilih titik={titik} onPilih={setTitik} label="Titik kerusakan" className="h-[300px] w-full rounded" />
              <label className="flex flex-col gap-2">
                <span className="text-[15px] font-bold">Alamat terdeteksi</span>
                <input
                  value={titik ? alamat || 'Mencari alamat…' : 'Belum ada titik. Ketuk peta untuk memilih.'}
                  readOnly
                  className="rounded border border-isian bg-white px-3.5 py-3 text-base"
                />
              </label>
            </div>
          </Bagian>

          <Bagian n="3" judul="Jenis kerusakan">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Jenis kerusakan">
              {JENIS.map(([nilai, label]) => (
                <button
                  key={nilai}
                  type="button"
                  aria-pressed={jenis === nilai}
                  onClick={() => setJenis(nilai)}
                  className={`rounded-xs border px-4 py-2.5 text-[15px] font-semibold ${
                    jenis === nilai ? 'border-tinta bg-tinta text-white' : 'border-isian bg-white hover:bg-beton'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Bagian>

          <Bagian n="4" judul="Seberapa parah?">
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Tingkat kerusakan">
              {KEPARAHAN.map(([nilai, judul, isi]) => (
                <label
                  key={nilai}
                  className={`flex cursor-pointer gap-3.5 rounded px-4 py-3.5 ${
                    keparahan === nilai ? 'border-[1.5px] border-tinta bg-sorot' : 'border border-garis bg-white'
                  }`}
                >
                  <input type="radio" name="keparahan" value={nilai} checked={keparahan === nilai} onChange={() => setKeparahan(nilai)} className="peer sr-only" />
                  <span className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-[#b9aea9] peer-checked:border-merah peer-focus-visible:outline-3 peer-focus-visible:outline-kuning">
                    {keparahan === nilai && <span className="size-2.5 rounded-full bg-merah" />}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-base font-bold">{judul}</span>
                    <span className="text-sm text-redup">{isi}</span>
                  </span>
                </label>
              ))}
            </div>
          </Bagian>

          <Bagian n="5" judul="Keterangan" sub="Boleh dikosongkan.">
            <label className="sr-only" htmlFor="keterangan">Keterangan</label>
            <textarea
              id="keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Misal: lubangnya sekitar satu meter, dalamnya sejengkal."
              className="w-full rounded border border-isian bg-white px-3.5 py-3 text-base outline-none placeholder:text-redup focus:border-tinta"
            />
          </Bagian>

          <Bagian n="6" judul="Kontak untuk kabar status" sub="Tidak ditampilkan ke publik. Dipakai untuk mengabarkan status dan meminta konfirmasi “Selesai” lewat email.">
            <p className="rounded bg-beton px-4 py-3 text-[15px]">
              Kabar dikirim ke <strong>{warga.email}</strong>.
            </p>
          </Bagian>

          <div className="flex flex-col gap-3 sm:pl-[46px]">
            {kirimState.galat && (
              <p role="alert" className="rounded border border-[#e8b4b0] bg-[#fdf0ef] px-4 py-3 text-sm text-[#b3261e]">
                {kirimState.galat.message}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={!bisaKirim}
                className="rounded bg-merah px-5 py-3 text-base font-bold text-white hover:bg-[#861313] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {kirimState.mengirim ? 'Mengirim…' : 'Kirim laporan'}
              </button>
              <p className="flex-1 text-sm text-redup">
                {bisaKirim || kirimState.mengirim
                  ? 'Nomor laporan langsung muncul setelah dikirim.'
                  : !foto.length
                    ? 'Tambahkan minimal satu foto kerusakan.'
                    : !semuaLolos
                      ? 'Semua foto harus lolos pengecekan.'
                      : !titik
                        ? 'Pilih titik kerusakan di peta.'
                        : 'Pilih jenis dan tingkat kerusakan.'}
              </p>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <PanelRuas titik={titik} />
          <div className="flex flex-col gap-4 rounded-md bg-sorot p-6">
            <p className="font-judul text-[22px] leading-tight">Kenapa foto dicek?</p>
            <p className="text-sm leading-normal text-redup">Laporan baru tampil di peta publik setelah lolos dua tahap pengecekan.</p>
            {[
              ['1', 'Dicek otomatis', 'Geotag, waktu foto, keaslian, dan duplikat.'],
              ['2', 'Diverifikasi petugas', 'Paling lambat 2 hari kerja.'],
              ['3', 'Tampil di peta publik', 'Semua warga bisa ikut memantau.'],
            ].map(([n, a, b]) => (
              <div key={n} className="flex items-start gap-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-oranye text-sm font-bold text-oranye">{n}</span>
                <span className="flex flex-col gap-0.5 leading-normal">
                  <span className="text-[15px] font-bold">{a}</span>
                  <span className="text-sm text-redup">{b}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-md border border-[#d9d2cc] bg-white p-6">
            <p className="font-judul text-[22px] leading-tight">Tips supaya lolos</p>
            {['Nyalakan izin lokasi untuk kamera ponsel', 'Ambil foto langsung di lokasi, bukan dari galeri lama', 'Foto dari dekat dan dari jauh supaya ruasnya terlihat'].map((t) => (
              <p key={t} className="flex items-start gap-2.5 text-sm leading-normal">
                <Ikon nama="centang" className="mt-0.5 size-[18px] text-hijau" />
                {t}
              </p>
            ))}
          </div>
          <Tombol to="/lacak" varian="garis" className="self-start">Sudah pernah lapor? Lacak di sini</Tombol>
        </aside>
      </form>

      {kameraBuka && (
        <KameraLapor
          ke={foto.length + 1}
          total={MAKS_FOTO}
          onTutup={() => setKameraBuka(false)}
          onAmbil={({ file, kamera }) => {
            setKameraBuka(false)
            if (!titik) setTitik([kamera.lat, kamera.lng])
            tambah(file, kamera)
          }}
        />
      )}
    </>
  )
}
