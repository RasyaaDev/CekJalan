import { Link, useParams } from 'react-router'
import NilaiRapor from '../components/NilaiRapor'
import { Foto, Muat, StatusGaransi, Tombol } from '../components/ui'
import { useData } from '../lib/api'
import { rupiahSingkat, tanggalPendek } from '../lib/format'

const BUANG = /^(pt|cv|ud|pd|koperasi)\.?$/i

function inisial(nama) {
  const kata = nama.split(/\s+/).filter((k) => !BUANG.test(k))
  return (kata.length ? kata : nama.split(/\s+/)).slice(0, 2).map((k) => k[0]).join('').toUpperCase()
}

function Angka({ nilai, label, warna = 'text-tinta', garis = true }) {
  return (
    <div className={`flex flex-1 flex-col gap-0.5 ${garis ? 'sm:border-l sm:border-[#d9d2cc] sm:pl-6' : ''}`}>
      <p className={`font-judul text-[36px] leading-[1.15] ${warna}`}>{nilai}</p>
      <p className="text-sm text-redup">{label}</p>
    </div>
  )
}

function Kartu({ judul, children }) {
  return (
    <section className="rounded-md border border-[#d9d2cc] bg-white px-[22px] pb-1.5 pt-[22px]">
      <h2 className="pb-2.5 font-judul text-[22px] leading-tight">{judul}</h2>
      {children}
    </section>
  )
}

function hasilLaporan(l) {
  if (!l.jatuh_tempo) return ['Sedang dikerjakan', 'text-oranye', 'bg-oranye']
  if (l.tepat) {
    return l.selisih_hari > 0
      ? [`Selesai ${l.selisih_hari} hari lebih cepat`, 'text-hijau', 'bg-hijau']
      : ['Selesai tepat waktu', 'text-hijau', 'bg-hijau']
  }
  return [`Terlambat ${Math.abs(l.selisih_hari ?? 0)} hari`, 'text-[#b3261e]', 'bg-[#b3261e]']
}

