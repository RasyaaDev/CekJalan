# 🚧 CekJalan

**Cek siapa yang membangun jalan di depan rumahmu.**

CekJalan adalah platform transparansi kontrak proyek jalan di Kabupaten Sidoarjo. Warga dapat melihat pelaksana proyek, nilai kontrak, dan masa pemeliharaan (garansi) tiap ruas jalan, melaporkan kerusakan dengan validasi foto geotagging, serta memantau perbaikannya. Dinas PU Bina Marga memverifikasi laporan, meneruskannya ke penanggung jawab, memantau tenggat, dan mengevaluasi rapor kontraktor.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)

🌐 **Demo online:** [https://cekjalan.devvzgajda.my.id](https://cekjalan.devvzgajda.my.id) *(dihosting di server pribadi anggota tim untuk keperluan demo)*

---

## ✨ Fitur Utama

### Portal Warga (Publik)

- **Beranda & Pencarian Ruas (`/`)** — cari ruas jalan untuk langsung melihat papan proyek digital berisi pelaksana, nilai kontrak, sumber dana, dan status masa pemeliharaan.
- **Peta Proyek (`/peta`) & Detail Proyek (`/proyek/:slug`)** — peta interaktif Leaflet + OpenStreetMap dengan warna status garansi (`Masih garansi`, `Hampir habis`, `Garansi habis`), riwayat paket pekerjaan di ruas yang sama, serta laporan kerusakan terkait.
- **Peta Kerusakan GIS (`/peta-kerusakan` / `/kerusakan`)** — peta sebaran laporan yang sudah terverifikasi lengkap dengan penanggung jawab perbaikan (kontraktor saat masih garansi, Dinas PU setelah garansi habis) dan pembaruan berkala.
- **Lapor Kerusakan & Cek Foto Otomatis (`/lapor`, `/lapor/terkirim/:kode`)** — pelapor masuk lewat akun warga, menentukan titik di peta (atau GPS browser), lalu mengunggah 1–3 foto (kamera langsung atau galeri). Server mengecek otomatis:
  - jarak geotag ≤ 50 m dari titik laporan,
  - umur foto ≤ 24 jam,
  - keaslian kamera (bukan tangkapan layar),
  - anti-duplikat SHA-256 terhadap foto yang sudah pernah diunggah.
- **Lacak & Konfirmasi Laporan (`/lacak`, `/lacak/:kode`)** — timeline status perbaikan (`masuk → diverifikasi → diteruskan → dikerjakan → selesai`), termasuk alasan bila ditolak atau diminta foto ulang. Pelapor dapat mengonfirmasi selesai atau menolak hasil perbaikan untuk dibuka kembali.
- **Pantau Ruas Jalan (`/pantau`)** — warga memilih ruas atau radius area untuk menerima email pengingat sebelum masa garansi berakhir.
- **Rapor Kontraktor (`/rapor`, `/rapor/:id`)** — nilai A–D berdasarkan ketepatan waktu perbaikan dan jumlah penolakan warga untuk kerusakan selama masa garansi.
- **Data Terbuka (`/data`)** — ringkasan statistik, grafik laporan per kecamatan, unduhan CSV & GeoJSON, serta endpoint API publik tanpa kunci akses.
- **Akun Warga (`/masuk`, `/daftar`)** — pendaftaran dengan kata sandi dan verifikasi kode 6 angka via email, serta opsi masuk lewat Google OAuth.

### Dashboard Petugas Dinas PU (`/dinas`)

- **Autentikasi Petugas (`/dinas/masuk`)** — halaman login terpisah menggunakan email dinas atau NIP dan kata sandi (akun dibuat oleh admin dinas).
- **Laporan Masuk & Verifikasi (`/dinas`, `/dinas/laporan/:kode`)** — ringkasan harian, filter tab (`Semua`, `Perlu verifikasi`, `Diteruskan`, `Dikerjakan`, `Lewat tenggat`), data EXIF foto, peta pembanding dua pin (titik pelapor vs geotag foto) beserta jarak selisihnya, peringatan potensi laporan ganda dalam radius 300 m, serta aksi teruskan, minta foto ulang, atau tolak (wajib dengan alasan yang dikirim ke email pelapor).
- **Tiket Perbaikan (`/dinas/laporan/:kode/perbaikan`)** — memantau tenggat 14 hari, foto sebelum vs sesudah beserta cek geotag foto sesudah, dan menyetujui atau mengembalikan hasil ke kontraktor.
- **Peta Laporan GIS (`/dinas/peta`)** — lapisan ruas garansi, titik laporan, kepadatan kerusakan, daftar titik rawan prioritas tagih, pembaruan otomatis tiap 30 detik, dan unduhan GeoJSON.
- **Proyek, Garansi & Pengingat (`/dinas/proyek`)** — tabel progres sisa masa pemeliharaan, kirim pengingat manual ke pemantau, pengaturan jadwal pengingat H-60 / H-30 / H-7, dan log pengingat terkirim.
- **Rapor Kontraktor & Ekspor Data (`/dinas/kontraktor`, `/dinas/ekspor`)** — evaluasi kontraktor, pratinjau rekap bulanan siap cetak PDF, unduhan CSV, dan riwayat ekspor.

---

## 🎯 Pemetaan ke Saran Pengembangan

| Saran Pengembangan | Implementasi di CekJalan |
| --- | --- |
| **1. Validasi laporan & anti-spam** | Cek foto otomatis di `backend/src/cekFoto.js` & `exif.js` (geotag ≤ 50 m, umur ≤ 24 jam, keaslian kamera, hash SHA-256), diikuti verifikasi manual petugas di `/dinas/laporan/:kode`. Endpoint dan peta publik hanya menampilkan status terverifikasi (`diverifikasi`, `diteruskan`, `dikerjakan`, `selesai`). |
| **2. Integrasi Open Data / GIS** | Peta interaktif proyek (`/peta`) dan kerusakan (`/peta-kerusakan`, `/dinas/peta`) dengan polling berkala, halaman Data Terbuka (`/data`), unduhan CSV & GeoJSON, serta API publik tanpa API key. |
| **3. Notifikasi / reminder garansi** | Fitur warga `/pantau`, script pengingat otomatis harian `npm run pengingat` (`backend/src/pengingat.js` & `kirimPengingat.js`) untuk jadwal H-60, H-30, dan H-7 tanpa kirim ganda (`pengingat_log`), serta panel kontrol di `/dinas/proyek`. |

---

## 🧰 Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| **Frontend** | React 19, React Router 8, Vite 8, Tailwind CSS 4 (`@theme`), React Leaflet 5 + Leaflet 1.9 |
| **Backend** | Node.js 22+, Express 5, Multer 2 (unggah foto ≤ 5 MB), Nodemailer 10 (SMTP Gmail), Cheerio 1 |
| **Database** | Supabase (PostgreSQL + Row Level Security aktif) |
| **Pengujian** | Node built-in test runner (`node --test`) |

---

## 🚀 Cara Menjalankan

> Prasyarat: Node.js 22+ dan project Supabase.

### 1. Siapkan Database Supabase

Jalankan keempat file SQL berikut secara berurutan di **Supabase SQL Editor**:

1. `backend/supabase/schema.sql`
2. `backend/supabase/migrasi-001-layar-warga.sql`
3. `backend/supabase/migrasi-002-dinas.sql`
4. `backend/supabase/migrasi-003-sandi-warga.sql`

### 2. Konfigurasi Environment

Salin template env untuk backend dan frontend:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Isi `backend/.env`:

- **Wajib:** `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (secret / service role key), dan `ADMIN_KEY` (string acak panjang).
- **Email SMTP (opsional untuk pengembangan):** `GMAIL_USER` dan `GMAIL_APP_PASSWORD` (App Password 16 huruf). Jika kosong, isi email dicetak ke terminal backend.
- **Google OAuth (opsional):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_REDIRECT_URI` (bawaan `http://localhost:5173/api/auth/google/callback`).

### 3. Jalankan Backend & Frontend

Buka dua terminal terpisah:

```bash
# Terminal 1 — Backend API (http://localhost:3000)
cd backend
npm install
npm run dev
```

```bash
# Terminal 2 — Frontend Vite (http://localhost:5173)
cd frontend
npm install
npm run dev
```

`frontend/vite.config.js` sudah mem-proxy `/api` dan `/uploads` ke target `VITE_API_URL` (`http://localhost:3000`).

### 4. Mengisi Data, Akun Petugas, & Cron Pengingat

Semua perintah berikut dijalankan dari folder `backend/`:

```bash
# Tarik data paket jalan dari LPSE Sidoarjo
npm run scrape                           # mode uji (tanpa simpan)
npm run scrape -- --tahun=all --save     # tarik semua tahun dan simpan ke DB
node --env-file=.env src/scraper/geocodeUlang.js  # lengkapi koordinat yang masih kosong

# Isi atau hapus data simulasi skenario (proyek & laporan di semua status)
npm run seed
npm run seed -- --pelapor=email@warga.com   # kaitkan sebagian laporan ke akun warga tertentu
npm run seed -- --hapus                     # hapus seluruh data seed

# Buat akun petugas Dinas PU (sandi sementara dicetak sekali di terminal)
npm run petugas -- --email=petugas@pu.sidoarjokab.go.id --nama="Nama Petugas" --nip=198701012010011001

# Jalankan pengecekan & pengiriman pengingat garansi H-60 / H-30 / H-7 (cocok untuk cron harian)
npm run pengingat

# Jalankan seluruh test backend
npm test
```

### 5. Mode Produksi Satu Server

Backend dapat menyajikan hasil build `frontend/dist` secara langsung sehingga frontend dan API berjalan di satu origin:

```bash
cd frontend && npm run build
```

Lalu aktifkan di `backend/.env`:

```env
FRONTEND_DIST=../frontend/dist
TRUST_PROXY=1
HOST=127.0.0.1
```

Jalankan server dengan `cd backend && npm start`.

---

## 🔌 Daftar Endpoint API

Semua respons sukses memakai format `{ data: ... }`, sedangkan error memakai `{ error: { code, message } }`.

### Publik & Warga

| Method & Path | Keterangan |
| --- | --- |
| `GET /api/health` | Status kesehatan API |
| `GET /api/proyek` | Daftar proyek (`?q=`, `lokasi=`, `tahun=`, `status=ok,warn,exp`, `limit=`) |
| `GET /api/proyek/ringkasan` | Ringkasan jumlah proyek, daftar lokasi, dan tahun |
| `GET /api/proyek/sekitar` | Proyek dalam radius tertentu (`?lat=`, `lng=`, `radius=`) |
| `GET /api/proyek/:slug` | Detail proyek dan status garansinya |
| `GET /api/proyek/:slug/riwayat` | Riwayat paket tender pada ruas yang sama |
| `GET /api/kontraktor` | Daftar rapor kontraktor (`?tahun=`, `lokasi=`, `urut=nilai\|laporan\|nama`) |
| `GET /api/kontraktor/:id` | Detail profil, proyek, dan laporan garansi kontraktor |
| `GET /api/peta` | Data proyek dan laporan aktif untuk peta beranda & `/peta` |
| `GET /api/peta/laporan` | Daftar laporan terverifikasi untuk peta kerusakan |
| `GET /api/laporan` | Daftar laporan terverifikasi (`?status=`, `garansi=`, `telat=1`, `proyek=`, `limit=`) |
| `GET /api/laporan/saya` | Riwayat laporan milik warga yang sedang masuk |
| `GET /api/laporan/:kode` | Detail laporan, riwayat status, dan laporan berdekatan (tanpa data pribadi pelapor) |
| `POST /api/laporan/cek-foto` | Cek geotag, umur, keaslian, dan duplikat foto sebelum dikirim *(wajib login warga)* |
| `POST /api/laporan` | Kirim laporan baru (multipart maks. 3 foto) *(wajib login warga)* |
| `POST /api/laporan/:kode/konfirmasi` | Pelapor mengonfirmasi perbaikan selesai (verifikasi email pelapor) |
| `POST /api/laporan/:kode/buka-lagi` | Pelapor menolak status selesai agar dikerjakan ulang |
| `PATCH /api/laporan/:kode` | Pembaruan status via `Authorization: Bearer ADMIN_KEY` |
| `POST /api/pantau` | Daftarkan pengingat garansi ruas untuk warga |
| `GET /api/statistik` | Statistik agregat & tren per kecamatan untuk `/data` |
| `GET /api/ekspor/:berkas` | Unduh `proyek.csv`, `proyek.geojson`, `laporan.csv`, `laporan.geojson`, `kontraktor.csv` |

### Autentikasi Warga (`/api/auth`)

| Method & Path | Keterangan |
| --- | --- |
| `POST /api/auth/daftar` | Daftar akun baru & kirim kode verifikasi 6 angka ke email |
| `POST /api/auth/verifikasi` | Verifikasi kode email untuk mengaktifkan akun & sesi |
| `POST /api/auth/masuk` | Masuk dengan email dan kata sandi |
| `GET /api/auth/saya` | Profil warga yang sedang masuk |
| `POST /api/auth/keluar` | Hapus sesi warga |
| `GET /api/auth/google`, `/api/auth/google/callback` | Alur masuk dengan Google OAuth |

### Dashboard Dinas (`/api/dinas`)

Endpoint selain `/masuk`, `/keluar`, dan `/saya` mewajibkan sesi cookie petugas (`cj_dinas`) atau header `Authorization: Bearer ADMIN_KEY`.

| Method & Path | Keterangan |
| --- | --- |
| `POST /api/dinas/masuk`, `POST /api/dinas/keluar`, `GET /api/dinas/saya` | Masuk, keluar, dan cek sesi petugas |
| `GET /api/dinas/ringkasan` | Angka antrean laporan masuk, perlu verifikasi, lewat tenggat, dan selesai bulan ini |
| `GET /api/dinas/laporan`, `GET /api/dinas/laporan.csv` | Daftar seluruh laporan (`?tab=`, `kecamatan=`) & ekspor CSV |
| `GET /api/dinas/laporan/:kode` | Detail laporan lengkap termasuk koordinat EXIF & potensi duplikat |
| `POST /api/dinas/laporan/:kode/verifikasi` | Aksi `teruskan`, `foto_ulang`, atau `tolak` |
| `POST /api/dinas/laporan/:kode/mulai` | Tandai laporan mulai dikerjakan |
| `POST /api/dinas/laporan/:kode/bukti` | Unggah `foto_sesudah` perbaikan beserta cek geotag |
| `POST /api/dinas/laporan/:kode/setujui`, `POST /api/dinas/laporan/:kode/kembalikan` | Setujui perbaikan ke konfirmasi warga atau kembalikan ke kontraktor |
| `GET /api/dinas/peta`, `GET /api/dinas/peta.geojson` | Data peta dinas (`?bulan=`, `kecamatan=`, `status=`) & unduhan GeoJSON |
| `GET /api/dinas/proyek` | Daftar proyek beserta sisa persentase masa garansi & jumlah laporan |
| `GET /api/dinas/pengingat`, `PUT /api/dinas/pengingat` | Lihat & ubah jadwal pengingat otomatis serta log pengiriman |
| `POST /api/dinas/pengingat/:proyekId` | Kirim pengingat garansi manual ke pemantau proyek terkait |
| `GET /api/dinas/rapor` | Rapor seluruh kontraktor beserta ringkasan evaluasi |
| `GET /api/dinas/ekspor/rekap`, `GET /api/dinas/ekspor/riwayat` | Pratinjau rekap bulanan & riwayat ekspor |
| `POST /api/dinas/ekspor/log`, `GET /api/dinas/ekspor/:jenis.csv` | Catat log cetak PDF & unduh CSV (`rekap`, `rapor`, `garansi`) |

---

## 📁 Struktur Project

```text
cekjalan/
├─ frontend/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ public/foto/             # aset foto bawaan & bukti contoh
│  └─ src/
│     ├─ App.jsx               # routing portal warga & dashboard dinas
│     ├─ main.jsx
│     ├─ index.css             # Tailwind CSS v4 + design token warga & dinas
│     ├─ data.js
│     ├─ lib/                  # client API, konteks auth warga, formatter
│     ├─ components/           # Header, Footer, LayoutDinas, PapanProyek, Peta*, KameraLapor, NilaiRapor, ui
│     └─ pages/                # halaman warga (Beranda, Peta, Lapor, Lacak, Pantau, Rapor, Data, Auth)
│        └─ dinas/             # 8 halaman petugas Dinas PU (D01–D08)
└─ backend/
   ├─ package.json
   ├─ supabase/                # schema.sql + migrasi-001 s.d. migrasi-003
   ├─ uploads/                 # penyimpanan lokal foto laporan unggahan warga/petugas
   ├─ test/                    # unit test (exif, cekFoto, garansi, laporan, rapor, pengingat, petugas, limiter, email, validasi)
   └─ src/
      ├─ app.js & server.js    # Express app, static uploads/frontend, error handler
      ├─ routes/               # proyek, laporan, kontraktor, peta, auth, pantau, data, dinas
      ├─ scraper/              # scraper LPSE Sidoarjo & geocoder Nominatim
      ├─ pengingat/ & petugas/ # CLI cron pengingat garansi & pembuat akun petugas
      ├─ cekFoto.js & exif.js  # parser EXIF & validasi foto otomatis
      ├─ rapor.js & raporData.js
      ├─ pengingat.js & kirimPengingat.js
      ├─ email.js, sesi.js, petugas.js, admin.js, limiter.js, ekspor.js, garansi.js, laporan.js, validasi.js
      └─ seed.js
```

---

## 📝 Catatan Data & Progress

- **Data LPSE & estimasi garansi:** paket proyek jalan asli ditarik dari pengumuman pemenang LPSE Kabupaten Sidoarjo. Karena LPSE tidak mencatat tanggal serah terima (PHO/FHO) maupun masa pemeliharaan, proyek hasil scrape diberi perkiraan selesai pada `31 Desember` tahun anggaran terkait dengan masa pemeliharaan `12 bulan` (proyek tahun berjalan dibiarkan kosong). Angka ini akan diganti data resmi Dinas PU bila tersedia.
- **Data simulasi (`seed.js`):** proyek Jalan Pahlawan dkk., 3 nama kontraktor tambahan (`PT Marga Wisesa Konstruksi`, `CV Delta Aspal Mandiri`, `PT Lintas Karya Bangunindo`), serta laporan awal lintas status dipakai untuk mendemokan alur pelaporan lengkap dari hulu ke hilir.
- **Progress terbaru:** seluruh portal warga (14 layar responsif), dashboard petugas Dinas PU (8 layar), validasi foto EXIF/geotag, sistem rapor & pengingat garansi, email HTML terformat, test suite backend, serta deployment live telah selesai diintegrasikan.
