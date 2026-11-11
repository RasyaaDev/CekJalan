import { Tombol } from '../components/ui'

export default function TidakDitemukan() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-konten flex-col items-start justify-center gap-4 px-4 py-20">
      <h1 className="font-judul text-4xl text-merah md:text-5xl">Halaman tidak ditemukan</h1>
      <p className="max-w-[560px] text-lg leading-relaxed text-redup">Alamat yang kamu buka tidak ada di CekJalan.</p>
      <div className="flex flex-wrap gap-2">
        <Tombol to="/peta">Buka peta proyek</Tombol>
        <Tombol to="/" varian="garis">Ke beranda</Tombol>
      </div>
    </section>
  )
}
