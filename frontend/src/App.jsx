import { Suspense, lazy, useEffect } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router'
import Header from './components/Header'
import Footer from './components/Footer'
import Beranda from './pages/Beranda'
const HalamanPeta = lazy(() => import('./pages/HalamanPeta'))
const DetailProyek = lazy(() => import('./pages/DetailProyek'))
const PetaKerusakan = lazy(() => import('./pages/PetaKerusakan'))
const LaporKerusakan = lazy(() => import('./pages/LaporKerusakan'))
const LaporTerkirim = lazy(() => import('./pages/LaporTerkirim'))
const LacakLaporan = lazy(() => import('./pages/LacakLaporan'))
const PantauRuas = lazy(() => import('./pages/PantauRuas'))
const RaporKontraktor = lazy(() => import('./pages/RaporKontraktor'))
const ProfilKontraktor = lazy(() => import('./pages/ProfilKontraktor'))
const DataTerbuka = lazy(() => import('./pages/DataTerbuka'))
const Masuk = lazy(() => import('./pages/Masuk'))
const Daftar = lazy(() => import('./pages/Daftar'))
const TidakDitemukan = lazy(() => import('./pages/TidakDitemukan'))
const LayoutDinas = lazy(() => import('./components/LayoutDinas'))
const MasukPetugas = lazy(() => import('./pages/dinas/MasukPetugas'))
const LaporanMasuk = lazy(() => import('./pages/dinas/LaporanMasuk'))
const VerifikasiLaporan = lazy(() => import('./pages/dinas/VerifikasiLaporan'))
const TiketPerbaikan = lazy(() => import('./pages/dinas/TiketPerbaikan'))
const PetaLaporan = lazy(() => import('./pages/dinas/PetaLaporan'))
const ProyekGaransi = lazy(() => import('./pages/dinas/ProyekGaransi'))
const RaporDinas = lazy(() => import('./pages/dinas/RaporDinas'))
const EksporData = lazy(() => import('./pages/dinas/EksporData'))

function GulirKeAtas() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

const memuat = <p className="mx-auto max-w-konten px-4 py-20 text-sm text-redup">Memuat…</p>

function LayoutWarga() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={memuat}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <>
      <GulirKeAtas />
      <Suspense fallback={memuat}>
        <Routes>
          <Route element={<LayoutWarga />}>
            <Route path="/" element={<Beranda />} />
            <Route path="/peta" element={<HalamanPeta />} />
            <Route path="/proyek/:slug" element={<DetailProyek />} />
            <Route path="/kerusakan" element={<PetaKerusakan />} />
            <Route path="/peta-kerusakan" element={<PetaKerusakan />} />
            <Route path="/lapor" element={<LaporKerusakan />} />
            <Route path="/lapor/terkirim/:kode" element={<LaporTerkirim />} />
            <Route path="/lacak" element={<LacakLaporan />} />
            <Route path="/lacak/:kode" element={<LacakLaporan />} />
            <Route path="/pantau" element={<PantauRuas />} />
            <Route path="/pantau/:slug" element={<PantauRuas />} />
            <Route path="/rapor" element={<RaporKontraktor />} />
            <Route path="/rapor/:id" element={<ProfilKontraktor />} />
            <Route path="/data" element={<DataTerbuka />} />
            <Route path="/masuk" element={<Masuk />} />
            <Route path="/daftar" element={<Daftar />} />
            <Route path="*" element={<TidakDitemukan />} />
          </Route>
          <Route path="/dinas/masuk" element={<MasukPetugas />} />
          <Route path="/dinas" element={<LayoutDinas />}>
            <Route index element={<LaporanMasuk />} />
            <Route path="laporan/:kode" element={<VerifikasiLaporan />} />
            <Route path="laporan/:kode/perbaikan" element={<TiketPerbaikan />} />
            <Route path="peta" element={<PetaLaporan />} />
            <Route path="proyek" element={<ProyekGaransi />} />
            <Route path="kontraktor" element={<RaporDinas />} />
            <Route path="ekspor" element={<EksporData />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
