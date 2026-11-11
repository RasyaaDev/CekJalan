import { supabase } from './supabase.js'
import { hitungRapor } from './rapor.js'
import { STATUS_PUBLIK } from './laporan.js'

const KOLOM_PROYEK = 'id,slug,ruas,lokasi,tahun_anggaran,nilai_kontrak,selesai_pada,masa_pemeliharaan_bulan,sumber_url'
const KOLOM_LAPORAN = 'id,kode,proyek_id,deskripsi,jenis,foto_url,status,dibuat_pada,tenggat_pada,selesai_pada,buka_lagi_count'

export async function ambilSemua() {
  const [kontraktor, laporan] = await Promise.all([
    supabase.from('kontraktor').select(`id,nama,proyek(${KOLOM_PROYEK})`),
    supabase.from('laporan').select(KOLOM_LAPORAN).in('status', STATUS_PUBLIK),
  ])
  if (kontraktor.error) throw kontraktor.error
  if (laporan.error) throw laporan.error
  return { kontraktor: kontraktor.data ?? [], laporan: laporan.data ?? [] }
}

export function raporSemua({ kontraktor, laporan }, filter = {}, sekarang = new Date()) {
  return kontraktor
    .map((k) => {
      const proyek = (k.proyek ?? []).filter(
        (p) => (!filter.tahun || p.tahun_anggaran === filter.tahun) && (!filter.lokasi || p.lokasi === filter.lokasi),
      )
      const id = new Set(proyek.map((p) => p.id))
      const rapor = hitungRapor(proyek, laporan.filter((l) => id.has(l.proyek_id)), sekarang)
      return {
        id: k.id,
        nama: k.nama,
        ...rapor,
        ruas: rapor.paket,
        rusak: rapor.laporan_garansi,
        waktu: rapor.rata_hari == null ? null : Math.round(rapor.rata_hari),
        buruk: rapor.ditolak >= 2,
      }
    })
    .filter((k) => k.paket > 0)
}
