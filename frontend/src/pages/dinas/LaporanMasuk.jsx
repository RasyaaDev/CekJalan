import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Foto, Muat, StatusGaransi } from '../../components/ui'
import { BarisAngka, Galat, JudulDinas, Pilih, Tab, gayaTombol, labelStatus, sisaTenggat } from '../../components/dinas'
import { usePetugas } from '../../components/LayoutDinas'
import PetaTitik from '../../components/PetaTitik'
import { kirim, useData } from '../../lib/api'
import { jam, tanggal } from '../../lib/format'

const TAB = [
  ['semua', 'Semua'],
  ['verifikasi', 'Perlu verifikasi'],
  ['diteruskan', 'Diteruskan'],
  ['dikerjakan', 'Dikerjakan'],
  ['telat', 'Lewat tenggat'],
]

const PERLU_VERIFIKASI = ['masuk', 'perlu_foto_ulang']

function tautan(l) {
  return PERLU_VERIFIKASI.includes(l.status) || l.status === 'ditolak' ? `/dinas/laporan/${l.kode}` : `/dinas/laporan/${l.kode}/perbaikan`
}

function Pratinjau({ laporan, onBerubah }) {
  const navigate = useNavigate()
  const [proses, setProses] = useState({ jalan: false, galat: null })
  const perlu = PERLU_VERIFIKASI.includes(laporan.status)

  async function teruskan() {
    setProses({ jalan: true, galat: null })
    try {
      await kirim(`/api/dinas/laporan/${laporan.kode}/verifikasi`, { body: { aksi: 'teruskan' } })
      setProses({ jalan: false, galat: null })
      onBerubah()
    } catch (galat) {
      setProses({ jalan: false, galat: galat.message })
    }
  }

  return (
    <aside className="flex flex-col gap-4 self-start rounded-md border border-garis-dinas bg-white p-5 xl:sticky xl:top-6">
      <p className="text-[13px] text-redup">{laporan.kode} · masuk {jam(laporan.dibuat_pada)}</p>
      <h2 className="font-judul text-xl leading-tight">{laporan.deskripsi}</h2>
      <Foto src={laporan.foto_url} alt={`Foto laporan ${laporan.kode}`} className="aspect-[4/2.5] w-full" />
      <PetaTitik className="h-[150px]" titik={[{ label: 'Titik laporan', posisi: laporan.lat != null ? [laporan.lat, laporan.lng] : null, warna: '#9F1717' }]} />
      <div className="flex flex-col gap-2 rounded bg-sorot p-3.5 text-sm">
        {laporan.proyek ? (
          <>
            <p className="text-xs text-redup">Cocok dengan proyek</p>
            <p className="font-bold">{[laporan.proyek.ruas, laporan.proyek.tahun].filter(Boolean).join(' ')}</p>
            <p className="flex flex-wrap items-center gap-2">
              <StatusGaransi status={laporan.garansi} />
              {laporan.akhir_garansi && <span className="text-xs text-redup">sampai {tanggal(laporan.akhir_garansi)}</span>}
            </p>
          </>
        ) : (
          <p className="text-xs text-redup">Belum cocok dengan proyek mana pun</p>
        )}
        <p className="font-semibold">Penanggung jawab perbaikan: {laporan.penanggung_jawab}</p>
      </div>
      <Galat>{proses.galat}</Galat>
      {perlu ? (
        <div className="flex flex-col items-start gap-3">
          <button type="button" onClick={teruskan} disabled={proses.jalan} className={gayaTombol.utama}>
            {proses.jalan ? 'Memproses…' : 'Verifikasi dan teruskan'}
          </button>
          <Link to={`/dinas/laporan/${laporan.kode}`} className={gayaTombol.garis}>Periksa detail atau tolak</Link>
        </div>
      ) : (
        <button type="button" onClick={() => navigate(tautan(laporan))} className={`${gayaTombol.garis} self-start`}>
          {laporan.status === 'ditolak' ? 'Lihat alasan penolakan' : 'Buka tiket perbaikan'}
        </button>
      )}
      <p className="text-xs text-redup">Identitas pelapor disembunyikan dari petugas.</p>
    </aside>
  )
}

