export const proyekUtama = {
  pekerjaan: 'Peningkatan Jalan Pahlawan',
  lokasi: 'Kecamatan Sidoarjo',
  nilaiKontrak: 'Rp 4,2 miliar',
  sumberDana: 'APBD Kab. Sidoarjo 2025',
  pelaksana: 'Kontraktor A',
  selesai: '7 November 2025',
  masaPemeliharaan: '12 bulan',
  status: 'warn',
  catatan: 'Masih garansi sampai 7 November 2026. Tinggal 12 hari lagi.',
}

export const proyekPeta = [
  { nama: 'Jl. Pahlawan', sub: 'Garansi tinggal 12 hari', status: 'warn', posisi: [-7.4499, 112.7096] },
  { nama: 'Jl. Gajah Mada', sub: 'Masih garansi sampai 2027', status: 'ok', posisi: [-7.4575, 112.7176] },
  { nama: 'Jl. Lingkar Timur', sub: 'Masih garansi sampai 2026', status: 'ok', posisi: [-7.4560, 112.7368] },
  { nama: 'Jl. Yos Sudarso', sub: 'Garansi habis, ke Dinas PU', status: 'exp', posisi: [-7.4449, 112.7218] },
]

export const laporanWarga = [
  { posisi: [-7.4495, 112.7070] },
  { posisi: [-7.4500, 112.7103] },
  { posisi: [-7.4560, 112.7150] },
]

export const laporanTerbaru = [
  { foto: '/foto/lubang.jpg', status: 'Diverifikasi', judul: 'Lubang besar di lajur kiri', lokasi: 'Jalan Pahlawan, dekat pertigaan Jalan Sultan Agung. Dilaporkan 3 jam lalu.', garansi: 'warn', pj: 'Kontraktor A', tenggat: 'Tenggat 14 hari lagi' },
  { foto: '/foto/retak.jpg', status: 'Diteruskan', judul: 'Aspal retak memanjang sekitar 20 meter', lokasi: 'Jalan Gajah Mada, arah ke alun-alun. Dilaporkan kemarin.', garansi: 'ok', pj: 'Kontraktor B', tenggat: 'Tenggat 12 hari lagi' },
  { foto: '/foto/perbaikan-2.jpg', status: 'Dikerjakan', judul: 'Tambalan lama mengelupas lagi', lokasi: 'Jalan Yos Sudarso, depan pertokoan. Dilaporkan 6 hari lalu.', garansi: 'exp', pj: 'Dinas PU Bina Marga', tenggat: 'Lewat tenggat 2 hari', telat: true },
]

export const rapor = [
  { nama: 'Kontraktor A', ruas: '6 ruas', rusak: '2 ruas', waktu: '9 hari', ditolak: '1 kali' },
  { nama: 'Kontraktor B', ruas: '4 ruas', rusak: '0 ruas', waktu: '5 hari', ditolak: '0 kali' },
  { nama: 'Kontraktor C', ruas: '3 ruas', rusak: '1 ruas', waktu: '21 hari', ditolak: '3 kali', buruk: true },
]

export const dashboardContoh = [
  { no: 'CJ-1024', ruas: 'Jl. Pahlawan', garansi: 'warn', label: 'Hampir habis', status: 'Masuk', tenggat: '14 hari' },
  { no: 'CJ-1019', ruas: 'Jl. Gajah Mada', garansi: 'ok', label: 'Masih', status: 'Diteruskan', tenggat: '12 hari' },
  { no: 'CJ-1007', ruas: 'Jl. Yos Sudarso', garansi: 'exp', label: 'Habis', status: 'Dikerjakan', tenggat: 'Lewat 2 hari', telat: true },
  { no: 'CJ-0998', ruas: 'Jl. Lingkar Timur', garansi: 'ok', label: 'Masih', status: 'Selesai', tenggat: 'Selesai' },
]

export const faq = [
  ['Apakah nama pelapor ditampilkan?', 'Tidak. Nama dan nomor WhatsApp hanya dipakai untuk mengabarkan status laporan dan meminta konfirmasi “Selesai”.'],
  ['Dari mana data kontraknya?', 'Dari LPSE Kabupaten Sidoarjo dan opentender.net. Setiap papan proyek menautkan dokumen sumbernya.'],
  ['Bagaimana kalau jalannya bukan jalan kabupaten?', 'Jalan nasional dan provinsi punya pengelola sendiri. CekJalan memberi tahu ke mana laporan sebaiknya dikirim.'],
  ['Apa yang terjadi kalau laporan diabaikan?', 'Setiap laporan punya tenggat. Lewat tenggat, laporan otomatis naik ke atasan dan tercatat di rapor kontraktor.'],
]

export const kreditFoto = 'Foto: YT Arty, MR Bang Jago, DARMAS BS 9 lewat Wikimedia Commons (CC BY / CC BY-SA).'
