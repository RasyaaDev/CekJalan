import { useMemo, useState } from 'react'
import { Muat } from '../../components/ui'
import { Galat, JudulDinas, Kartu, Pilih, gayaTombol } from '../../components/dinas'
import { kirim, useData } from '../../lib/api'
import { tanggalPendek } from '../../lib/format'

const JENIS = [
  ['rekap', 'Rekap bulanan', 'Laporan masuk, selesai, dan lewat tenggat per kecamatan'],
  ['rapor', 'Rapor kontraktor', 'Nilai dan catatan setiap kontraktor'],
  ['garansi', 'Status garansi proyek', 'Proyek yang hampir dan sudah habis masa garansinya'],
]

function daftarBulan() {
  const hasil = []
  const d = new Date()
  d.setDate(1)
  for (let i = 0; i < 12; i++) {
    hasil.push([d.toLocaleDateString('sv').slice(0, 7), d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })])
    d.setMonth(d.getMonth() - 1)
  }
  return hasil
}

function Pratinjau({ bulan, namaBulan, kecamatan }) {
  const query = new URLSearchParams({ bulan, ...(kecamatan && { kecamatan }) }).toString()
  const { data, error, loading, ulang } = useData(`/api/dinas/ekspor/rekap?${query}`)
  if (!data) return <Muat loading={loading} error={error} onUlang={ulang} />
  const maks = Math.max(1, ...data.per_kecamatan.map((k) => k.masuk))

  return (
    <article id="cetak" className="flex flex-col gap-5 rounded border border-garis-dinas bg-white p-7 text-tinta">
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold tracking-wide text-redup">DINAS PU BINA MARGA KABUPATEN SIDOARJO</p>
        <h3 className="font-judul text-xl text-navy">Rekap Laporan Kerusakan Jalan</h3>
        <p className="text-xs text-redup">
          Periode {namaBulan}{kecamatan ? ` · Kecamatan ${kecamatan}` : ''} · dibuat {tanggalPendek(new Date().toISOString())}
        </p>
      </header>
      <dl className="grid grid-cols-4 gap-2">
        {[
          [data.ringkasan.masuk, 'masuk'],
          [data.ringkasan.selesai, 'selesai'],
          [data.ringkasan.dikerjakan, 'dikerjakan'],
          [data.ringkasan.telat, 'lewat tenggat'],
        ].map(([n, l]) => (
          <div key={l} className="rounded bg-kanvas p-2.5">
            <dd className="text-lg font-bold">{n}</dd>
            <dt className="text-[11px] text-redup">{l}</dt>
          </div>
        ))}
      </dl>
      <section className="flex flex-col gap-2">
        <h4 className="text-xs font-bold">Laporan per kecamatan</h4>
        {data.per_kecamatan.length ? (
          data.per_kecamatan.map((k) => (
            <div key={k.kecamatan} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-[11px]">
              <span className="truncate">{k.kecamatan}</span>
              <span className="h-2 rounded-full bg-kanvas">
                <span className="block h-full rounded-full bg-navy" style={{ width: `${(k.masuk / maks) * 100}%` }} />
              </span>
              <span>{k.masuk} masuk · {k.selesai} selesai</span>
            </div>
          ))
        ) : (
          <p className="text-[11px] text-redup">Tidak ada laporan di periode ini.</p>
        )}
      </section>
      <section className="flex flex-col gap-1.5">
        <h4 className="text-xs font-bold">Daftar laporan lewat tenggat</h4>
        {data.daftar_telat.length ? (
          <table className="w-full text-left text-[11px]">
            <tbody>
              {data.daftar_telat.map((l) => (
                <tr key={l.kode} className="border-t border-garis-dinas">
                  <td className="py-1.5 font-semibold">{l.kode}</td>
                  <td className="py-1.5">{l.ruas ?? '–'}</td>
                  <td className="py-1.5">{l.penanggung_jawab}</td>
                  <td className="py-1.5 text-right">tenggat {tanggalPendek(l.tenggat_pada)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[11px] text-redup">Tidak ada laporan lewat tenggat.</p>
        )}
      </section>
    </article>
  )
}

export default function EksporData() {
  const bulanPilihan = useMemo(daftarBulan, [])
  const [jenis, setJenis] = useState('rekap')
  const [bulan, setBulan] = useState(bulanPilihan[0][0])
  const [kecamatan, setKecamatan] = useState('')
  const [format, setFormat] = useState('pdf')
  const [galat, setGalat] = useState(null)
  const riwayat = useData('/api/dinas/ekspor/riwayat')
  const daftarKecamatan = useData('/api/dinas/laporan?tab=verifikasi')
  const namaBulan = bulanPilihan.find(([k]) => k === bulan)?.[1]
  const pdfBisa = jenis === 'rekap'
  const formatAktif = pdfBisa ? format : 'csv'

  async function buat(e) {
    e.preventDefault()
    setGalat(null)
    if (formatAktif === 'pdf') {
      try {
        await kirim('/api/dinas/ekspor/log', { body: { nama_berkas: `Rekap ${namaBulan}${kecamatan ? ` ${kecamatan}` : ''}.pdf` } })
      } catch (err) {
        setGalat(err.message)
        return
      }
      window.print()
    } else {
      const query = new URLSearchParams({ ...(jenis === 'rekap' && { bulan }), ...(kecamatan && { kecamatan }) }).toString()
      window.location.href = `/api/dinas/ekspor/${jenis}.csv?${query}`
    }
    setTimeout(riwayat.ulang, 800)
  }

  return (
    <div className="flex flex-col gap-6">
      <JudulDinas sub="Buat laporan untuk pimpinan, DPRD, atau inspektorat">Ekspor data</JudulDinas>
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1fr_300px]">
        <form onSubmit={buat} className="flex flex-col gap-5 rounded-md border border-garis-dinas bg-white p-6">
          <h2 className="font-judul text-xl">Buat laporan</h2>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-[13px] font-semibold">Jenis laporan</legend>
            {JENIS.map(([k, judul, isi]) => (
              <label key={k} className={`flex cursor-pointer gap-3 rounded border p-3.5 ${jenis === k ? 'border-oranye bg-sorot' : 'border-garis-dinas'}`}>
                <input type="radio" name="jenis" value={k} checked={jenis === k} onChange={() => setJenis(k)} className="mt-1 accent-oranye" />
                <span className="flex flex-col">
                  <span className="text-[15px] font-bold">{judul}</span>
                  <span className="text-[13px] text-redup">{isi}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold">Periode</span>
              <Pilih label="Periode" value={bulan} onChange={setBulan}>
                {bulanPilihan.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Pilih>
              {jenis !== 'rekap' && <span className="text-xs text-redup">Rapor dan garansi memakai data terbaru.</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold">Kecamatan</span>
              <Pilih label="Kecamatan" value={kecamatan} onChange={setKecamatan}>
                <option value="">Semua</option>
                {(daftarKecamatan.data?.kecamatan ?? []).map((k) => <option key={k}>{k}</option>)}
              </Pilih>
            </div>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-semibold">Format</legend>
            <div className="flex gap-2">
              {[['pdf', 'PDF'], ['csv', 'CSV']].map(([k, l]) => (
                <label key={k} className={`rounded border px-4 py-2 text-sm font-semibold ${formatAktif === k ? 'border-navy bg-navy text-white' : 'border-garis-dinas'} ${k === 'pdf' && !pdfBisa ? 'opacity-40' : 'cursor-pointer'}`}>
                  <input type="radio" name="format" value={k} checked={formatAktif === k} disabled={k === 'pdf' && !pdfBisa} onChange={() => setFormat(k)} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
            <span className="text-xs text-redup">CSV bisa dibuka langsung di Excel.</span>
          </fieldset>
          <Galat>{galat}</Galat>
          <button type="submit" className={`${gayaTombol.utama} self-start`}>{formatAktif === 'pdf' ? 'Cetak / simpan PDF' : 'Unduh CSV'}</button>
        </form>

        <div className="flex flex-col gap-3">
          <p className="text-center text-[13px] text-redup">Pratinjau</p>
          {jenis === 'rekap' ? (
            <Pratinjau bulan={bulan} namaBulan={namaBulan} kecamatan={kecamatan} />
          ) : (
            <p className="rounded border border-dashed border-garis-dinas p-6 text-center text-sm text-redup">Pratinjau tersedia untuk rekap bulanan. Jenis ini diunduh sebagai CSV.</p>
          )}
        </div>

        <Kartu judul="Riwayat ekspor">
          {riwayat.data?.length ? (
            <ul className="flex flex-col">
              {riwayat.data.map((r, i) => (
                <li key={i} className="flex flex-col gap-0.5 border-t border-garis-dinas py-3">
                  <span className="text-sm font-semibold">{r.nama_berkas}</span>
                  <span className="text-xs text-redup">{r.petugas} · {tanggalPendek(r.dibuat_pada)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Muat loading={riwayat.loading} error={riwayat.error} onUlang={riwayat.ulang} />
          )}
          {riwayat.data && !riwayat.data.length && <p className="text-sm text-redup">Belum ada ekspor.</p>}
        </Kartu>
      </div>
    </div>
  )
}
