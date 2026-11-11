import { supabase } from '../supabase.js'
import { perluDiingatkan } from '../pengingat.js'
import { ambilPantauan, ambilPengaturan, kirimPengingat } from '../kirimPengingat.js'

const hariIni = new Date()
const [proyek, log, pengaturan, pantauan] = await Promise.all([
  supabase.from('proyek').select('id,ruas,lat,lng,selesai_pada,masa_pemeliharaan_bulan').limit(5000),
  supabase.from('pengingat_log').select('proyek_id,jenis').neq('jenis', 'manual').limit(20000),
  ambilPengaturan(),
  ambilPantauan(),
])
if (proyek.error) throw proyek.error
if (log.error) throw log.error

let total = 0
for (const p of proyek.data ?? []) {
  const jatuh = perluDiingatkan(p, hariIni, log.data ?? [], pengaturan)
  if (!jatuh) continue
  const { jumlah } = await kirimPengingat({ proyek: p, jenis: jatuh.jenis, pantauan, pengaturan })
  console.log(`${jatuh.jenis} ${p.ruas}: sisa ${jatuh.sisa_hari} hari, ${jumlah} penerima`)
  total++
}
console.log(`${total} pengingat diproses`)