export default function LaporanMasuk() {
  const [param, setParam] = useSearchParams()
  const { segarkan } = usePetugas()
  const tab = param.get('tab') ?? 'semua'
  const kecamatan = param.get('kecamatan') ?? ''
  const query = new URLSearchParams({ tab, ...(kecamatan && { kecamatan }) }).toString()
  const ringkasan = useData('/api/dinas/ringkasan')
  const daftar = useData(`/api/dinas/laporan?${query}`)
  const [pilih, setPilih] = useState(null)

  const laporan = daftar.data?.laporan ?? []
  const terpilih = laporan.find((l) => l.kode === pilih) ?? laporan[0]
  const r = ringkasan.data

  function ubah(kunci, nilai) {
    const baru = new URLSearchParams(param)
    if (nilai && !(kunci === 'tab' && nilai === 'semua')) baru.set(kunci, nilai)
    else baru.delete(kunci)
    setParam(baru)
    setPilih(null)
  }

  function berubah() {
    daftar.ulang()
    ringkasan.ulang()
    segarkan()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <JudulDinas sub={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>
          Laporan masuk
        </JudulDinas>
        <div className="flex flex-wrap gap-3">
          <Pilih label="Kecamatan" value={kecamatan} onChange={(v) => ubah('kecamatan', v)}>
            <option value="">Semua kecamatan</option>
            {(daftar.data?.kecamatan ?? []).map((k) => <option key={k}>{k}</option>)}
          </Pilih>
          <a href={`/api/dinas/laporan.csv?${query}`} className={gayaTombol.garis}>Unduh CSV</a>
        </div>
      </div>

      <BarisAngka
        isi={[
          [r?.masuk_hari_ini, 'masuk hari ini'],
          [r?.perlu_verifikasi, 'menunggu verifikasi'],
          [r?.lewat_tenggat, 'lewat tenggat', 'text-oranye'],
          [r?.selesai_bulan_ini, `selesai bulan ini${r ? `, ${r.ditolak_warga_bulan_ini} ditolak warga` : ''}`, 'text-hijau'],
        ]}
      />

      <Tab pilihan={TAB} aktif={tab} onPilih={(t) => ubah('tab', t)} />

      <Muat loading={daftar.loading} error={daftar.error} onUlang={daftar.ulang} />
      {daftar.data && !laporan.length && <p className="py-6 text-sm text-redup">Tidak ada laporan di tab ini.</p>}

      {laporan.length > 0 && (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b-2 border-tinta text-xs text-redup">
                <tr>
                  <th className="py-2.5 font-semibold">Foto</th>
                  <th className="py-2.5 font-semibold">Laporan</th>
                  <th className="py-2.5 font-semibold">Garansi</th>
                  <th className="py-2.5 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold">Penanggung jawab</th>
                </tr>
              </thead>
              <tbody>
                {laporan.map((l) => {
                  const tenggat = sisaTenggat(l)
                  const aktif = l.kode === terpilih?.kode
                  return (
                    <tr
                      key={l.kode}
                      onClick={() => setPilih(l.kode)}
                      className={`cursor-pointer border-b border-garis-dinas ${aktif ? 'bg-sorot' : 'hover:bg-white'}`}
                    >
                      <td className="py-2.5 pr-3">
                        <Foto src={l.foto_url} alt="" className="h-10 w-14" />
                      </td>
                      <td className="py-2.5 pr-3">
                        <Link to={tautan(l)} onClick={(e) => e.stopPropagation()} className="font-bold hover:underline">{l.kode}</Link>
                        <p className="text-xs text-redup">{[l.proyek?.ruas, l.label_jenis].filter(Boolean).join(' · ')}</p>
                      </td>
                      <td className="py-2.5 pr-3"><StatusGaransi status={l.garansi} className="!text-[13px]" /></td>
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold">{labelStatus(l)}</p>
                        <p className={`text-xs ${tenggat.telat ? 'font-semibold text-oranye' : 'text-redup'}`}>{tenggat.teks}</p>
                      </td>
                      <td className="py-2.5">{l.penanggung_jawab}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {daftar.data.total > laporan.length && (
              <p className="pt-3 text-xs text-redup">Menampilkan {laporan.length} dari {daftar.data.total} laporan. Unduh CSV untuk daftar lengkap.</p>
            )}
          </div>
          {terpilih && <Pratinjau key={terpilih.kode} laporan={terpilih} onBerubah={berubah} />}
        </div>
      )}
    </div>
  )
}
