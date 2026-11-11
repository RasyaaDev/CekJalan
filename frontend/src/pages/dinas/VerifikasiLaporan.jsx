import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BarisCek, Foto, Muat } from '../../components/ui'
import { Daftar, Galat, JudulDinas, Kartu, Lencana, gayaTombol, labelStatus } from '../../components/dinas'
import { usePetugas } from '../../components/LayoutDinas'
import PetaTitik from '../../components/PetaTitik'
import { kirim, useData } from '../../lib/api'
import { tanggalJam } from '../../lib/format'

const PERLU = ['masuk', 'perlu_foto_ulang']

const koordinat = (lat, lng) =>
  lat == null || lng == null ? 'Tidak ada' : `${Number(lat).toFixed(5).replace('.', ',')}; ${Number(lng).toFixed(5).replace('.', ',')}`

function selisihMenit(foto, kirim) {
  if (!foto || !kirim) return null
  const menit = Math.round((new Date(kirim) - new Date(foto)) / 60_000)
  if (menit < 1) return 'kurang dari 1 menit sebelum dikirim'
  if (menit < 60) return `${menit} menit sebelum dikirim`
  return `${Math.round(menit / 60)} jam sebelum dikirim`
}

function Pengecekan({ laporan }) {
  const cek = laporan.cek_foto?.cek ?? []
  const lokasi = cek.find((c) => c.kode === 'lokasi')
  const waktu = cek.find((c) => c.kode === 'waktu')
  const asli = cek.find((c) => c.kode === 'asli')
  const duplikat = cek.find((c) => c.kode === 'duplikat')
  const garansi = laporan.garansi === 'ok' || laporan.garansi === 'warn'
  const sisa = laporan.akhir_garansi ? Math.ceil((new Date(laporan.akhir_garansi) - Date.now()) / 86_400_000) : null
  const dekat = laporan.dekat?.[0]

  return (
    <ul className="flex flex-col gap-4">
      {lokasi && (
        <BarisCek status={lokasi.lolos ? 'ok' : 'gagal'} judul={lokasi.lolos ? 'Geotag cocok' : 'Geotag tidak cocok'}>
          {lokasi.jarak_m != null ? `${lokasi.jarak_m} m dari titik laporan, batas maksimal 50 m.` : lokasi.detail}
        </BarisCek>
      )}
      {waktu && (
        <BarisCek status={waktu.lolos ? 'ok' : 'gagal'} judul={waktu.lolos ? 'Foto baru' : 'Foto lama'}>
          {selisihMenit(waktu.diambil_pada, laporan.dibuat_pada) ? `Diambil ${selisihMenit(waktu.diambil_pada, laporan.dibuat_pada)}.` : waktu.detail}
        </BarisCek>
      )}
      {asli && !asli.lolos && <BarisCek status="gagal" judul="Bukan foto kamera">{asli.detail}</BarisCek>}
      {duplikat && !duplikat.lolos && <BarisCek status="gagal" judul="Foto pernah dipakai">{duplikat.detail}</BarisCek>}
      {!cek.length && <BarisCek status="waspada" judul="Belum ada hasil cek foto">Laporan ini masuk sebelum cek foto otomatis aktif. Periksa fotonya manual.</BarisCek>}
      <BarisCek status={garansi ? 'ok' : 'waspada'} judul={garansi ? 'Ruas dalam masa garansi' : laporan.proyek ? 'Garansi ruas sudah habis' : 'Belum cocok dengan proyek'}>
        {laporan.proyek
          ? [laporan.proyek.ruas, laporan.proyek.tahun, laporan.proyek.kontraktor, garansi && sisa != null && sisa >= 0 ? `tinggal ${sisa} hari` : 'perbaikan memakai anggaran Dinas PU']
              .filter(Boolean)
              .join(' · ')
          : 'Perbaikan jadi tanggungan Dinas PU.'}
      </BarisCek>
      {dekat && (
        <BarisCek status="waspada" judul="Mungkin laporan ganda">
          <Link to={`/dinas/laporan/${dekat.kode}`} className="font-semibold underline">{dekat.kode}</Link> berjarak {dekat.jarak_m} m. Tolak jika kerusakannya sama.
        </BarisCek>
      )}
    </ul>
  )
}

