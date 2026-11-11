import { Link, useParams } from 'react-router'
import PapanProyek from '../components/PapanProyek'
import { Foto, Muat, StatusGaransi, Tag, Tombol } from '../components/ui'
import { useData } from '../lib/api'
import { LABEL_LAPORAN, rupiahSingkat, tanggal, tanggalPendek, teksTenggat, waktuRelatif } from '../lib/format'

const HARI_MS = 86_400_000
const BATAS_WARN_HARI = 30

function Subjudul({ children, aksi }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-judul text-[30px] leading-tight text-merah">{children}</h2>
      {aksi}
    </div>
  )
}

function BatangGaransi({ proyek }) {
  const mulai = new Date(proyek.selesai_pada).getTime()
  const akhir = new Date(proyek.akhir_garansi).getTime()
  const total = akhir - mulai
  if (!Number.isFinite(total) || total <= 0) return null

  const persen = (waktu) => Math.min(100, Math.max(0, ((waktu - mulai) / total) * 100))
  const hariIni = persen(Date.now())
  const batasWarn = persen(akhir - BATAS_WARN_HARI * HARI_MS)
  const habis = proyek.garansi === 'exp'
  const label = `Hari ini, ${tanggalPendek(new Date())} · ${habis ? 'garansi habis' : `tinggal ${proyek.sisa_hari} hari`}`

  return (
    <div>
      <div className="relative h-[60px]">
        <p
          className="absolute top-1 whitespace-nowrap text-[13px] font-bold"
          style={hariIni > 50 ? { right: `${100 - hariIni}%` } : { left: `${hariIni}%` }}
        >
          {label}
        </p>
        <div className="absolute inset-x-0 top-9 flex h-3">
          {habis ? (
            <span className="w-full bg-abu" />
          ) : (
            <>
              <span className="bg-hijau" style={{ width: `${batasWarn}%` }} />
              <span className="flex-1 bg-kuning" />
            </>
          )}
        </div>
        <span className="absolute top-7 h-7 w-0.5 -translate-x-1/2 bg-tinta" style={{ left: `${hariIni}%` }} />
      </div>
      <div className="flex justify-between gap-4 text-sm text-redup">
        <span>Serah terima {tanggalPendek(proyek.selesai_pada)}</span>
        <span>Berakhir {tanggalPendek(proyek.akhir_garansi)}</span>
      </div>
    </div>
  )
}

function MasaPemeliharaan({ proyek }) {
  let teks = 'Tanggal serah terima atau masa pemeliharaan belum tercatat di LPSE.'
  if (proyek.garansi === 'exp') {
    teks = `Masa pemeliharaan berakhir ${tanggal(proyek.akhir_garansi)}. Perbaikan kini menjadi tanggung jawab Dinas PU Bina Marga.`
  } else if (proyek.garansi) {
    teks = `${proyek.pelaksana ?? 'Kontraktor pelaksana'} wajib memperbaiki kerusakan di ruas ini tanpa anggaran baru sampai ${tanggal(proyek.akhir_garansi)}.`
  }

  return (
    <section className="flex flex-col gap-4">
      <Subjudul>Masa pemeliharaan</Subjudul>
      <p className="text-[17px] leading-normal text-redup">{teks}</p>
      {proyek.garansi && <BatangGaransi proyek={proyek} />}
      {proyek.garansi && proyek.sumber_url && (
        <p className="text-[13px] leading-normal text-redup">
          Perkiraan: LPSE tidak mencatat tanggal serah terima, jadi dihitung dari akhir tahun anggaran ditambah 12 bulan
          pemeliharaan. Akan diganti data resmi Dinas PU begitu tersedia.
        </p>
      )}
    </section>
  )
}

