import { Ikon, Muat } from '../components/ui'
import { useData } from '../lib/api'
import { rupiahSingkat } from '../lib/format'

const DATASET = [
  ['Proyek jalan dan masa garansi', 'Ruas, kontraktor, nilai kontrak, lokasi, tanggal selesai, dan akhir masa pemeliharaan.', ['proyek.csv', 'proyek.geojson']],
  ['Laporan kerusakan terverifikasi', 'Titik lokasi, jenis kerusakan, status perbaikan, dan proyek terkait. Data pelapor tidak disertakan.', ['laporan.csv', 'laporan.geojson']],
  ['Rapor kontraktor', 'Jumlah laporan selama garansi, waktu perbaikan, dan persentase tepat waktu.', ['kontraktor.csv']],
]

function Kartu({ judul, sub, children, className = '' }) {
  return (
    <section className={`flex flex-col rounded-md border border-[#d9d2cc] bg-white px-6 pt-6 ${className}`}>
      <h2 className="font-judul text-[22px] leading-tight">{judul}</h2>
      {sub && <p className="text-[13px] leading-normal text-redup">{sub}</p>}
      {children}
    </section>
  )
}

function warnaBatang(i) {
  if (i < 2) return 'bg-merah'
  if (i < 4) return 'bg-oranye'
  return 'bg-[#e2a07a]'
}

function warnaPersen(persen) {
  if (persen == null) return 'text-redup'
  if (persen >= 90) return 'text-hijau'
  if (persen >= 70) return 'text-oranye'
  return 'text-[#b3261e]'
}

