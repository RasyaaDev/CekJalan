import Header from './components/Header'
import Footer from './components/Footer'
import PapanProyek from './components/PapanProyek'
import PetaProyek from './components/PetaProyek'
import { Foto, JudulSeksi, Kredit, Marka, StatusGaransi, Tag, Tombol } from './components/ui'
import { laporanTerbaru, kreditFoto, rapor, dashboardContoh, faq } from './data'

function Hero() {
  return (
    <section className="grid md:grid-cols-[600px_1fr]">
      <div className="flex flex-col justify-center gap-6 bg-merah px-6 py-14 text-white md:px-[120px] md:py-20 md:pr-12">
        <h1 className="font-judul text-[40px] leading-[1.02] md:text-[56px]">
          Cek siapa yang membangun jalan di depan rumahmu.
        </h1>
        <p className="text-[17px] leading-relaxed text-[#F6DCD6]">
          CekJalan membaca kontrak jalan dari LPSE Sidoarjo: siapa kontraktornya, berapa nilainya, dan sampai kapan masa garansinya. Selama masih garansi, perbaikan jadi kewajiban kontraktor.
        </p>
        <form className="flex w-full max-w-[440px] overflow-hidden rounded bg-white" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="cari" className="sr-only">Cari nama jalan</label>
          <input id="cari" placeholder="Cari nama jalan di Sidoarjo" className="min-w-0 flex-1 px-4 py-3 text-[15px] text-tinta outline-none placeholder:text-redup" />
          <button className="m-1 rounded bg-oranye px-4 text-[15px] font-bold text-white hover:bg-[#a9380b]">Cek jalan</button>
        </form>
        <p className="text-sm text-[#F6DCD6]">Contoh pencarian: Jalan Gajah Mada, Jalan Lingkar Timur</p>
      </div>
      <div className="relative min-h-[520px] md:min-h-[680px]">
        <Foto src="/foto/lubang.jpg" alt="Jalan berlubang" className="absolute inset-0 h-full w-full !rounded-none" />
        <div className="absolute bottom-0 right-6 top-20 flex w-[min(380px,calc(100%-48px))] flex-col md:right-12 md:top-28">
          <PapanProyek />
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
    <section className="mx-auto grid max-w-konten gap-12 px-4 pb-6 pt-20 md:grid-cols-[1fr_520px] md:gap-20 md:px-0 md:pt-24">
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
    <section className="pt-20">
      <div className="mx-auto mb-6 flex max-w-konten flex-col gap-4 px-4 md:flex-row md:items-end md:justify-between md:px-0">
        <div>
          <JudulSeksi>Peta proyek jalan Sidoarjo</JudulSeksi>
          <p className="mt-3 text-redup">Warna titik mengikuti status garansi. Klik titiknya untuk melihat papan proyek.</p>
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
  { w: 'md:w-[200px]', bar: [['bg-isian', 'w-full']], judul: 'Tender di LPSE', isi: 'Nilai kontrak dan pemenang tender tercatat untuk publik.', pj: 'panitia pengadaan' },
  { w: 'md:w-[230px]', bar: [['bg-oranye', 'w-full']], judul: 'Pekerjaan berjalan', isi: 'Kontraktor membangun sesuai isi kontrak.', pj: 'kontraktor' },
  { w: 'md:w-[480px]', bar: [['bg-hijau', 'flex-[370]'], ['bg-kuning', 'flex-[106]']], judul: 'Masa pemeliharaan', isi: 'Rusak di masa ini? Kontraktor wajib memperbaiki tanpa anggaran baru. Bagian kuning menandai sisa waktu yang tinggal sedikit.', pj: 'kontraktor' },
  { w: 'md:w-[274px]', bar: [['bg-abu', 'w-full']], judul: 'Setelah masa pemeliharaan', isi: 'Perbaikan masuk anggaran pemeliharaan Pemkab.', pj: 'Dinas PU Bina Marga' },
]

function UmurKontrak() {
  return (
    <section className="bg-beton px-4 py-20 md:px-0">
      <div className="mx-auto flex max-w-konten flex-col gap-7">
        <JudulSeksi>Siapa yang menanggung perbaikan?</JudulSeksi>
        <p className="max-w-[760px] text-lg leading-relaxed text-redup">Jawabannya tergantung di titik mana jalan itu berada dalam umur kontraknya.</p>
        <ol className="flex flex-col gap-8 md:flex-row md:gap-1">
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
    <section className="mx-auto max-w-konten px-4 pt-20 md:px-0">
      <JudulSeksi>Dari laporan sampai jalan beres</JudulSeksi>
      <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
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
  return (
    <section className="mx-auto max-w-konten px-4 pb-14 pt-16 md:px-0">
      <div className="flex items-end justify-between gap-4 pb-3">
        <JudulSeksi>Laporan terbaru dari warga</JudulSeksi>
        <Tag />
      </div>
      <ul>
        {laporanTerbaru.map((l) => (
          <li key={l.judul} className="grid gap-5 border-b border-garis py-5 md:grid-cols-[220px_1fr_240px] md:gap-7">
            <Foto src={l.foto} alt={l.judul} className="h-[150px] w-full md:w-[220px]" />
            <div className="flex flex-col gap-2">
              <StatusGaransi status="lap" label={l.status} />
              <h3 className="text-xl font-bold">{l.judul}</h3>
              <p className="leading-relaxed text-redup">{l.lokasi}</p>
              <StatusGaransi status={l.garansi} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-redup">Penanggung jawab</span>
              <span className="font-bold">{l.pj}</span>
              <span className={`text-[15px] font-bold ${l.telat ? 'text-oranye' : ''}`}>{l.tenggat}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3"><Kredit>{kreditFoto} Isi laporan adalah contoh.</Kredit></div>
    </section>
  )
}

const KOLOM = ['Kontraktor', 'Proyek di Sidoarjo', 'Rusak saat garansi', 'Rata-rata perbaikan', '“Selesai” ditolak']

function Rapor() {
  return (
    <section className="mx-auto max-w-konten px-4 pb-20 pt-6 md:px-0">
      <div className="flex items-end justify-between gap-4">
        <JudulSeksi>Rapor kontraktor</JudulSeksi>
        <Tag />
      </div>
      <p className="mt-3 text-redup">Riwayat setiap kontraktor terbuka: berapa proyeknya rusak saat masih garansi dan seberapa cepat diperbaiki.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b-2 border-tinta">{KOLOM.map((k) => <th key={k} className="py-3 text-xs font-bold text-redup">{k}</th>)}</tr>
          </thead>
          <tbody>
            {rapor.map((r) => (
              <tr key={r.nama} className={`border-b border-garis ${r.buruk ? 'bg-sorot' : ''}`}>
                <td className="py-4 font-bold">{r.nama}</td>
                <td>{r.ruas}</td><td>{r.rusak}</td>
                <td className={r.buruk ? 'font-bold text-oranye' : ''}>{r.waktu}</td>
                <td className={r.buruk ? 'font-bold text-oranye' : ''}>{r.ditolak}</td>
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
  return (
    <section className="bg-aspal px-4 py-20 md:px-0 md:py-[88px]">
      <div className="mx-auto grid max-w-konten gap-12 md:grid-cols-[440px_1fr] md:gap-16">
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
            <span className="text-[13px] text-redup">Hari ini, 26 Oktober 2026</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="border-b border-garis text-xs text-redup">{['Nomor', 'Ruas', 'Garansi', 'Status', 'Tenggat'].map((k) => <th key={k} className="px-5 py-3 font-bold">{k}</th>)}</tr></thead>
              <tbody>
                {dashboardContoh.map((d) => (
                  <tr key={d.no} className={`border-b border-garis last:border-0 ${d.telat ? 'bg-sorot' : ''}`}>
                    <td className="px-5 py-3 font-bold">{d.no}</td>
                    <td className="px-5">{d.ruas}</td>
                    <td className="px-5"><StatusGaransi status={d.garansi} label={d.label} /></td>
                    <td className="px-5">{d.status}</td>
                    <td className={`px-5 ${d.telat ? 'font-bold text-oranye' : ''}`}>{d.tenggat}</td>
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
    <section className="mx-auto max-w-konten px-4 pb-[72px] pt-[88px] md:px-0">
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
    <section>
      <div className="h-3.5" style={{ background: 'repeating-linear-gradient(-45deg,#2B1714 0 14px,#F2B400 14px 28px)' }} />
      <div className="bg-kuning px-4 py-14 md:px-0">
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