function Keputusan({ laporan, onSelesai }) {
  const [catatan, setCatatan] = useState('')
  const [proses, setProses] = useState({ jalan: null, galat: null })

  async function putuskan(aksi) {
    if (aksi === 'tolak' && !catatan.trim()) {
      setProses({ jalan: null, galat: 'Tulis alasan penolakan dulu. Alasan ini dikirim ke pelapor.' })
      return
    }
    setProses({ jalan: aksi, galat: null })
    try {
      await kirim(`/api/dinas/laporan/${laporan.kode}/verifikasi`, { body: { aksi, catatan: catatan.trim() || undefined } })
      onSelesai(aksi)
    } catch (galat) {
      setProses({ jalan: null, galat: galat.message })
    }
  }

  return (
    <Kartu judul="Keputusan">
      <button type="button" onClick={() => putuskan('teruskan')} disabled={Boolean(proses.jalan)} className={gayaTombol.utama}>
        {proses.jalan === 'teruskan' ? 'Memproses…' : `Verifikasi dan teruskan ke ${laporan.penanggung_jawab}`}
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {laporan.status === 'masuk' && (
          <button type="button" onClick={() => putuskan('foto_ulang')} disabled={Boolean(proses.jalan)} className={gayaTombol.garis}>
            {proses.jalan === 'foto_ulang' ? 'Memproses…' : 'Minta foto ulang'}
          </button>
        )}
        <button type="button" onClick={() => putuskan('tolak')} disabled={Boolean(proses.jalan)} className={`${gayaTombol.merah} ${laporan.status === 'masuk' ? '' : 'sm:col-span-2'}`}>
          {proses.jalan === 'tolak' ? 'Memproses…' : 'Tolak laporan'}
        </button>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold">Catatan untuk pelapor (wajib kalau ditolak)</span>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Tulis alasan kalau laporan ditolak"
          className="rounded border border-garis-dinas px-3.5 py-3 text-sm outline-none placeholder:text-redup focus:border-tinta"
        />
      </label>
      <Galat>{proses.galat}</Galat>
      <p className="text-xs text-redup">Identitas pelapor disembunyikan dari petugas.{laporan.ada_email_pelapor ? ' Pelapor dikabari lewat email.' : ''}</p>
    </Kartu>
  )
}

function SudahDiputuskan({ laporan }) {
  if (laporan.status === 'ditolak' || laporan.status === 'perlu_foto_ulang') {
    return (
      <Kartu judul={laporan.status === 'ditolak' ? 'Laporan ditolak' : 'Menunggu foto ulang'}>
        <p className="text-sm leading-normal">{laporan.alasan_tolak ?? 'Tanpa catatan.'}</p>
        <p className="text-xs text-redup">Oleh {laporan.diverifikasi_oleh ?? 'petugas'}.</p>
      </Kartu>
    )
  }
  return (
    <Kartu judul="Sudah diverifikasi">
      <p className="text-sm">Diverifikasi {laporan.diverifikasi_oleh ?? 'petugas'} dan diteruskan ke {laporan.penanggung_jawab}.</p>
      <Link to={`/dinas/laporan/${laporan.kode}/perbaikan`} className={`${gayaTombol.utama} self-start`}>Buka tiket perbaikan</Link>
    </Kartu>
  )
}

