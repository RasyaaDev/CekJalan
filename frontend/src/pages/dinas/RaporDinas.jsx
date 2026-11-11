import { useState } from 'react'
import { Muat } from '../../components/ui'
import NilaiRapor from '../../components/NilaiRapor'
import { BarisAngka, Daftar, JudulDinas, Kartu } from '../../components/dinas'
import { useData } from '../../lib/api'

const CATATAN = { C: 'Perlu pembinaan', D: 'Rekomendasi evaluasi' }

const angka = (n) => (n == null ? '–' : String(n).replace('.', ','))

export default function RaporDinas() {
  const { data, error, loading, ulang } = useData('/api/dinas/rapor')
  const [pilih, setPilih] = useState(null)

  if (!data) return <Muat loading={loading} error={error} onUlang={ulang} />

  const kontraktor = data.kontraktor
  const terburuk = [...kontraktor].filter((k) => k.nilai).sort((a, b) => a.skor - b.skor)[0]
  const terpilih = kontraktor.find((k) => k.id === pilih) ?? terburuk ?? kontraktor[0]
  const r = data.ringkasan

  return (
    <div className="flex flex-col gap-6">
      <JudulDinas sub="Penilaian dari laporan warga selama masa garansi">Rapor kontraktor</JudulDinas>
      <BarisAngka
        isi={[
          [r.dinilai, 'kontraktor dinilai'],
          [r.nilai_a, 'dapat rapor A', 'text-hijau'],
          [r.perlu_evaluasi, 'perlu evaluasi', 'text-oranye'],
          [r.persen_tepat == null ? null : `${r.persen_tepat}%`, 'rata-rata tepat waktu'],
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <div className="overflow-x-auto rounded-md border border-garis-dinas bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-beton text-xs text-redup">
              <tr>
                <th className="px-5 py-3 font-semibold">Kontraktor</th>
                <th className="py-3 pr-4 font-semibold">Rapor</th>
                <th className="py-3 pr-4 font-semibold">Proyek</th>
                <th className="py-3 pr-4 font-semibold">Laporan garansi</th>
                <th className="py-3 pr-4 font-semibold">Tepat waktu</th>
                <th className="py-3 pr-5 font-semibold">Rata-rata perbaikan</th>
              </tr>
            </thead>
            <tbody>
              {kontraktor.map((k) => (
                <tr
                  key={k.id}
                  onClick={() => setPilih(k.id)}
                  className={`cursor-pointer border-t border-garis-dinas ${k.id === terpilih?.id ? 'bg-sorot' : 'hover:bg-kanvas'}`}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-bold">{k.nama}</p>
                    {CATATAN[k.nilai] && <p className={`text-xs font-semibold ${k.nilai === 'D' ? 'text-oranye' : 'text-redup'}`}>{CATATAN[k.nilai]}</p>}
                  </td>
                  <td className="py-3.5 pr-4"><NilaiRapor nilai={k.nilai} className="size-8 text-lg" /></td>
                  <td className="py-3.5 pr-4">{k.paket}</td>
                  <td className="py-3.5 pr-4">{k.laporan_garansi}</td>
                  <td className="py-3.5 pr-4">{k.persen_tepat == null ? '–' : `${k.persen_tepat}%`}</td>
                  <td className="py-3.5 pr-5">{k.rata_hari == null ? '–' : `${angka(k.rata_hari)} hari`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!kontraktor.length && <p className="px-5 py-6 text-sm text-redup">Belum ada kontraktor dengan proyek tercatat.</p>}
        </div>

        <div className="flex flex-col gap-5">
          {terpilih && (
            <Kartu>
              <div className="flex items-center gap-4">
                <NilaiRapor nilai={terpilih.nilai} className="size-12 text-3xl" />
                <div className="min-w-0">
                  <p className="text-lg font-bold">{terpilih.nama}</p>
                  <p className="truncate text-[13px] text-redup">{[terpilih.ruas_nama.join(', '), `${terpilih.paket} proyek`].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <Daftar
                isi={[
                  ['Laporan selama garansi', terpilih.laporan_garansi],
                  ['Lewat tenggat', `${terpilih.lewat_tenggat} laporan`],
                  ['Ditolak warga', `${terpilih.ditolak} kali`],
                  ['Skor', terpilih.skor == null ? 'Belum ada laporan jatuh tempo' : terpilih.skor],
                ]}
              />
              {terpilih.nilai === 'D' && (
                <p className="rounded bg-sorot p-3.5 text-[13px] leading-normal">
                  Rapor D. Disarankan jadi bahan evaluasi di tender berikutnya.
                </p>
              )}
            </Kartu>
          )}
          <Kartu judul="Kriteria penilaian">
            <Daftar
              isi={[
                ['Tepat waktu', 'Persen laporan jatuh tempo yang selesai sebelum tenggat'],
                ['Ditolak warga', 'Dikurangi 5 poin tiap penolakan, maksimal 30 poin'],
                ['Nilai', 'A ≥ 90 · B ≥ 80 · C ≥ 65 · D di bawahnya'],
              ]}
            />
            <p className="text-xs text-redup">Hanya laporan terverifikasi yang masuk selama masa garansi yang dihitung.</p>
          </Kartu>
        </div>
      </div>
    </div>
  )
}
