import { useState } from 'react'
import { Link } from 'react-router'
import { Centang, Muat, StatusGaransi } from '../../components/ui'
import { BarisAngka, Galat, JudulDinas, Kartu, Sakelar, Tab } from '../../components/dinas'
import { kirim, useData } from '../../lib/api'
import { tanggalPendek } from '../../lib/format'

const WARNA_BATANG = { ok: 'bg-hijau', warn: 'bg-kuning', exp: 'bg-isian' }
const JENIS_LOG = { h60: 'H-60', h30: 'H-30', h7: 'H-7', manual: 'Manual' }

function teksSisa(p) {
  if (p.sisa_hari == null) return 'Masa pemeliharaan belum tercatat'
  if (p.sisa_hari < 0) return `Habis ${tanggalPendek(p.akhir_garansi)}`
  return `${p.sisa_hari} hari lagi`
}

function TombolPengingat({ proyek, onTerkirim }) {
  const [proses, setProses] = useState({ jalan: false, hasil: null, galat: null })

  async function kirimSekarang() {
    setProses({ jalan: true, hasil: null, galat: null })
    try {
      const hasil = await kirim(`/api/dinas/pengingat/${proyek.id}`)
      setProses({ jalan: false, hasil, galat: null })
      onTerkirim()
    } catch (galat) {
      setProses({ jalan: false, hasil: null, galat: galat.message })
    }
  }

  if (proses.hasil) return <span className="text-xs font-semibold text-hijau">Terkirim ke {proses.hasil.jumlah} warga</span>
  return (
    <span className="flex flex-col">
      <button type="button" onClick={kirimSekarang} disabled={proses.jalan} className="text-left text-xs font-bold text-oranye hover:underline disabled:opacity-50">
        {proses.jalan ? 'Mengirim…' : 'Kirim pengingat'}
      </button>
      {proses.galat && <span className="text-xs text-[#b3261e]">{proses.galat}</span>}
    </span>
  )
}

function Pengingat({ pengingat, onUbah }) {
  const [galat, setGalat] = useState(null)
  const nilai = pengingat.pengaturan

  async function ubah(kunci, isi) {
    const baru = { ...nilai, [kunci]: isi }
    setGalat(null)
    try {
      await kirim('/api/dinas/pengingat', { method: 'PUT', body: baru })
      onUbah()
    } catch (e) {
      setGalat(e.message)
    }
  }

  return (
    <Kartu judul="Pengingat otomatis">
      <p className="-mt-2 text-xs leading-normal text-redup">Dikirim lewat email sebelum masa pemeliharaan berakhir.</p>
      <Sakelar label="60 hari sebelum habis" checked={nilai.h60} onChange={(v) => ubah('h60', v)} />
      <Sakelar label="30 hari sebelum habis" checked={nilai.h30} onChange={(v) => ubah('h30', v)} />
      <Sakelar label="7 hari sebelum habis" checked={nilai.h7} onChange={(v) => ubah('h7', v)} />
      <p className="text-sm font-semibold">Kirim ke</p>
      <Centang warna="oranye" checked={nilai.warga} onChange={(v) => ubah('warga', v)}>
        <span className="flex flex-col text-sm">
          Warga yang memantau ruas
          <span className="text-xs text-redup">{pengingat.pemantau} warga terdaftar</span>
        </span>
      </Centang>
      <p className="text-xs leading-normal text-redup">Email kontraktor dan PPK belum tercatat di data LPSE, jadi pengingat baru dikirim ke warga pemantau.</p>
      <Galat>{galat}</Galat>
    </Kartu>
  )
}