export default function VerifikasiLaporan() {
  const { kode } = useParams()
  const navigate = useNavigate()
  const { segarkan } = usePetugas()
  const { data: laporan, error, loading, ulang } = useData(`/api/dinas/laporan/${encodeURIComponent(kode)}`)

  if (!laporan) return <Muat loading={loading} error={error} onUlang={ulang} />

  const asal = laporan.cek_foto?.asal
  const lokasi = laporan.cek_foto?.cek?.find((c) => c.kode === 'lokasi')
  const foto = laporan.foto_urls?.length ? laporan.foto_urls : [laporan.foto_url].filter(Boolean)
  const perlu = PERLU.includes(laporan.status)

  function selesai(aksi) {
    segarkan()
    if (aksi === 'teruskan') navigate(`/dinas/laporan/${laporan.kode}/perbaikan`)
    else ulang()
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs">
        <Link to={perlu ? '/dinas?tab=verifikasi' : '/dinas'} className="font-semibold text-oranye hover:underline">{perlu ? 'Perlu verifikasi' : 'Laporan masuk'}</Link>
        <span className="text-redup"> / {laporan.kode}</span>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <JudulDinas sub={[`Masuk ${tanggalJam(laporan.dibuat_pada)}`, laporan.proyek?.ruas, laporan.proyek?.kecamatan && `Kecamatan ${laporan.proyek.kecamatan}`].filter(Boolean).join(' · ')}>
          Verifikasi laporan {laporan.kode}
        </JudulDinas>
        <Lencana warna={perlu ? 'kuning' : laporan.status === 'ditolak' ? 'merah' : 'hijau'}>
          {laporan.status === 'masuk' ? 'Menunggu verifikasi' : labelStatus(laporan)}
        </Lencana>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_minmax(320px,520px)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Foto src={foto[0]} alt={`Foto laporan ${laporan.kode}`} eager className="aspect-[16/9] w-full" />
          {foto.length > 1 && (
            <div className="flex gap-3">
              {foto.slice(1).map((src) => <Foto key={src} src={src} alt="Foto tambahan" className="h-20 w-28" />)}
            </div>
          )}
          <p className="-mt-2 text-xs text-redup">Foto pelapor · “{laporan.deskripsi}”</p>
          <Kartu judul="Data foto (EXIF)">
            <Daftar
              isi={[
                ['Waktu foto', asal?.pada ? `${tanggalJam(asal.pada)} · ${selisihMenit(asal.pada, laporan.dibuat_pada)}` : 'Tidak terbaca'],
                ['Koordinat geotag', koordinat(asal?.lat, asal?.lng)],
                ['Titik dipilih pelapor', koordinat(laporan.lat, laporan.lng)],
                ['Sumber foto', laporan.cek_foto?.sumber === 'kamera' ? 'Kamera langsung lewat CekJalan' : laporan.cek_foto?.sumber === 'galeri' ? 'Unggahan dari galeri' : 'Tidak tercatat'],
                ['Perangkat', asal?.perangkat ?? (laporan.cek_foto?.sumber === 'kamera' ? 'Kamera browser' : 'Tidak tercatat')],
              ]}
            />
          </Kartu>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Kartu judul="Cek lokasi">
            <PetaTitik
              className="h-[220px]"
              garis
              labelGaris={lokasi?.jarak_m != null ? `Selisih ${lokasi.jarak_m} m` : null}
              titik={[
                { label: 'Titik dari pelapor', posisi: laporan.lat != null ? [laporan.lat, laporan.lng] : null, warna: '#9F1717' },
                { label: 'Lokasi geotag foto', posisi: asal?.lat != null ? [asal.lat, asal.lng] : null, warna: '#C4420E' },
              ]}
            />
            <p className="flex flex-wrap gap-5 text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-merah" />Titik dari pelapor</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-oranye" />Lokasi geotag foto</span>
            </p>
          </Kartu>
          <Kartu judul="Hasil pengecekan">
            <Pengecekan laporan={laporan} />
          </Kartu>
          {perlu ? <Keputusan laporan={laporan} onSelesai={selesai} /> : <SudahDiputuskan laporan={laporan} />}
        </div>
      </div>
    </div>
  )
}
