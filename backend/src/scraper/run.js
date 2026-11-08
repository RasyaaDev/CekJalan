import { ambilPaket, judul, rapikanRuas, slugify, tidur } from './lpse.js'
import { geocode } from './geocode.js'

const argumen = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--') && arg.includes('='))
    .map((arg) => {
      const posisi = arg.indexOf('=')
      return [arg.slice(2, posisi), arg.slice(posisi + 1)]
    }),
)

const TAHUN_AWAL = 2011
const tahunArg = argumen.tahun ?? String(new Date().getFullYear())
const daftarTahun =
  tahunArg === 'all'
    ? Array.from({ length: new Date().getFullYear() - TAHUN_AWAL + 1 }, (_, i) => TAHUN_AWAL + i)
    : [Number(tahunArg)]
const limit = argumen.limit ? Number(argumen.limit) : Infinity
const filter = argumen.filter ? new RegExp(argumen.filter, 'i') : undefined
const simpan = process.argv.includes('--save')

const modul = simpan ? await import('../supabase.js') : null
const supabase = modul?.supabase

let tersimpan = 0
let gagal = 0

for (const tahun of daftarTahun) {
  const { sesi, hasil } = await ambilPaket(tahun, { filter, batas: limit })
  console.log(`[${tahun}] ${hasil.length} paket jalan${simpan ? '' : ' (mode uji, tanpa simpan)'}.`)

  for (const paket of hasil) {
    try {
    await tidur(1500)
    const detail = await sesi.detailPemenang(paket.kode_tender, tahun)
    const ruas = judul(rapikanRuas(paket.nama))
    const slug = `${slugify(ruas) || 'proyek'}-${paket.kode_tender}`
    const nilaiKontrak = detail.nilai_kontrak ?? paket.nilai_kontrak

    console.log(
      [
        paket.kode_tender,
        ruas,
        detail.pemenang ?? '(pemenang tidak terbaca)',
        nilaiKontrak,
      ].join(' | '),
    )

    if (!simpan) continue
    if (!detail.pemenang) {
      gagal++
      console.log('  dilewati: nama pemenang tidak ditemukan')
      continue
    }

    const { data: kontraktor, error: galatKontraktor } = await supabase
      .from('kontraktor')
      .upsert({ nama: detail.pemenang }, { onConflict: 'nama' })
      .select('id')
      .single()

    if (galatKontraktor) throw galatKontraktor

    const { error: galatProyek } = await supabase.from('proyek').upsert(
      {
        kode_tender: paket.kode_tender,
        slug,
        ruas,
        lokasi: paket.lokasi || 'Sidoarjo',
        nilai_kontrak: nilaiKontrak,
        kontraktor_id: kontraktor.id,
        tahun_anggaran: paket.tahun,
        sumber_url: paket.sumber_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'kode_tender' },
    )

    if (galatProyek) throw galatProyek

    await tidur(1100)
    const koordinat = await geocode(ruas)
    if (koordinat) {
      const { error } = await supabase
        .from('proyek')
        .update({ lat: koordinat.lat, lng: koordinat.lng, updated_at: new Date().toISOString() })
        .eq('kode_tender', paket.kode_tender)

      if (error) throw error
    }

    tersimpan++
    console.log(`  tersimpan${koordinat ? ` + peta (${koordinat.lat}, ${koordinat.lng})` : ' tanpa koordinat'}`)
    } catch (error) {
      gagal++
      console.error(`  gagal ${paket.kode_tender}: ${error.message}`)
    }
  }

  if (tahun !== daftarTahun[daftarTahun.length - 1]) await tidur(2000)
}

console.log(`Selesai: ${tersimpan} tersimpan, ${gagal} gagal.`)
