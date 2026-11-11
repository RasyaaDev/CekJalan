import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { BarisCek, Foto, Muat, StatusGaransi } from '../../components/ui'
import { Daftar, Galat, JudulDinas, Kartu, Lencana, gayaTombol } from '../../components/dinas'
import { usePetugas } from '../../components/LayoutDinas'
import { kirim, useData } from '../../lib/api'
import { tanggal, tanggalPendek } from '../../lib/format'

const HARI_MS = 86_400_000

const RIWAYAT = {
  masuk: ['Laporan masuk dari warga', 'bg-abu'],
  cek_foto: ['Lolos cek foto otomatis', 'bg-abu'],
  diverifikasi: [null, 'bg-hijau'],
  diteruskan: [null, 'bg-hijau'],
  dikerjakan: ['Kontraktor mulai mengerjakan', 'bg-oranye'],
  bukti: [null, 'bg-oranye'],
  dikembalikan: [null, 'bg-merah'],
  selesai: [null, 'bg-hijau'],
  dikonfirmasi: ['Pelapor mengonfirmasi perbaikan beres', 'bg-hijau'],
  dibuka_lagi: ['Pelapor menolak hasil perbaikan', 'bg-merah'],
  ditolak: [null, 'bg-merah'],
  perlu_foto_ulang: [null, 'bg-kuning'],
}

const tglJam = (iso) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(' pukul', ',')

function waktuRiwayat(riwayat, status) {
  return riwayat.filter((r) => r.status === status).at(-1)?.dibuat_pada ?? null
}

function Tenggat({ laporan }) {
  const diteruskan = waktuRiwayat(laporan.riwayat, 'diteruskan')
  const ditandai = laporan.ditandai_selesai_pada ?? laporan.selesai_pada
  const tenggat = laporan.tenggat_pada ? new Date(laporan.tenggat_pada) : null
  const acuan = ditandai ? new Date(ditandai) : new Date()
  const selisih = tenggat ? Math.round((tenggat - acuan) / HARI_MS) : null
  const total = tenggat && diteruskan ? Math.max(1, Math.round((tenggat - new Date(diteruskan)) / HARI_MS)) : null

  let judul = 'Tenggat belum diatur'
  let warna = 'text-redup'
  if (selisih != null && ditandai) {
    judul = selisih >= 0 ? `Selesai ${selisih ? `${selisih} hari lebih cepat` : 'tepat di hari tenggat'}` : `Selesai ${-selisih} hari terlambat`
    warna = selisih >= 0 ? 'text-hijau' : 'text-oranye'
  } else if (selisih != null) {
    judul = selisih >= 0 ? `Sisa ${selisih} hari` : `Lewat ${-selisih} hari`
    warna = selisih >= 0 ? 'text-tinta' : 'text-oranye'
  }
  const isi = ditandai ? 1 : total && selisih != null ? Math.min(1, Math.max(0, 1 - selisih / total)) : 0

  return (
    <Kartu judul="Tenggat perbaikan">
      <p className={`-mt-2 text-lg font-bold ${warna}`}>{judul}</p>
      <span className="h-1.5 overflow-hidden rounded-full bg-garis-dinas">
        <span className={`block h-full rounded-full ${ditandai && selisih >= 0 ? 'bg-hijau' : selisih != null && selisih < 0 ? 'bg-oranye' : 'bg-kuning'}`} style={{ width: `${Math.round(isi * 100)}%` }} />
      </span>
      <Daftar
        isi={[
          ['Diteruskan', diteruskan ? tanggalPendek(diteruskan) : 'Belum'],
          ['Tenggat', tenggat ? `${tanggalPendek(laporan.tenggat_pada)}${total ? ` (${total} hari)` : ''}` : '–'],
          ['Ditandai selesai', ditandai ? tanggalPendek(ditandai) : 'Belum'],
        ]}
      />
    </Kartu>
  )
}

function UnggahBukti({ laporan, onSelesai }) {
  const [berkas, setBerkas] = useState(null)
  const [proses, setProses] = useState({ jalan: false, galat: null })

  async function unggah(e) {
    e.preventDefault()
    const form = new FormData()
    form.append('foto_sesudah', berkas)
    setProses({ jalan: true, galat: null })
    try {
      await kirim(`/api/dinas/laporan/${laporan.kode}/bukti`, { body: form })
      onSelesai()
    } catch (galat) {
      setProses({ jalan: false, galat: galat.message })
    }
  }

  return (
    <form onSubmit={unggah} className="flex flex-col gap-3 rounded border border-dashed border-garis-dinas p-4">
      <p className="text-sm font-semibold">Unggah foto sesudah perbaikan dari kontraktor</p>
      <p className="text-xs text-redup">Geotag foto dicek otomatis terhadap titik laporan.</p>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setBerkas(e.target.files?.[0] ?? null)} className="text-sm" />
      <Galat>{proses.galat}</Galat>
      <button type="submit" disabled={!berkas || proses.jalan} className={`${gayaTombol.utama} self-start`}>
        {proses.jalan ? 'Mengunggah…' : 'Kontraktor tandai selesai'}
      </button>
    </form>
  )
}