export default function ProfilKontraktor() {
  const { id } = useParams()
  const { data: k, error, loading, ulang } = useData(`/api/kontraktor/${encodeURIComponent(id)}`)

  if (!k) {
    return (
      <div className="mx-auto max-w-konten px-4 py-20">
        <Muat loading={loading} error={error} onUlang={ulang} />
      </div>
    )
  }

  const proyekGaransi = k.proyek.find((p) => p.garansi === 'ok' || p.garansi === 'warn')
  const foto = k.laporan.filter((l) => l.foto_url).slice(0, 3)

  return (
    <div className="mx-auto flex max-w-konten flex-col gap-7 px-4 pb-24 pt-10">
      <nav aria-label="Jejak halaman" className="flex gap-1.5 text-[13px]">
        <Link to="/rapor" className="font-semibold text-oranye hover:underline">Rapor kontraktor</Link>
        <span className="text-redup">/</span>
        <span className="text-redup" aria-current="page">{k.nama}</span>
      </nav>

      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-tinta font-judul text-[32px] text-white">{inisial(k.nama)}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="font-judul text-[34px] leading-[1.15] text-merah md:text-[40px]">{k.nama}</h1>
          <p className="text-[15px] leading-normal text-redup">
            Kontraktor jalan · Kabupaten Sidoarjo · {k.paket} proyek tercatat di LPSE{k.tahun_awal ? ` sejak ${k.tahun_awal}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3.5 self-start rounded-lg bg-sorot py-3.5 pl-4 pr-5 md:self-auto">
          <NilaiRapor nilai={k.nilai} className="size-14 text-[32px]" />
          <div className="leading-normal">
            <p className="text-lg font-bold">{k.nilai ? `Rapor ${k.nilai}` : 'Belum dinilai'}</p>
            <p className="text-[13px] text-redup">
              {k.peringkat ? `Peringkat ${k.peringkat} dari ${k.jumlah_kontraktor} kontraktor` : 'Belum ada laporan yang jatuh tempo'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:flex">
        <Angka nilai={k.paket} label="proyek jalan" garis={false} />
        <Angka nilai={rupiahSingkat(k.nilai_kontrak).replace(' miliar', ' M').replace(' juta', ' jt')} label="total nilai kontrak" />
        <Angka nilai={k.laporan_garansi} label="laporan selama garansi" warna="text-oranye" />
        <Angka nilai={k.persen_tepat == null ? '—' : `${k.persen_tepat}%`} label="diperbaiki tepat waktu" warna="text-hijau" />
      </div>

      <div className="grid gap-7 lg:grid-cols-[1fr_400px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Kartu judul="Proyek yang dikerjakan">
            <ul>
              {k.proyek.map((p) => (
                <li key={p.slug} className="border-t border-[#d9d2cc]">
                  <Link to={`/proyek/${p.slug}`} className="flex items-center gap-4 py-3.5 hover:bg-beton">
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-normal">
                      <span className="truncate text-[15px] font-bold">{[p.ruas, p.tahun_anggaran].filter(Boolean).join(' ')}</span>
                      <span className="text-[13px] text-redup">{rupiahSingkat(p.nilai_kontrak)} · {p.laporan} laporan selama garansi</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusGaransi status={p.garansi} />
                      {p.akhir_garansi && (
                        <span className="text-xs text-redup">{p.garansi === 'exp' ? 'sejak' : 'sampai'} {tanggalPendek(p.akhir_garansi)}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Kartu>

          <Kartu judul="Riwayat perbaikan laporan warga">
            {k.laporan.length === 0 && <p className="border-t border-[#d9d2cc] py-4 text-sm text-redup">Belum ada laporan selama masa pemeliharaan.</p>}
            <ul>
              {k.laporan.map((l) => {
                const [teks, warna, titik] = hasilLaporan(l)
                return (
                  <li key={l.kode} className="border-t border-[#d9d2cc]">
                    <Link to={`/lacak/${l.kode}`} className="flex items-center gap-3 py-3 hover:bg-beton">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-normal">
                        <span className="truncate text-[15px] font-bold">{l.kode} · {l.deskripsi}</span>
                        <span className="text-[13px] text-redup">{l.ruas ?? '—'} · masuk {tanggalPendek(l.dibuat_pada).split(' ').slice(0, 2).join(' ')}</span>
                      </span>
                      <span className={`flex shrink-0 items-center gap-1.5 text-[13px] font-semibold ${warna}`}>
                        <span className={`size-2.5 rounded-full ${titik}`} />
                        {teks}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Kartu>

          {foto.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold">Foto dari laporan warga</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {foto.map((l) => (
                  <figure key={l.kode} className="flex flex-col gap-2">
                    <Foto src={l.foto_url} alt={l.deskripsi} className="h-[220px] w-full" />
                    <figcaption className="text-sm text-redup">{l.deskripsi}{l.ruas ? `, ${l.ruas}` : ''}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-md border border-[#d9d2cc] bg-white px-[22px] pb-3 pt-[22px]">
            <h2 className="pb-2.5 font-judul text-[22px] leading-tight">{k.nilai ? `Kenapa nilainya ${k.nilai}?` : 'Cara menilai'}</h2>
            <dl className="text-sm leading-normal">
              {[
                ['Tepat waktu', k.persen_tepat == null ? '—' : `${k.persen_tepat}%`, 'text-hijau'],
                ['Laporan per proyek', k.paket ? `${(k.laporan_garansi / k.paket).toFixed(1).replace('.', ',')} laporan` : '—'],
                ['Ditolak warga', `${k.ditolak} kali`],
                ['Respons pertama', k.respons_hari == null ? '—' : `rata-rata ${String(k.respons_hari).replace('.', ',')} hari`],
              ].map(([a, b, warna]) => (
                <div key={a} className="flex gap-3 border-t border-[#d9d2cc] py-2.5">
                  <dt className="w-[170px] shrink-0 text-redup">{a}</dt>
                  <dd className={`font-bold ${warna ?? ''}`}>{b}</dd>
                </div>
              ))}
            </dl>
            <p className="pt-2 text-[13px] leading-normal text-redup">Dihitung dari laporan yang masuk selama masa pemeliharaan proyek.</p>
          </section>

          <section className="flex flex-col gap-3 rounded-md bg-sorot p-[22px]">
            <h2 className="font-judul text-[22px] leading-tight">Lihat kerusakan di proyeknya?</h2>
            <p className="text-sm leading-normal text-redup">
              {proyekGaransi
                ? `Selama masih garansi, perbaikannya jadi tanggung jawab ${k.nama}.`
                : 'Semua proyek kontraktor ini sudah lewat masa garansi. Laporan tetap diteruskan ke Dinas PU.'}
            </p>
            <Tombol to={proyekGaransi ? `/lapor?proyek=${proyekGaransi.slug}` : '/lapor'} className="w-full text-base">Lapor kerusakan</Tombol>
            {proyekGaransi && (
              <Tombol to={`/pantau/${proyekGaransi.slug}`} varian="garis" className="w-full text-base">Pantau ruas proyeknya</Tombol>
            )}
            {k.proyek[0]?.sumber_url && (
              <a href={k.proyek[0].sumber_url} target="_blank" rel="noreferrer" className="text-center text-sm font-semibold text-oranye hover:underline">
                Lihat dokumen tender di LPSE
              </a>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
