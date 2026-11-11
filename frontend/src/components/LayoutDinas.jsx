import { Suspense, createContext, useContext } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { kirim, useData } from '../lib/api'

const KonteksPetugas = createContext({ petugas: null, segarkan: () => {} })

export function usePetugas() {
  return useContext(KonteksPetugas)
}

const MENU = [
  ['Laporan masuk', '/dinas', 'semua', 'masuk_hari_ini'],
  ['Perlu verifikasi', '/dinas?tab=verifikasi', 'verifikasi', 'perlu_verifikasi'],
  ['Lewat tenggat', '/dinas?tab=telat', 'telat', 'lewat_tenggat'],
  ['Peta laporan', '/dinas/peta'],
  ['Proyek dan garansi', '/dinas/proyek'],
  ['Rapor kontraktor', '/dinas/kontraktor'],
  ['Ekspor data', '/dinas/ekspor'],
]

function aktif(pathname, tabSekarang, [, to, tab]) {
  const [jalur] = to.split('?')
  if (tab) {
    if (pathname === '/dinas') return (tabSekarang ?? 'semua') === tab || (tab === 'semua' && !['verifikasi', 'telat'].includes(tabSekarang))
    if (pathname.startsWith('/dinas/laporan/')) return tab === 'semua'
    return false
  }
  return pathname.startsWith(jalur)
}

export default function LayoutDinas() {
  const { pathname } = useLocation()
  const [param] = useSearchParams()
  const navigate = useNavigate()
  const saya = useData('/api/dinas/saya')
  const ringkasan = useData(saya.data ? '/api/dinas/ringkasan' : null)

  if (saya.loading) return <p className="p-10 text-sm text-redup">Memuat…</p>
  if (!saya.data) return <Navigate to={`/dinas/masuk?lanjut=${encodeURIComponent(pathname + (param.size ? `?${param}` : ''))}`} replace />

  async function keluar() {
    await kirim('/api/dinas/keluar').catch(() => {})
    navigate('/dinas/masuk', { replace: true })
  }

  const angka = ringkasan.data ?? {}

  return (
    <KonteksPetugas.Provider value={{ petugas: saya.data, segarkan: ringkasan.ulang }}>
      <div className="flex min-h-screen flex-col bg-kanvas text-tinta">
        <header className="flex h-[62px] shrink-0 items-center justify-between gap-4 bg-navy px-4 text-white md:px-8">
          <Link to="/dinas" className="flex items-end gap-4">
            <span className="font-judul text-[26px] leading-none">CekJalan</span>
            <span className="hidden text-[13px] text-teks-menu sm:inline">Dinas PU Bina Marga Kabupaten Sidoarjo</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="hidden sm:inline">Petugas verifikasi: {saya.data.nama}</span>
            <button type="button" onClick={keluar} className="rounded border border-teks-menu/50 px-3 py-1.5 font-semibold hover:bg-navy-2">
              Keluar
            </button>
          </div>
        </header>
        <div className="flex flex-1 flex-col lg:flex-row">
          <nav aria-label="Menu petugas" className="shrink-0 bg-navy lg:w-[240px]">
            <ul className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4 lg:py-6">
              {MENU.map((menu) => {
                const [label, to, , kunci] = menu
                const sedang = aktif(pathname, param.get('tab'), menu)
                return (
                  <li key={label} className="shrink-0">
                    <Link
                      to={to}
                      aria-current={sedang ? 'page' : undefined}
                      className={`flex items-center justify-between gap-4 rounded px-3 py-2.5 text-sm ${sedang ? 'border-l-[3px] border-kuning bg-navy-2 font-bold text-white' : 'text-teks-menu hover:bg-navy-2 hover:text-white'}`}
                    >
                      {label}
                      {kunci && angka[kunci] != null && <span className="text-xs font-semibold">{angka[kunci]}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:py-8">
            <Suspense fallback={<p className="text-sm text-redup">Memuat…</p>}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </KonteksPetugas.Provider>
  )
}