function Bukti({ laporan, onBerubah }) {
  const lokasi = laporan.cek_sesudah?.cek?.find((c) => c.kode === 'lokasi')
  const ditandai = laporan.ditandai_selesai_pada ?? laporan.selesai_pada
  const selisih = ditandai && laporan.tenggat_pada ? Math.round((new Date(laporan.tenggat_pada) - new Date(ditandai)) / HARI_MS) : null

  return (
    <Kartu judul="Bukti perbaikan dari kontraktor">
      <div className="grid gap-4 sm:grid-cols-2">
        <figure className="flex flex-col gap-2">
          <Foto src={laporan.foto_url} alt="Foto sebelum perbaikan" className="aspect-[3/2] w-full" />
          <figcaption className="text-xs font-semibold">Sebelum · foto warga, {tanggalPendek(laporan.dibuat_pada)}</figcaption>
        </figure>
        <figure className="flex flex-col gap-2">
          {laporan.foto_sesudah_url ? (
            <Foto src={laporan.foto_sesudah_url} alt="Foto sesudah perbaikan" className="aspect-[3/2] w-full" />
          ) : (
            <div className="flex aspect-[3/2] w-full items-center justify-center rounded bg-beton px-6 text-center text-xs text-redup">Belum ada foto sesudah</div>
          )}
          <figcaption className="text-xs font-semibold">
            Sesudah{ditandai && laporan.foto_sesudah_url ? ` · foto ${laporan.proyek?.kontraktor ?? 'kontraktor'}, ${tanggalPendek(ditandai)}` : ''}
          </figcaption>
        </figure>
      </div>
      {laporan.foto_sesudah_url && (
        <ul className="flex flex-col gap-3">
          {lokasi && (
            <BarisCek status={lokasi.lolos ? 'ok' : 'gagal'} judul={lokasi.lolos ? 'Lokasi foto sesudah cocok' : 'Lokasi foto sesudah tidak cocok'}>
              {lokasi.jarak_m != null ? `Geotag ${lokasi.jarak_m} m dari titik laporan.` : lokasi.detail}
            </BarisCek>
          )}
          {selisih != null && (
            <BarisCek status={selisih >= 0 ? 'ok' : 'gagal'} judul={selisih >= 0 ? 'Selesai sebelum tenggat' : 'Selesai lewat tenggat'}>
              {selisih >= 0 ? `${selisih} hari lebih cepat dari ${tanggal(laporan.tenggat_pada)}.` : `${-selisih} hari setelah ${tanggal(laporan.tenggat_pada)}.`}
            </BarisCek>
          )}
        </ul>
      )}
      {laporan.status === 'dikerjakan' && !laporan.foto_sesudah_url && <UnggahBukti laporan={laporan} onSelesai={onBerubah} />}
    </Kartu>
  )
}

function Keputusan({ laporan, onBerubah }) {
  const [catatan, setCatatan] = useState('')
  const [proses, setProses] = useState({ jalan: null, galat: null })

  async function aksi(jalur, body) {
    setProses({ jalan: jalur, galat: null })
    try {
      await kirim(`/api/dinas/laporan/${laporan.kode}/${jalur}`, { body })
      setProses({ jalan: null, galat: null })
      onBerubah()
    } catch (galat) {
      setProses({ jalan: null, galat: galat.message })
    }
  }

  let isi
  if (['diverifikasi', 'diteruskan'].includes(laporan.status)) {
    isi = (
      <>
        <p className="text-sm">Menunggu {laporan.penanggung_jawab} mulai bekerja.</p>
        <button type="button" onClick={() => aksi('mulai')} disabled={Boolean(proses.jalan)} className={gayaTombol.utama}>
          {proses.jalan ? 'Memproses…' : 'Tandai mulai dikerjakan'}
        </button>
      </>
    )
  } else if (laporan.status === 'dikerjakan' && laporan.foto_sesudah_url) {
    isi = (
      <>
        <button type="button" onClick={() => aksi('setujui')} disabled={Boolean(proses.jalan)} className={gayaTombol.utama}>
          {proses.jalan === 'setujui' ? 'Memproses…' : 'Setujui, minta konfirmasi warga'}
        </button>
        <button type="button" onClick={() => aksi('kembalikan', { catatan: catatan.trim() || undefined })} disabled={Boolean(proses.jalan)} className={gayaTombol.garis}>
          {proses.jalan === 'kembalikan' ? 'Memproses…' : 'Kembalikan ke kontraktor'}
        </button>
        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          maxLength={1000}
          placeholder="Catatan kalau dikembalikan (opsional)"
          className="rounded border border-garis-dinas px-3.5 py-2.5 text-sm outline-none placeholder:text-redup focus:border-tinta"
        />
        <p className="text-xs text-redup">Warga pelapor punya 3 hari untuk menolak hasil perbaikan.</p>
      </>
    )
  } else if (laporan.status === 'dikerjakan') {
    isi = <p className="text-sm">Sedang dikerjakan. Unggah foto sesudah perbaikan saat kontraktor melapor selesai.</p>
  } else if (laporan.status === 'selesai') {
    isi = (
      <p className="text-sm">
        {laporan.dikonfirmasi_pada ? `Pelapor mengonfirmasi beres pada ${tanggal(laporan.dikonfirmasi_pada)}.` : 'Disetujui. Menunggu konfirmasi pelapor.'}
      </p>
    )
  } else {
    isi = (
      <Link to={`/dinas/laporan/${laporan.kode}`} className={gayaTombol.utama}>Buka verifikasi</Link>
    )
  }

  return (
    <Kartu judul="Keputusan">
      {isi}
      <Galat>{proses.galat}</Galat>
    </Kartu>
  )
}