function UangDaerah({ proyek }) {
  const { data, error, loading, ulang } = useData(`/api/proyek/${proyek.slug}/riwayat`)
  const paket = data ?? []
  const total = paket.reduce((jumlah, p) => jumlah + (p.nilai_kontrak ?? 0), 0)
  const terbesar = Math.max(1, ...paket.map((p) => p.nilai_kontrak ?? 0))
  const tahun = paket.map((p) => p.tahun_anggaran).filter(Boolean)
  const rentang = tahun.length ? Math.max(...tahun) - Math.min(...tahun) + 1 : 0

  return (
    <section className="flex flex-col gap-4">
      <Subjudul aksi={<Tag />}>Uang daerah untuk ruas ini</Subjudul>
      <p className="text-[17px] leading-normal text-redup">
        Semua paket pekerjaan di {proyek.ruas}{proyek.sumber_url ? ' yang tercatat di LPSE Kabupaten Sidoarjo' : ''}, dijumlahkan.
      </p>
      <Muat loading={loading} error={error} onUlang={ulang} />
      {data && (
        <>
          <p className="flex flex-wrap items-end gap-x-3.5 gap-y-1">
            <span className="font-judul text-[44px] leading-none">{rupiahSingkat(total)}</span>
            <span className="text-base text-redup">
              {rentang > 1 ? `dalam ${rentang} tahun, ` : ''}dari {paket.length} paket pekerjaan
            </span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-t-[1.5px] border-tinta text-left text-[15px]">
              <thead>
                <tr className="border-b border-garis text-xs text-redup">
                  {['Tahun', 'Paket', 'Pelaksana', 'Nilai', 'Porsi'].map((k) => (
                    <th key={k} scope="col" className="py-3 pr-3 font-bold">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paket.map((p) => (
                  <tr key={p.slug} className="border-b border-garis">
                    <td className="w-[70px] py-3 pr-3">{p.tahun_anggaran ?? '—'}</td>
                    <td className="py-3 pr-3 font-semibold">
                      {p.sumber_url ? (
                        <a href={p.sumber_url} target="_blank" rel="noreferrer" className="underline decoration-garis underline-offset-2 hover:text-merah">
                          {p.kode_tender ?? 'Paket LPSE'}
                        </a>
                      ) : (
                        p.kode_tender ?? `Paket ${p.tahun_anggaran ?? ''}`.trim()
                      )}
                    </td>
                    <td className="py-3 pr-3">{p.pelaksana ?? '—'}</td>
                    <td className="whitespace-nowrap py-3 pr-3">{rupiahSingkat(p.nilai_kontrak)}</td>
                    <td className="w-[130px] py-3">
                      <span
                        className={`block h-2 rounded-full ${p.slug === proyek.slug ? 'bg-merah' : 'bg-isian'}`}
                        style={{ width: `${Math.max(5, ((p.nilai_kontrak ?? 0) / terbesar) * 110)}px` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {proyek.sumber_url && <p className="text-[13px] text-redup">Nilai kontrak diambil dari pengumuman pemenang LPSE Kabupaten Sidoarjo.</p>}
        </>
      )}
    </section>
  )
}

function hasilLaporan(laporan) {
  if (laporan.status === 'selesai' && laporan.selesai_pada) {
    const hari = Math.max(1, Math.round((new Date(laporan.selesai_pada) - new Date(laporan.dibuat_pada)) / HARI_MS))
    return `Beres dalam ${hari} hari`
  }
  return teksTenggat(laporan.tenggat_pada, laporan.status)
}

function LaporanRuas({ slug }) {
  const { data, error, loading, ulang } = useData(`/api/laporan?proyek=${encodeURIComponent(slug)}&limit=10`)

  return (
    <section>
      <div className="pb-4">
        <Subjudul aksi={<Tombol to={`/lapor?proyek=${slug}`} varian="merah" className="text-base">Lapor di ruas ini</Tombol>}>
          Laporan warga di ruas ini
        </Subjudul>
      </div>
      <Muat loading={loading} error={error} onUlang={ulang} />
      {data?.length === 0 && <p className="border-t border-garis py-6 text-sm text-redup">Belum ada laporan warga di ruas ini.</p>}
      <ul>
        {data?.map((l) => (
          <li key={l.kode} className="flex flex-col gap-5 border-t border-garis py-4 sm:flex-row">
            <Foto src={l.foto_url} alt={l.deskripsi} className="h-[110px] w-full shrink-0 sm:w-[160px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <StatusGaransi status="lap" label={LABEL_LAPORAN[l.status] ?? l.status} />
              <h3 className="text-lg font-bold">{l.deskripsi}</h3>
              <p className="text-sm text-redup">
                {l.status === 'selesai' ? 'Dikonfirmasi selesai' : `Laporan ${l.kode}`} · {waktuRelatif(l.dibuat_pada)}
              </p>
            </div>
            <p className={`shrink-0 text-sm font-bold ${l.telat ? 'text-oranye' : ''}`}>{hasilLaporan(l)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function DetailProyek() {
  const { slug } = useParams()
  const { data: proyek, error, loading, ulang } = useData(`/api/proyek/${encodeURIComponent(slug)}`)

  if (!proyek) {
    return (
      <div className="mx-auto max-w-konten px-4 py-20">
        {error?.message === 'Proyek tidak ditemukan' ? (
          <>
            <h1 className="font-judul text-4xl text-merah">Proyek tidak ditemukan</h1>
            <p className="mt-3 text-redup">Ruas ini tidak ada di data LPSE yang kami simpan.</p>
            <Tombol to="/peta" className="mt-6">Kembali ke peta proyek</Tombol>
          </>
        ) : (
          <Muat loading={loading} error={error} onUlang={ulang} />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto flex max-w-konten flex-col gap-3.5 px-4 pt-8">
        <nav aria-label="Jejak halaman" className="flex gap-2 text-sm">
          <Link to="/peta" className="font-semibold text-merah hover:underline">Peta proyek</Link>
          <span className="text-redup">/</span>
          <span className="text-redup" aria-current="page">{proyek.ruas}</span>
        </nav>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="font-judul text-[36px] leading-tight text-merah md:text-5xl">{proyek.ruas}</h1>
            <p className="text-base text-redup">
              {[proyek.lokasi, proyek.tahun_anggaran && `Paket ${proyek.tahun_anggaran}${proyek.sumber_url ? ' dari LPSE Kabupaten Sidoarjo' : ''}`].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusGaransi status={proyek.garansi} />
            <Tag />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-konten gap-12 px-4 pb-24 pt-8 lg:grid-cols-[1fr_420px]">
        <div className="flex min-w-0 flex-col gap-14">
          <Foto src="/foto/perbaikan-2.jpg" alt={`Suasana ${proyek.ruas}`} eager className="h-[260px] w-full sm:h-[400px]" />
          <MasaPemeliharaan proyek={proyek} />
          <UangDaerah proyek={proyek} />
          <LaporanRuas slug={proyek.slug} />
        </div>

        <aside className="row-start-1 flex flex-col gap-4 lg:sticky lg:top-24 lg:col-start-2 lg:self-start">
          <PapanProyek proyek={proyek} />
          <div className="flex flex-col items-start gap-2">
            <Tombol to={`/lapor?proyek=${proyek.slug}`} varian="merah" className="text-base">Lapor kerusakan di ruas ini</Tombol>
            {proyek.sumber_url && (
              <Tombol href={proyek.sumber_url} target="_blank" rel="noreferrer" varian="garis" className="text-base">
                Lihat dokumen tender di LPSE
              </Tombol>
            )}
          </div>
          <div className="flex flex-col gap-1.5 border-t border-garis pt-4 text-sm">
            <p className="font-bold">Sumber data</p>
            <p className="leading-normal text-redup">
              {proyek.sumber_url ? 'LPSE Kabupaten Sidoarjo dan opentender.net.' : 'Basis data proyek CekJalan.'}{proyek.updated_at ? ` Diperbarui ${tanggal(proyek.updated_at)}.` : ''}
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