export default function ProyekGaransi() {
  const [tab, setTab] = useState('semua')
  const daftar = useData('/api/dinas/proyek')
  const pengingat = useData('/api/dinas/pengingat')
  const j = daftar.data?.jumlah
  const proyek = (daftar.data?.proyek ?? []).filter((p) => tab === 'semua' || p.garansi === tab)

  return (
    <div className="flex flex-col gap-6">
      <JudulDinas sub={`${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${j ? ` · ${j.semua} proyek jalan tercatat dari LPSE` : ''}`}>
        Proyek dan garansi
      </JudulDinas>
      <BarisAngka
        isi={[
          [j?.semua, 'proyek jalan tercatat'],
          [j?.ok, 'masih garansi', 'text-hijau'],
          [j?.warn, 'garansi habis dalam 30 hari', 'text-oranye'],
          [j?.exp, 'garansi sudah habis', 'text-abu'],
        ]}
      />
      <Tab
        aktif={tab}
        onPilih={setTab}
        pilihan={[
          ['semua', `Semua ${j?.semua ?? ''}`],
          ['warn', `Hampir habis ${j?.warn ?? ''}`],
          ['ok', `Masih garansi ${j?.ok ?? ''}`],
          ['exp', `Garansi habis ${j?.exp ?? ''}`],
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-md border border-garis-dinas bg-white">
          <Muat loading={daftar.loading} error={daftar.error} onUlang={daftar.ulang} className="px-5" />
          {daftar.data && (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-beton text-xs text-redup">
                <tr>
                  <th className="px-5 py-3 font-semibold">Proyek</th>
                  <th className="py-3 pr-4 font-semibold">Kontraktor</th>
                  <th className="py-3 pr-4 font-semibold">Masa pemeliharaan</th>
                  <th className="py-3 pr-4 font-semibold">Laporan</th>
                  <th className="py-3 pr-5 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {proyek.map((p) => (
                  <tr key={p.id} className={`border-t border-garis-dinas ${p.garansi === 'warn' ? 'bg-sorot' : ''}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-bold">{[p.ruas, p.tahun].filter(Boolean).join(' ')}</p>
                      <p className="text-xs text-redup">{p.kecamatan ?? 'Lokasi belum tercatat'}</p>
                    </td>
                    <td className="py-3.5 pr-4">{p.kontraktor ?? '–'}</td>
                    <td className="py-3.5 pr-4">
                      <StatusGaransi status={p.garansi} className="!text-[13px]" />
                      <span className="mt-1.5 block h-1 w-[120px] overflow-hidden rounded-full bg-garis-dinas">
                        <span className={`block h-full ${WARNA_BATANG[p.garansi] ?? 'bg-isian'}`} style={{ width: `${p.garansi === 'exp' ? 100 : p.sisa_persen ?? 0}%` }} />
                      </span>
                      <span className={`text-xs ${p.garansi === 'warn' ? 'font-semibold text-oranye' : 'text-redup'}`}>{teksSisa(p)}</span>
                    </td>
                    <td className={`py-3.5 pr-4 font-bold ${p.laporan > 0 ? 'text-oranye' : ''}`}>{p.laporan}</td>
                    <td className="py-3.5 pr-5">
                      {p.garansi === 'warn' ? (
                        <TombolPengingat proyek={p} onTerkirim={pengingat.ulang} />
                      ) : (
                        <Link to={`/proyek/${p.slug}`} className="text-xs font-semibold hover:underline">Lihat detail</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {daftar.data && !proyek.length && <p className="px-5 py-6 text-sm text-redup">Tidak ada proyek di tab ini.</p>}
        </div>

        <div className="flex flex-col gap-5">
          {pengingat.data ? <Pengingat pengingat={pengingat.data} onUbah={pengingat.ulang} /> : <Muat loading={pengingat.loading} error={pengingat.error} onUlang={pengingat.ulang} />}
          <Kartu judul="Pengingat terakhir">
            {pengingat.data?.log.length ? (
              <ul className="flex flex-col">
                {pengingat.data.log.map((l, i) => (
                  <li key={i} className="flex flex-col gap-0.5 border-t border-garis-dinas py-3">
                    <span className="text-sm font-semibold">{l.jumlah} warga · {l.ruas}</span>
                    <span className="text-xs text-redup">
                      {JENIS_LOG[l.jenis]} · terkirim {tanggalPendek(l.dibuat_pada)}{l.dikirim_oleh ? ` oleh ${l.dikirim_oleh}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-redup">Belum ada pengingat terkirim.</p>
            )}
          </Kartu>
        </div>
      </div>
    </div>
  )
}