function lencana(l) {
  if (l.status === 'selesai') return ['hijau', l.dikonfirmasi_pada ? 'Selesai dan dikonfirmasi' : 'Menunggu konfirmasi warga']
  if (l.status === 'dikerjakan' && l.foto_sesudah_url) return ['oranye', 'Menunggu persetujuan dinas']
  if (l.status === 'dikerjakan') return ['oranye', l.buka_lagi_count > 0 ? 'Dikerjakan ulang' : 'Sedang dikerjakan']
  if (['diverifikasi', 'diteruskan'].includes(l.status)) return ['kuning', 'Diteruskan']
  return ['abu', l.status]
}

export default function TiketPerbaikan() {
  const { kode } = useParams()
  const { segarkan } = usePetugas()
  const { data: laporan, error, loading, ulang } = useData(`/api/dinas/laporan/${encodeURIComponent(kode)}`)

  if (!laporan) return <Muat loading={loading} error={error} onUlang={ulang} />

  const [warna, label] = lencana(laporan)
  const ditanggung = laporan.garansi === 'ok' || laporan.garansi === 'warn'
  const diteruskan = waktuRiwayat(laporan.riwayat, 'diteruskan')
  const berubah = () => {
    ulang()
    segarkan()
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs">
        <Link to="/dinas" className="font-semibold text-oranye hover:underline">Laporan masuk</Link>
        <span className="text-redup"> / {laporan.kode}</span>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <JudulDinas sub={[laporan.deskripsi, laporan.proyek?.ruas, diteruskan && `diteruskan ${tanggal(diteruskan)}`].filter(Boolean).join(' · ')}>
          Perbaikan {laporan.kode}
        </JudulDinas>
        <Lencana warna={warna}>{label}</Lencana>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Bukti laporan={laporan} onBerubah={berubah} />
          <Kartu judul="Riwayat">
            <ol className="flex flex-col">
              {laporan.riwayat.map((r, i) => {
                const [teks, titik] = RIWAYAT[r.status] ?? [null, 'bg-abu']
                return (
                  <li key={i} className="grid grid-cols-[14px_100px_1fr] items-baseline gap-3 border-t border-garis-dinas py-3 text-[13px]">
                    <span className={`size-2 rounded-full ${titik}`} />
                    <span className="text-redup">{tglJam(r.dibuat_pada)}</span>
                    <span className="font-semibold">{teks ?? r.catatan ?? r.status}</span>
                  </li>
                )
              })}
            </ol>
          </Kartu>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Tenggat laporan={laporan} />
          <Kartu judul="Penanggung jawab">
            <Daftar
              isi={[
                ['Kontraktor', laporan.proyek?.kontraktor ?? '–'],
                ['Proyek', laporan.proyek ? [laporan.proyek.ruas, laporan.proyek.tahun].filter(Boolean).join(' ') : 'Belum dicocokkan'],
                [
                  'Biaya',
                  <span key="biaya" className={ditanggung ? 'text-hijau' : ''}>
                    {ditanggung ? 'Ditanggung kontraktor (masa pemeliharaan)' : 'Anggaran pemeliharaan Dinas PU'}
                  </span>,
                ],
              ]}
            />
            {laporan.garansi && (
              <p className="flex flex-wrap items-center gap-2">
                <StatusGaransi status={laporan.garansi} className="!text-[13px]" />
                {laporan.akhir_garansi && <span className="text-xs text-redup">sampai {tanggal(laporan.akhir_garansi)}</span>}
              </p>
            )}
          </Kartu>
          <Keputusan laporan={laporan} onBerubah={berubah} />
        </div>
      </div>
    </div>
  )
}
