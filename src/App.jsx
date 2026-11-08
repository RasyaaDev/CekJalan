import { useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import PapanProyek from './components/PapanProyek'
import PetaProyek from './components/PetaProyek'
import { Foto, JudulSeksi, Marka, Muat, StatusGaransi, Tag, Tombol } from './components/ui'
import { getData, useData } from './lib/api'
import { LABEL_LAPORAN, teksTenggat, waktuRelatif } from './lib/format'
import { faq } from './data'

function Hero() {
  const [kata, setKata] = useState('')
  const [slug, setSlug] = useState('pahlawan')
  const [hasil, setHasil] = useState(null)
  const [mencari, setMencari] = useState(false)
  const [galat, setGalat] = useState(false)

  async function cari(e) {
    e.preventDefault()
    const q = kata.trim()
    if (!q) return
    setMencari(true)
    setGalat(false)
    try {
      setHasil(await getData(`/api/proyek?limit=8&q=${encodeURIComponent(q)}`))
    } catch {
      setHasil(null)
      setGalat(true)
    } finally {
      setMencari(false)
    }
  }

  return (
    <section className="grid lg:grid-cols-[600px_1fr]">
      <div className="flex flex-col justify-center gap-6 bg-merah px-6 py-14 text-white md:px-[120px] md:py-20 md:pr-12">
        <h1 className="font-judul text-[40px] leading-[1.02] md:text-[56px]">
          Cek siapa yang membangun jalan di depan rumahmu.
        </h1>
        <p className="text-[17px] leading-relaxed text-[#F6DCD6]">
          CekJalan membaca kontrak jalan dari LPSE Sidoarjo: siapa kontraktornya, berapa nilainya, dan sampai kapan masa garansinya. Selama masih garansi, perbaikan jadi kewajiban kontraktor.
        </p>
        <div className="relative w-full max-w-[440px]">
          <form className="flex w-full overflow-hidden rounded bg-white" onSubmit={cari}>
            <label htmlFor="cari" className="sr-only">Cari nama jalan</label>
            <input
              id="cari"
              value={kata}
              onChange={(e) => setKata(e.target.value)}
              autoComplete="off"
              placeholder="Cari nama jalan di Sidoarjo"
              className="min-w-0 flex-1 px-4 py-3 text-[15px] text-tinta outline-none placeholder:text-redup"
            />
            <button type="submit" className="m-1 rounded bg-oranye px-4 text-[15px] font-bold text-white hover:bg-[#a9380b]">
              {mencari ? 'Mencari…' : 'Cek jalan'}
            </button>
          </form>
          {(mencari || galat || hasil) && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded border border-garis bg-white text-tinta shadow-xl">
              {galat && <p className="px-4 py-3 text-sm text-oranye">Gagal memuat data. Coba lagi.</p>}
              {hasil?.length === 0 && <p className="px-4 py-3 text-sm text-redup">Tidak ada jalan yang cocok.</p>}
              {hasil?.map((proyek) => (
                <button
                  key={proyek.slug}
                  type="button"
                  onClick={() => {
                    setSlug(proyek.slug)
                    setHasil(null)
                    document.getElementById('papan-hero')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className="flex w-full items-center justify-between gap-3 border-b border-garis px-4 py-3 text-left last:border-0 hover:bg-kertas"
                >
                  <span>
                    <span className="block text-sm font-bold">{proyek.ruas}</span>
                    <span className="block text-xs text-redup">{proyek.lokasi ?? 'Sidoarjo'}</span>
                  </span>
                  <StatusGaransi status={proyek.garansi} />
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-[#F6DCD6]">Contoh pencarian: Jalan Gajah Mada, Jalan Lingkar Timur</p>
      </div>
      <div className="relative min-h-[520px] md:min-h-[680px]">
        <Foto src="/foto/lubang.jpg" alt="Jalan berlubang" eager className="absolute inset-0 h-full w-full !rounded-none" />
        <div id="papan-hero" className="absolute bottom-0 right-6 top-20 flex w-[min(380px,calc(100%-48px))] scroll-mt-24 flex-col md:right-12 md:top-28">
          <PapanProyek slug={slug} />
          <div className="mx-auto flex w-3/4 flex-1 justify-between">
            <span className="w-2.5 bg-[#8A8580]" /><span className="w-2.5 bg-[#8A8580]" />
          </div>
        </div>
      </div>
    </section>
  )
}

const POIN_PAPAN = [
  ['Pelaksana', 'Kontraktor yang menandatangani kontrak. Selama masa pemeliharaan, dia yang wajib memperbaiki.'],
  ['Nilai kontrak dan sumber dana', 'Berapa uang daerah yang dipakai dan dari APBD tahun berapa.'],
  ['Masa pemeliharaan', 'Jangka waktu kontraktor wajib memperbaiki kerusakan tanpa biaya tambahan.'],
]

function PapanDigital() {
  return (
    <section className="mx-auto grid max-w-konten gap-12 px-4 pb-6 pt-20 lg:grid-cols-[1fr_520px] lg:gap-20 lg:pt-24">
      <div className="flex flex-col gap-5">
        <JudulSeksi>Satu papan untuk setiap ruas jalan</JudulSeksi>
        <p className="text-lg leading-relaxed text-redup">
          Papan proyek di lapangan sering hilang begitu jalan selesai dibangun. CekJalan menyimpannya dalam bentuk digital, lengkap dengan masa pemeliharaannya.
        </p>
        <dl className="pt-2">
          {POIN_PAPAN.map(([a, b]) => (
            <div key={a} className="border-t border-garis py-4">
              <dt className="text-[17px] font-bold">{a}</dt>
              <dd className="mt-1 leading-relaxed text-redup">{b}</dd>
            </div>
          ))}
        </dl>
      </div>
      <PapanProyek className="self-start" />
    </section>
  )
}

const LEGENDA = [['ok', 'Masih garansi'], ['warn', 'Hampir habis'], ['exp', 'Garansi habis'], ['lap', 'Laporan warga']]

function PetaSection() {
  return (
    <section id="peta" className="scroll-mt-20 pt-20">
      <div className="mx-auto mb-6 flex max-w-konten flex-col gap-4 px-4 md:flex-row md:items-end md:justify-between">
        <div>
          <JudulSeksi>Peta proyek jalan Sidoarjo</JudulSeksi>
          <p className="mt-3 text-redup">Warna titik mengikuti status garansi. Klik titiknya untuk melihat nama jalan dan sisa garansinya.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {LEGENDA.map(([s, l]) => (
            <span key={s} className="inline-flex items-center gap-2 text-sm font-semibold"><Marka status={s} />{l}</span>
          ))}
          <Tag />
        </div>
      </div>
      <PetaProyek className="h-[420px] w-full md:h-[560px]" />
    </section>
  )
}

const TAHAP = [
  { w: 'xl:w-[200px]', bar: [['bg-isian', 'w-full']], judul: 'Tender di LPSE', isi: 'Nilai kontrak dan pemenang tender tercatat untuk publik.', pj: 'panitia pengadaan' },
  { w: 'xl:w-[230px]', bar: [['bg-oranye', 'w-full']], judul: 'Pekerjaan berjalan', isi: 'Kontraktor membangun sesuai isi kontrak.', pj: 'kontraktor' },
  { w: 'xl:w-[480px]', bar: [['bg-hijau', 'flex-[370]'], ['bg-kuning', 'flex-[106]']], judul: 'Masa pemeliharaan', isi: 'Rusak di masa ini? Kontraktor wajib memperbaiki tanpa anggaran baru. Bagian kuning menandai sisa waktu yang tinggal sedikit.', pj: 'kontraktor' },
  { w: 'xl:w-[274px]', bar: [['bg-abu', 'w-full']], judul: 'Setelah masa pemeliharaan', isi: 'Perbaikan masuk anggaran pemeliharaan Pemkab.', pj: 'Dinas PU Bina Marga' },
]

function UmurKontrak() {
  return (
    <section className="bg-beton px-4 py-20">
      <div className="mx-auto flex max-w-konten flex-col gap-7">
        <JudulSeksi>Siapa yang menanggung perbaikan?</JudulSeksi>
        <p className="max-w-[760px] text-lg leading-relaxed text-redup">Jawabannya tergantung di titik mana jalan itu berada dalam umur kontraknya.</p>
        <ol className="flex flex-col gap-8 xl:flex-row xl:gap-1">
          {TAHAP.map((t) => (
            <li key={t.judul} className={`flex flex-col gap-3 ${t.w}`}>
              <div className="flex gap-1">{t.bar.map(([c, w], i) => <span key={i} className={`h-2.5 rounded-full ${c} ${w}`} />)}</div>
              <h3 className="text-lg font-bold">{t.judul}</h3>
              <p className="text-[15px] leading-relaxed text-redup">{t.isi}</p>
              <p className="text-sm font-semibold">Penanggung jawab: {t.pj}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-redup">Serah terima pekerjaan adalah titik mulai masa pemeliharaan.</p>
      </div>
    </section>
  )
}

function Langkah({ n, judul, isi, children }) {
  return (
    <div className="flex flex-col gap-4">
      {children}
      <div className="flex items-start gap-3">
        <span className="font-judul text-4xl leading-none text-merah">{n}</span>
        <h3 className="text-lg font-bold leading-snug">{judul}</h3>
      </div>
      <p className="text-[15px] leading-relaxed text-redup">{isi}</p>
    </div>
  )
}

function AlurLaporan() {
  return (
    <section className="mx-auto max-w-konten px-4 pt-20">
      <JudulSeksi>Dari laporan sampai jalan beres</JudulSeksi>
      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-8">
        <Langkah n="1" judul="Foto dan tandai lokasinya" isi="Ambil foto jalan rusak. Titik GPS otomatis dicocokkan dengan kontrak jalan terdekat.">
          <Foto src="/foto/retak.jpg" alt="Aspal retak" className="h-[220px] w-full" />
        </Langkah>
        <Langkah n="2" judul="Sampai ke pihak yang wajib memperbaiki" isi="Status garansi menentukan siapa yang menerima laporan. Setiap laporan punya tenggat.">
          <div className="flex h-[220px] flex-col justify-center gap-4 rounded bg-beton p-6">
            {[['ok', 'Masih garansi', 'diteruskan ke kontraktor'], ['warn', 'Hampir habis', 'diteruskan ke kontraktor, ditandai mendesak'], ['exp', 'Garansi habis', 'diteruskan ke Dinas PU Bina Marga']].map(([s, a, b]) => (
              <div key={s}>
                <p className="flex items-center gap-2 text-sm font-bold"><Marka status={s} />{a}</p>
                <p className="pl-[30px] text-sm text-redup">{b}</p>
              </div>
            ))}
          </div>
        </Langkah>
        <Langkah n="3" judul="Dipantau sampai benar-benar beres" isi="Progres terbuka untuk publik. Lewat tenggat, laporan otomatis naik ke atasan.">
          <Foto src="/foto/perbaikan-1.jpg" alt="Petugas menambal jalan" className="h-[220px] w-full" />
        </Langkah>
      </div>
      <div className="mt-10 rounded bg-beton px-6 py-5">
        <p className="font-bold">Belum beres? Pelapor bisa menolak status “Selesai”.</p>
        <p className="mt-1 text-sm text-redup">Laporan dibuka lagi dan tenggat perbaikan dihitung ulang.</p>
      </div>
    </section>
  )
}

function LaporanTerbaru() {
  const { data, error, loading, ulang } = useData('/api/laporan?limit=3')

  return (
    <section id="laporan" className="mx-auto max-w-konten scroll-mt-20 px-4 pb-14 pt-16">
      <div className="flex items-end justify-between gap-4 pb-3">
        <JudulSeksi>Laporan terbaru dari warga</JudulSeksi>
        <Tag />
      </div>
      <Muat loading={loading} error={error} onUlang={ulang} />
      {data && (
        <ul>
          {data.length === 0 && <li className="border-b border-garis py-6 text-sm text-redup">Belum ada laporan warga.</li>}
          {data.map((laporan) => {
            const pelaksana =
              laporan.garansi === 'exp' || laporan.garansi == null
                ? 'Dinas PU Bina Marga'
                : laporan.pelaksana ?? 'Dinas PU Bina Marga'

            return (
              <li key={laporan.kode} className="grid gap-5 border-b border-garis py-5 lg:grid-cols-[220px_1fr_240px] lg:gap-7">
                <Foto src={laporan.foto_url} alt={laporan.ruas ?? 'Laporan warga'} className="h-[150px] w-full lg:w-[220px]" />
                <div className="flex flex-col gap-2">
                  <StatusGaransi status="lap" label={LABEL_LAPORAN[laporan.status] ?? laporan.status} />
                  <h3 className="text-xl font-bold">{laporan.deskripsi}</h3>
                  <p className="leading-relaxed text-redup">
                    {laporan.ruas ?? 'Lokasi belum dicocokkan'}. Dilaporkan {waktuRelatif(laporan.dibuat_pada)}.
                  </p>
                  <StatusGaransi status={laporan.garansi} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] text-redup">Penanggung jawab</span>
                  <span className="font-bold">{pelaksana}</span>
                  <span className={`text-[15px] font-bold ${laporan.telat ? 'text-oranye' : ''}`}>
                    {teksTenggat(laporan.tenggat_pada, laporan.status)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

const KOLOM = ['Kontraktor', 'Proyek di Sidoarjo', 'Rusak saat garansi', 'Rata-rata perbaikan', '“Selesai” ditolak']

function Rapor() {
  const { data, error, loading, ulang } = useData('/api/kontraktor')
  const baris = [...(data ?? [])].sort(
    (a, b) => Number(b.buruk) - Number(a.buruk) || b.rusak - a.rusak || a.nama.localeCompare(b.nama),
  )

  return (
    <section id="rapor" className="mx-auto max-w-konten scroll-mt-20 px-4 pb-20 pt-6">
      <div className="flex items-end justify-between gap-4">
        <JudulSeksi>Rapor kontraktor</JudulSeksi>
        <Tag />
      </div>
      <p className="mt-3 text-redup">Riwayat setiap kontraktor terbuka: berapa proyeknya rusak saat masih garansi dan seberapa cepat diperbaiki.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b-2 border-tinta">{KOLOM.map((k) => <th key={k} scope="col" className="py-3 text-xs font-bold text-redup">{k}</th>)}</tr>
          </thead>
          <tbody>
            {(loading || error) && (
              <tr>
                <td colSpan={KOLOM.length}>
                  <Muat loading={loading} error={error} onUlang={ulang} />
                </td>
              </tr>
            )}
            {data?.length === 0 && (
              <tr>
                <td colSpan={KOLOM.length} className="border-b border-garis py-6 text-sm text-redup">
                  Belum ada data kontraktor.
                </td>
              </tr>
            )}
            {baris.map((r) => (
              <tr key={r.nama} className={`border-b border-garis ${r.buruk ? 'bg-sorot' : ''}`}>
                <td className="py-4 font-bold">{r.nama}</td>
                <td>{r.ruas} ruas</td>
                <td>{r.rusak} ruas</td>
                <td className={r.buruk ? 'font-bold text-oranye' : ''}>{r.waktu == null ? '—' : `${r.waktu} hari`}</td>
                <td className={r.buruk ? 'font-bold text-oranye' : ''}>{r.ditolak} kali</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const POIN_INSTANSI = [['warn', 'Verifikasi laporan lewat foto dan titik lokasi'], ['ok', 'Teruskan ke kontraktor dalam satu klik'], ['lap', 'Pantau laporan yang lewat tenggat']]

function UntukInstansi() {
  const { data, error, loading, ulang } = useData('/api/laporan?limit=4')
  const hariIni = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section className="bg-aspal px-4 py-20 lg:py-[88px]">
      <div className="mx-auto grid max-w-konten gap-12 lg:grid-cols-[440px_1fr] lg:gap-16">
        <div className="flex flex-col gap-5">
          <JudulSeksi terang>Untuk Dinas PU Bina Marga</JudulSeksi>
          <p className="text-[17px] leading-relaxed text-[#D9D2CC]">
            Semua laporan masuk ke satu dashboard. Status garansinya sudah terbaca, jadi petugas langsung tahu laporan mana yang harus diteruskan ke kontraktor.
          </p>
          <ul className="flex flex-col gap-3">
            {POIN_INSTANSI.map(([s, t]) => <li key={t} className="flex items-center gap-3 font-semibold text-white"><Marka status={s} />{t}</li>)}
          </ul>
          <div><Tombol varian="kuning">Lihat dashboard instansi</Tombol></div>
        </div>
        <div className="overflow-hidden rounded bg-white">
          <div className="flex items-center justify-between border-b border-garis px-5 py-4">
            <span className="font-judul text-[22px] text-merah">Laporan masuk</span>
            <span className="text-[13px] text-redup">Data per {hariIni}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="border-b border-garis text-xs text-redup">{['Nomor', 'Ruas', 'Garansi', 'Status', 'Tenggat'].map((k) => <th key={k} scope="col" className="px-5 py-3 font-bold">{k}</th>)}</tr></thead>
              <tbody>
                {(loading || error) && (
                  <tr>
                    <td colSpan={5} className="px-5">
                      <Muat loading={loading} error={error} onUlang={ulang} />
                    </td>
                  </tr>
                )}
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-sm text-redup">Belum ada laporan masuk.</td>
                  </tr>
                )}
                {data?.map((laporan) => (
                  <tr key={laporan.kode} className={`border-b border-garis last:border-0 ${laporan.telat ? 'bg-sorot' : ''}`}>
                    <td className="px-5 py-3 font-bold">{laporan.kode}</td>
                    <td className="px-5">{laporan.ruas ?? '—'}</td>
                    <td className="px-5"><StatusGaransi status={laporan.garansi} /></td>
                    <td className="px-5">{LABEL_LAPORAN[laporan.status] ?? laporan.status}</td>
                    <td className={`px-5 ${laporan.telat ? 'font-bold text-oranye' : ''}`}>
                      {teksTenggat(laporan.tenggat_pada, laporan.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-konten scroll-mt-20 px-4 pb-[72px] pt-[88px]">
      <JudulSeksi>Pertanyaan yang sering muncul</JudulSeksi>
      <dl className="mt-7 grid gap-x-14 md:grid-cols-2">
        {faq.map(([q, a]) => (
          <div key={q} className="border-t border-garis py-5">
            <dt className="text-lg font-bold">{q}</dt>
            <dd className="mt-2 leading-relaxed text-redup">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function AjakanLapor() {
  return (
    <section id="lapor" className="scroll-mt-20">
      <div className="h-3.5" style={{ background: 'repeating-linear-gradient(-45deg,#2B1714 0 14px,#F2B400 14px 28px)' }} />
      <div className="bg-kuning px-4 py-14">
        <div className="mx-auto flex max-w-konten flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[780px] font-judul text-3xl leading-[1.1] text-tinta md:text-[40px]">
            Lihat jalan rusak? Laporkan hari ini, lalu pantau sampai beres.
          </p>
          <Tombol varian="merah" className="shrink-0">Lapor kerusakan</Tombol>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PapanDigital />
        <PetaSection />
        <UmurKontrak />
        <AlurLaporan />
        <LaporanTerbaru />
        <Rapor />
        <UntukInstansi />
        <Faq />
        <AjakanLapor />
      </main>
      <Footer />
    </>
  )
}
