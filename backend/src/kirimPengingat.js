import { supabase } from './supabase.js'
import { kirimEmail } from './email.js'
import { jarakMeter } from './exif.js'
import { akhirGaransi, sisaHariGaransi } from './garansi.js'
import { PENGATURAN_AWAL, mauKabar, pemantauRuas } from './pengingat.js'

export async function ambilPengaturan() {
  const { data, error } = await supabase.from('pengaturan').select('nilai').eq('kunci', 'pengingat').maybeSingle()
  if (error) throw error
  return { ...PENGATURAN_AWAL, ...(data?.nilai ?? {}) }
}

export async function ambilPantauan() {
  const { data, error } = await supabase
    .from('pantauan')
    .select('email,lat,lng,radius_m,proyek_ids,kabar_30_hari,kabar_7_hari,aktif')
    .eq('aktif', true)
    .limit(5000)
  if (error) throw error
  return data ?? []
}

export async function kirimPengingat({ proyek, jenis, pantauan, pengaturan, oleh = null }) {
  const sisa = sisaHariGaransi(proyek)
  const akhir = akhirGaransi(proyek)?.toISOString().slice(0, 10)
  const penerima = pengaturan.warga
    ? pemantauRuas(proyek, pantauan, jarakMeter).filter((p) => jenis === 'manual' || mauKabar(p, jenis))
    : []
  const alamat = [...new Set(penerima.map((p) => p.email))]

  for (const ke of alamat) {
    await kirimEmail({
      ke,
      subjek: `Garansi ${proyek.ruas} tinggal ${sisa} hari`,
      teks:
        `Masa pemeliharaan ${proyek.ruas} berakhir ${akhir}. Kalau ada kerusakan, laporkan sebelum tanggal itu ` +
        `supaya perbaikannya ditanggung kontraktor.\n\nLapor: ${process.env.FRONTEND_URL ?? '/'}lapor`,
    }).catch((galat) => console.error(`gagal mengirim pengingat ke ${ke}:`, galat.message))
  }

  const { error } = await supabase.from('pengingat_log').insert({
    proyek_id: proyek.id,
    jenis,
    penerima: 'warga',
    jumlah: alamat.length,
    dikirim_oleh: oleh,
  })
  if (error) throw error
  return { jumlah: alamat.length }
}
