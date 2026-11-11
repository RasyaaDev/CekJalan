import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Foto, Ikon, Muat, StatusGaransi, Tombol } from '../components/ui'
import { kirim, useData } from '../lib/api'
import { useWarga } from '../lib/auth'
import { LABEL_LAPORAN, tanggal, tanggalJam, tanggalPendek, teksTenggat, waktuRelatif } from '../lib/format'

const URUTAN = ['masuk', 'diverifikasi', 'diteruskan', 'dikerjakan', 'selesai', 'dikonfirmasi']
const HARI_MS = 86_400_000

function Pencarian({ awal = '' }) {
  const navigate = useNavigate()
  const [kode, setKode] = useState(awal)
  return (
    <form
      className="flex w-full max-w-[480px] gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        const bersih = kode.trim().toUpperCase()
        if (bersih) navigate(`/lacak/${encodeURIComponent(bersih)}`)
      }}
    >
      <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded border border-isian bg-white px-3.5 py-3 focus-within:outline-3 focus-within:outline-kuning">
        <Ikon nama="cari" className="size-5 text-redup" />
        <span className="sr-only">Nomor laporan</span>
        <input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Nomor laporan, misal CJ-1A2B3C4D" className="min-w-0 flex-1 text-base uppercase outline-none placeholder:normal-case placeholder:text-redup" />
      </label>
      <button type="submit" className="rounded bg-oranye px-5 py-3 text-base font-bold text-white hover:bg-[#a9380b]">Lacak</button>
    </form>
  )
}

function statusSaatIni(l) {
  if (l.dikonfirmasi_pada) return 'dikonfirmasi'
  return l.status
}

function waktuRiwayat(riwayat, status) {
  const cocok = riwayat.filter((r) => r.status === status)
  return cocok.at(-1)?.dibuat_pada ?? null
}