export default function DataTerbuka() {
  const { data, error, loading, ulang } = useData('/api/statistik')
  const tertinggi = Math.max(1, ...(data?.per_kecamatan ?? []).map((k) => k.jumlah))
  const asal = typeof window === 'undefined' ? '' : window.location.origin

  return (
    <div className="mx-auto flex max-w-konten flex-col gap-8 px-4 pb-24 pt-12">
      <div className="flex flex-col gap-2.5">
        <p className="flex items-center gap-2 text-sm font-bold text-oranye">
          <Ikon nama="database" className="size-[18px]" />
          Open Government Data
        </p>
        <h1 className="font-judul text-[34px] leading-[1.15] text-merah md:text-[40px]">Data terbuka CekJalan</h1>
        <p className="max-w-[820px] text-[17px] leading-normal text-redup">
          Data proyek jalan, laporan terverifikasi, dan rapor kontraktor bisa diunduh dan dipakai ulang oleh siapa saja. Sumber: LPSE dan opentender.net.
        </p>
      </div>

      <Muat loading={loading} error={error} onUlang={ulang} />

      {data && (
        <>
          <dl className="grid grid-cols-2 gap-6 md:flex">
            {[
              [data.proyek, 'proyek jalan tercatat', 'text-tinta'],
              [rupiahSingkat(data.nilai_kontrak).replace(' miliar', ' M').replace(' juta', ' jt'), 'total nilai kontrak', 'text-tinta'],
              [data.laporan_terverifikasi, 'laporan terverifikasi', 'text-oranye'],
              [data.rata_hari_perbaikan == null ? '—' : `${String(data.rata_hari_perbaikan).replace('.', ',')} hari`, 'rata-rata waktu perbaikan', 'text-hijau'],
            ].map(([nilai, label, warna], i) => (
              <div key={label} className={`flex flex-1 flex-col-reverse gap-0.5 ${i ? 'md:border-l md:border-[#d9d2cc] md:pl-6' : ''}`}>
                <dt className="text-sm text-redup">{label}</dt>
                <dd className={`font-judul text-[36px] leading-[1.15] ${warna}`}>{nilai}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-6 lg:grid-cols-2">
            <Kartu judul="Laporan per kecamatan" sub="Laporan terverifikasi, 30 hari terakhir" className="gap-3.5 pb-6">
              {data.per_kecamatan.length === 0 && <p className="text-sm text-redup">Belum ada laporan terverifikasi dalam 30 hari terakhir.</p>}
              {data.per_kecamatan.map((k, i) => (
                <div key={k.kecamatan} className="flex items-center gap-3">
                  <p className="w-[110px] shrink-0 truncate text-sm">{k.kecamatan}</p>
                  <span className="relative h-3.5 flex-1 overflow-hidden rounded-[3px] bg-[#f1ece8]">
                    <span className={`absolute inset-y-0 left-0 rounded-[3px] ${warnaBatang(i)}`} style={{ width: `${(k.jumlah / tertinggi) * 100}%` }} />
                  </span>
                  <p className="w-8 shrink-0 text-right text-sm font-bold">{k.jumlah}</p>
                </div>
              ))}
            </Kartu>

            <Kartu judul="Kinerja kontraktor" sub="Proyek yang sedang atau pernah dalam masa garansi" className="pb-2">
              <table className="mt-3 w-full text-left text-sm leading-normal">
                <thead>
                  <tr className="text-xs font-semibold text-redup">
                    <th scope="col" className="py-2 font-semibold">Kontraktor</th>
                    <th scope="col" className="w-[60px] py-2 text-right font-semibold">Proyek</th>
                    <th scope="col" className="w-[110px] py-2 text-right font-semibold">Laporan garansi</th>
                    <th scope="col" className="w-[90px] py-2 text-right font-semibold">Tepat waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kontraktor.length === 0 && (
                    <tr><td colSpan={4} className="border-t border-[#d9d2cc] py-3 text-redup">Belum ada laporan selama masa garansi.</td></tr>
                  )}
                  {data.kontraktor.map((k) => (
                    <tr key={k.id} className="border-t border-[#d9d2cc]">
                      <td className="py-[11px] font-semibold"><a href={`/rapor/${k.id}`} className="hover:text-merah">{k.nama}</a></td>
                      <td className="text-right">{k.paket}</td>
                      <td className="text-right">{k.laporan_garansi}</td>
                      <td className={`text-right font-bold ${warnaPersen(k.persen_tepat)}`}>{k.persen_tepat == null ? '—' : `${k.persen_tepat}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Kartu>
          </div>
        </>
      )}

      <Kartu judul="Unduh dataset" className="pb-2">
        <ul className="mt-3">
          {DATASET.map(([judul, isi, berkas]) => (
            <li key={judul} className="flex flex-col gap-3 border-t border-[#d9d2cc] py-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-normal">
                <p className="text-[15px] font-bold">{judul}</p>
                <p className="text-sm text-redup">{isi}</p>
              </div>
              <div className="flex gap-2">
                {berkas.map((b) => (
                  <a
                    key={b}
                    href={`/api/ekspor/${b}`}
                    download
                    className="flex items-center gap-1.5 rounded border-[1.5px] border-oranye py-[7px] pl-2.5 pr-3 text-[13px] font-bold text-oranye hover:bg-sorot"
                  >
                    <Ikon nama="unduh" className="size-3.5" />
                    {b.endsWith('.csv') ? 'CSV' : 'GeoJSON'}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Kartu>

      <section className="flex flex-col gap-6 rounded-md bg-tinta px-7 py-6 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col gap-1.5">
          <h2 className="font-judul text-[22px] leading-tight text-white">API publik</h2>
          <p className="text-sm leading-normal text-[#d9c9c2]">Tanpa kunci akses. Data bisa dipakai ulang dengan menyebut CekJalan sebagai sumber.</p>
        </div>
        <pre className="overflow-x-auto rounded bg-[#1c0f0d] px-[18px] py-3.5 text-sm leading-normal text-kuning">
          {`GET  ${asal}/api/proyek?status=warn\nGET  ${asal}/api/laporan?status=dikerjakan`}
        </pre>
      </section>
    </div>
  )
}
