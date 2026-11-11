import { useLocation, useParams } from 'react-router'
import { BarisCek, Ikon, Muat, Tombol } from '../components/ui'
import { useData } from '../lib/api'
import { tanggalPendek, waktuFoto } from '../lib/format'

function Kartu({ judul, children }) {
  return (
    <section className="flex flex-col gap-[18px] rounded-md border border-[#d9d2cc] bg-white p-6">
      <h2 className="font-judul text-[22px] leading-tight">{judul}</h2>
      {children}
    </section>
  )
}

export default function LaporTerkirim() {
  const { kode } = useParams()
  const { state } = useLocation()
  const ambil = useData(state?.laporan ? null : `/api/laporan/${encodeURIComponent(kode)}`)
  const laporan = state?.laporan ?? ambil.data

  if (!laporan) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-20">
        <Muat loading={ambil.loading} error={ambil.error} onUlang={ambil.ulang} />
      </div>
    )
  }

  const ditanggung = laporan.garansi === 'ok' || laporan.garansi === 'warn'
  const penanggung = ditanggung ? laporan.pelaksana ?? 'kontraktor pelaksana' : 'Dinas PU Bina Marga'
  const cek = laporan.cek_foto?.cek ?? []
  const lokasi = cek.find((c) => c.kode === 'lokasi')
  const waktu = cek.find((c) => c.kode === 'waktu')
  const dekat = laporan.dekat?.[0]

  return (
    <div className="bg-[#faf8f6] px-4 pb-24 pt-16">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <span className="flex size-16 items-center justify-center rounded-full bg-hijau text-white">
          <Ikon nama="centang" className="size-8" />
        </span>
        <div className="flex flex-col gap-3">
          <h1 className="font-judul text-[40px] leading-[1.15] text-merah md:text-[44px]">Laporan terkirim</h1>
          <p className="flex items-center gap-2 self-start rounded bg-sorot px-3.5 py-2 leading-normal">
            <span className="text-[13px] text-redup">Nomor laporan</span>
            <strong className="text-base">{laporan.kode}</strong>
          </p>
          <p className="text-[17px] leading-normal text-redup">
            Simpan nomor ini untuk melacak laporanmu.
            {laporan.email_samaran && ` Kabar berikutnya dikirim ke email ${laporan.email_samaran}.`}
          </p>
        </div>

        <Kartu judul="Hasil pengecekan otomatis">
          <ul className="flex flex-col gap-[18px]">
            {lokasi && (
              <BarisCek status={lokasi.lolos ? 'ok' : 'gagal'} judul={lokasi.judul}>{lokasi.detail}</BarisCek>
            )}
            {waktu && (
              <BarisCek status={waktu.lolos ? 'ok' : 'gagal'} judul={waktu.judul}>
                {waktu.lolos ? `${waktuFoto(waktu.diambil_pada)}, bukan foto lama atau unduhan.` : waktu.detail}
              </BarisCek>
            )}
            {laporan.ruas ? (
              <BarisCek status={ditanggung ? 'ok' : 'waspada'} judul={ditanggung ? 'Ruas masih dalam masa garansi' : 'Garansi ruas ini sudah habis'}>
                {[laporan.ruas, laporan.tahun_proyek, laporan.pelaksana].filter(Boolean).join(' · ')}
                {laporan.akhir_garansi && ` · ${ditanggung ? 'berakhir' : 'berakhir sejak'} ${tanggalPendek(laporan.akhir_garansi)}`}.
              </BarisCek>
            ) : (
              <BarisCek status="waspada" judul="Ruas belum tercatat">
                Tidak ada kontrak jalan kabupaten yang cocok. Petugas akan menentukan penanggung jawabnya.
              </BarisCek>
            )}
            {dekat && (
              <BarisCek status="waspada" judul="Ada laporan lain di dekat sini">
                {dekat.kode} berjarak {dekat.jarak_m} m. Petugas akan memastikan ini bukan laporan ganda.
              </BarisCek>
            )}
          </ul>
        </Kartu>

        <Kartu judul="Selanjutnya">
          <ol className="flex flex-col gap-[18px]">
            {[
              ['Petugas memverifikasi laporan', 'Paling lambat 2 hari kerja.'],
              ['Diteruskan ke penanggung jawab', ditanggung ? `Karena masih garansi, perbaikan ditanggung ${penanggung}.` : 'Perbaikan masuk anggaran pemeliharaan Dinas PU Bina Marga.'],
              ['Kamu mengecek hasilnya', 'Kalau belum beres, tolak statusnya dan laporan dibuka lagi.'],
            ].map(([a, b], i) => (
              <li key={a} className="flex items-start gap-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-oranye text-sm font-bold text-oranye">{i + 1}</span>
                <span className="flex flex-col gap-0.5 leading-normal">
                  <span className="text-[15px] font-bold">{a}</span>
                  <span className="text-sm text-redup">{b}</span>
                </span>
              </li>
            ))}
          </ol>
        </Kartu>

        <div className="flex flex-wrap gap-3">
          <Tombol to={`/lacak/${laporan.kode}`} className="text-base">Lacak laporan {laporan.kode}</Tombol>
          <Tombol to="/" varian="garis" className="text-base">Kembali ke beranda</Tombol>
        </div>
      </div>
    </div>
  )
}