function Timeline({ laporan }) {
  const ditanggung = laporan.garansi === 'ok' || laporan.garansi === 'warn'
  const penanggung = ditanggung ? laporan.pelaksana ?? 'kontraktor' : 'Dinas PU Bina Marga'
  const sekarang = Math.max(1, URUTAN.indexOf(statusSaatIni(laporan)))
  const riwayat = laporan.riwayat ?? []

  const langkah = [
    ['masuk', 'Laporan diterima', 'Foto dan titik lokasi masuk ke sistem.', laporan.dibuat_pada],
    [
      'diverifikasi',
      'Diverifikasi Dinas PU Bina Marga',
      laporan.ruas
        ? `Cocok dengan proyek ${laporan.ruas}. ${ditanggung ? 'Masih masa pemeliharaan.' : 'Masa pemeliharaan sudah habis.'}`
        : 'Petugas memastikan laporan dan lokasinya.',
    ],
    ['diteruskan', `Diteruskan ke ${penanggung}`, `Tenggat perbaikan ${tanggal(laporan.tenggat_pada)}.`],
    [
      'dikerjakan',
      'Mulai dikerjakan',
      laporan.buka_lagi_count > 0
        ? `Dibuka lagi ${laporan.buka_lagi_count} kali karena pelapor menolak status “Selesai”.`
        : 'Perbaikan sedang berjalan di lapangan.',
    ],
    ['selesai', `Ditandai selesai oleh ${ditanggung ? 'kontraktor' : 'petugas'}`, 'Sekarang giliranmu mengecek. Kalau belum beres, tolak saja.'],
    ['dikonfirmasi', 'Selesai', 'Laporan ditutup setelah kamu konfirmasi.'],
  ]

  return (
    <ol>
      {langkah.map(([status, judul, isi, cadangan], i) => {
        const selesai = i < sekarang || (i === sekarang && status === 'dikonfirmasi')
        const aktif = i === sekarang && !selesai
        const waktu = waktuRiwayat(riwayat, status) ?? (i <= sekarang ? cadangan : null)
        const terakhir = i === langkah.length - 1
        return (
          <li key={status} className="flex gap-5">
            <div className="flex w-6 shrink-0 flex-col items-center gap-1.5">
              {selesai ? (
                <span className="flex size-5 items-center justify-center rounded-xs bg-tinta text-white">
                  <Ikon nama="centang" className="size-3.5" />
                </span>
              ) : (
                <span className={`size-5 rounded-xs border-2 ${aktif ? 'border-tinta bg-kuning' : 'border-[#b7aea8] bg-white'}`} />
              )}
              {!terakhir && <span className={`w-0 flex-1 border-l-[3px] border-dashed ${selesai ? 'border-tinta' : 'border-[#b7aea8]'}`} />}
            </div>
            <div className={`flex min-w-0 flex-1 flex-col gap-1 pb-8 ${!selesai && !aktif ? 'text-redup' : ''}`}>
              {waktu && <p className="text-[13px] text-redup">{tanggalJam(waktu)}</p>}
              <p className="text-lg font-bold">{judul}</p>
              <p className="text-[15px] leading-normal text-redup">{isi}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function KonfirmasiHasil({ laporan, onSelesai }) {
  const { warga } = useWarga()
  const [email, setEmail] = useState(warga?.email ?? '')
  const [proses, setProses] = useState({ jalan: null, galat: null })

  async function jawab(aksi) {
    setProses({ jalan: aksi, galat: null })
    try {
      await kirim(`/api/laporan/${laporan.kode}/${aksi}`, { body: { email: email.trim() } })
      onSelesai()
    } catch (galat) {
      setProses({ jalan: null, galat: galat.message })
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded bg-beton p-6 sm:p-7">
      <h2 className="font-judul text-[30px] leading-tight text-merah">Cek dulu hasil perbaikannya</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <figure className="flex flex-col gap-2">
          <Foto src={laporan.foto_url} alt="Foto kerusakan sebelum diperbaiki" className="h-[240px] w-full" />
          <figcaption className="text-sm font-semibold">Sebelum · foto kamu, {tanggalPendek(laporan.dibuat_pada).split(' ').slice(0, 2).join(' ')}</figcaption>
        </figure>
        <figure className="flex flex-col gap-2">
          <Foto src={laporan.foto_sesudah_url} alt="Foto jalan sesudah diperbaiki" className="h-[240px] w-full" />
          <figcaption className="text-sm font-semibold">
            Sesudah{laporan.selesai_pada ? ` · ${tanggalPendek(laporan.selesai_pada).split(' ').slice(0, 2).join(' ')}` : ''}
            {!laporan.foto_sesudah_url && ' · foto belum diunggah'}
          </figcaption>
        </figure>
      </div>
      <p className="text-base leading-relaxed text-redup">
        Kalau lubangnya masih ada atau tambalannya asal-asalan, tolak status “Selesai”. Laporan kembali ke penanggung jawab dan tercatat di rapornya.
      </p>
      {!warga && (
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Email yang kamu pakai waktu melapor</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="rounded border border-[#d9d2cc] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-tinta" />
        </label>
      )}
      {proses.galat && <p role="alert" className="text-sm text-[#b3261e]">{proses.galat}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!email || proses.jalan} onClick={() => jawab('konfirmasi')} className="rounded bg-oranye px-5 py-3 text-base font-bold text-white hover:bg-[#a9380b] disabled:opacity-50">
          {proses.jalan === 'konfirmasi' ? 'Menyimpan…' : 'Ya, sudah beres'}
        </button>
        <button type="button" disabled={!email || proses.jalan} onClick={() => jawab('buka-lagi')} className="rounded border-[1.5px] border-tinta bg-white px-5 py-3 text-base font-bold hover:bg-beton disabled:opacity-50">
          {proses.jalan === 'buka-lagi' ? 'Menyimpan…' : 'Belum beres, tolak'}
        </button>
      </div>
    </section>
  )
}

function RingkasStatus({ laporan }) {
  const ditanggung = laporan.garansi === 'ok' || laporan.garansi === 'warn'
  const penanggung = ditanggung ? laporan.pelaksana ?? 'kontraktor' : 'Dinas PU Bina Marga'
  const status = statusSaatIni(laporan)
  const judul = {
    masuk: 'Menunggu verifikasi petugas',
    diverifikasi: 'Sudah diverifikasi petugas',
    diteruskan: `Diteruskan ke ${penanggung}`,
    dikerjakan: `Dikerjakan ${penanggung}`,
    dikonfirmasi: 'Perbaikan sudah beres',
    ditolak: 'Laporan ditolak petugas',
    perlu_foto_ulang: 'Petugas butuh foto ulang',
  }[status]
  const ditahan = status === 'ditolak' || status === 'perlu_foto_ulang'

  return (
    <section className="flex flex-col gap-2 rounded-md border border-[#d9d2cc] bg-white p-5">
      <p className={`flex items-center gap-1.5 text-[13px] font-bold ${status === 'dikonfirmasi' ? 'text-hijau' : ditahan ? 'text-merah' : 'text-oranye'}`}>
        <span className={`size-2.5 rounded-full ${status === 'dikonfirmasi' ? 'bg-hijau' : ditahan ? 'bg-merah' : 'bg-oranye'}`} />
        {status === 'dikonfirmasi' ? 'Selesai' : LABEL_LAPORAN[status]}
      </p>
      <p className="font-judul text-xl leading-tight">{judul}</p>
      <p className="text-[13px] leading-normal text-redup">
        {ditahan
          ? `${laporan.alasan_tolak ? `Catatan petugas: ${laporan.alasan_tolak}. ` : ''}${status === 'perlu_foto_ulang' ? 'Kirim laporan baru dengan foto yang diambil langsung di lokasi.' : ''}`
          : status === 'dikonfirmasi'
          ? `Kamu mengonfirmasi perbaikan pada ${tanggal(laporan.dikonfirmasi_pada)}.`
          : `Tenggat perbaikan ${tanggal(laporan.tenggat_pada)}. ${ditanggung ? 'Biaya ditanggung kontraktor karena ruas ini masih garansi.' : 'Perbaikan memakai anggaran pemeliharaan Pemkab.'}`}
      </p>
    </section>
  )
}

function teksTenggatAkhir(l) {
  if (l.selesai_pada && l.tenggat_pada) {
    const selisih = Math.round((new Date(l.tenggat_pada) - new Date(l.selesai_pada)) / HARI_MS)
    if (selisih > 0) return `${tanggal(l.tenggat_pada)}. Ditandai selesai ${selisih} hari lebih cepat.`
    if (selisih < 0) return `${tanggal(l.tenggat_pada)}. Ditandai selesai ${-selisih} hari terlambat.`
    return `${tanggal(l.tenggat_pada)}. Ditandai selesai tepat di hari tenggat.`
  }
  return `${tanggal(l.tenggat_pada)}. ${teksTenggat(l.tenggat_pada, l.status)}.`
}

function DetailLaporan({ kode }) {
  const { data: laporan, error, loading, ulang } = useData(`/api/laporan/${encodeURIComponent(kode)}`)

  if (!laporan) {
    return (
      <div className="mx-auto max-w-konten px-4 py-10">
        {error?.message === 'Laporan tidak ditemukan' ? (
          <p className="text-lg text-redup">Laporan <strong className="text-tinta">{kode}</strong> tidak ditemukan. Cek lagi nomornya.</p>
        ) : (
          <Muat loading={loading} error={error} onUlang={ulang} />
        )}
      </div>
    )
  }

  const status = statusSaatIni(laporan)
  const label = status === 'selesai' ? 'Menunggu konfirmasimu' : status === 'dikonfirmasi' ? 'Selesai' : LABEL_LAPORAN[status]
  const ditanggung = laporan.garansi === 'ok' || laporan.garansi === 'warn'

  return (
    <>
      <div className="mx-auto flex max-w-konten flex-col gap-4 px-4 pt-6 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-judul text-[36px] leading-tight text-merah md:text-5xl">Laporan {laporan.kode}</h1>
          <p className="text-base text-redup">
            {[laporan.deskripsi, laporan.ruas, `Dilaporkan ${tanggal(laporan.dibuat_pada)}`].filter(Boolean).join(' · ')}
          </p>
        </div>
        <StatusGaransi status="lap" label={label} className="shrink-0" />
      </div>

      <div className="mx-auto grid max-w-konten gap-12 px-4 pb-24 pt-10 lg:grid-cols-[500px_1fr] lg:gap-16">
        <Timeline laporan={laporan} />
        <div className="flex min-w-0 flex-col gap-6">
          {status === 'selesai' ? <KonfirmasiHasil laporan={laporan} onSelesai={ulang} /> : <RingkasStatus laporan={laporan} />}
          <dl className="border-t border-garis">
            {[
              ['Ruas', laporan.ruas ?? 'Belum dicocokkan dengan kontrak'],
              ['Proyek', laporan.ruas ? [laporan.ruas, laporan.tahun_proyek].filter(Boolean).join(' ') : '—'],
              ['Penanggung jawab', ditanggung ? `${laporan.pelaksana ?? 'Kontraktor'}, masih masa pemeliharaan` : 'Dinas PU Bina Marga'],
              ['Tenggat', teksTenggatAkhir(laporan)],
            ].map(([a, b]) => (
              <div key={a} className="flex flex-col gap-1 border-b border-garis py-3 sm:flex-row sm:gap-4">
                <dt className="text-sm text-redup sm:w-[180px] sm:shrink-0">{a}</dt>
                <dd className="text-[15px] font-semibold">{b}</dd>
              </div>
            ))}
          </dl>
          <p className="flex items-center gap-2.5 rounded-lg bg-sorot px-3.5 py-3 text-[13px]">
            <Ikon nama="surat" className="size-5 text-hijau" />
            {laporan.email_samaran ? `Kabar status dikirim ke email ${laporan.email_samaran}.` : 'Kabar status dikirim ke email yang kamu isi waktu melapor.'}
          </p>
        </div>
      </div>
    </>
  )
}

function LaporanSaya() {
  const { data, error, loading, ulang } = useData('/api/laporan/saya')
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-judul text-[28px] text-merah">Laporanmu</h2>
      <Muat loading={loading} error={error} onUlang={ulang} />
      {data?.length === 0 && <p className="text-redup">Kamu belum pernah melapor.</p>}
      <ul>
        {data?.map((l) => (
          <li key={l.kode} className="border-t border-garis">
            <Link to={`/lacak/${l.kode}`} className="flex items-center gap-3 py-3 hover:bg-beton">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-bold">{l.kode} · {l.label_jenis ?? l.deskripsi}</span>
                <span className="truncate text-[13px] text-redup">{l.ruas ?? 'Lokasi belum dicocokkan'} · {waktuRelatif(l.dibuat_pada)}</span>
              </span>
              <span className="shrink-0 text-[13px] font-semibold">{l.dikonfirmasi_pada ? 'Selesai' : LABEL_LAPORAN[l.status]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function LacakLaporan() {
  const { kode } = useParams()
  const { warga } = useWarga()

  return (
    <>
      <div className="mx-auto flex max-w-konten flex-col gap-6 px-4 pt-10">
        {!kode && (
          <div className="flex flex-col gap-2">
            <h1 className="font-judul text-[36px] leading-tight text-merah md:text-5xl">Lacak laporan</h1>
            <p className="text-lg text-redup">Masukkan nomor laporan yang kamu terima setelah melapor.</p>
          </div>
        )}
        <Pencarian key={kode} awal={kode ?? ''} />
      </div>
      {kode ? (
        <DetailLaporan key={kode} kode={kode} />
      ) : (
        <div className="mx-auto max-w-konten px-4 pb-24 pt-10">
          {warga ? <LaporanSaya /> : (
            <p className="text-redup">
              <Link to="/masuk" className="font-bold text-oranye hover:underline">Masuk</Link> untuk melihat semua laporanmu tanpa mengetik nomor.
            </p>
          )}
          <div className="mt-10"><Tombol to="/lapor" varian="merah">Lapor kerusakan baru</Tombol></div>
        </div>
      )}
    </>
  )
}
