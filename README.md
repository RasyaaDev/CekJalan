<div align="center">

# 🚧 CekJalan

**Cek siapa yang membangun jalan di depan rumahmu.**

Landing page untuk mengecek kontrak proyek jalan di Sidoarjo — siapa kontraktornya, berapa nilai kontraknya, dan sampai kapan masa garansinya. Selama jalan masih dalam masa pemeliharaan, perbaikan menjadi kewajiban kontraktor; CekJalan membuat informasi itu terbuka untuk warga.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)

</div>

---

## ✨ Fitur

- 🔎 **Hero + pencarian jalan** — titik masuk utama buat warga mencari ruas jalan.
- 🪧 **Papan informasi proyek digital** — pelaksana, nilai kontrak, sumber dana, masa pemeliharaan.
- 🗺️ **Peta proyek interaktif** — Leaflet + OpenStreetMap, warna titik mengikuti status garansi.
- ⏳ **Timeline masa garansi** — menjelaskan siapa yang menanggung perbaikan di tiap tahap.
- 📣 **Alur pelaporan warga** — dari foto kerusakan sampai laporan selesai dipantau.
- 📊 **Rapor kontraktor** — rekam jejak tiap kontraktor secara terbuka.
- 🏛️ **Panel instansi** — tampilan dashboard untuk Dinas PU Bina Marga.

## 🧰 Tech Stack

| Kategori | Teknologi |
| --- | --- |
| UI Library | React 19 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 (CSS-first `@theme`) |
| Peta | React Leaflet 5 + Leaflet (tile OpenStreetMap) |

## 🚀 Cara Menjalankan

> Prasyarat: Node.js 20.19+ (disarankan 22+).

```bash
# 1. Clone
git clone <URL-REPO-ANDA>
cd cekjalan

# 2. Install dependency
npm install

# 3. Jalankan mode development
npm run dev      # buka http://localhost:5173
```

Perintah lain:

```bash
npm run build    # build produksi ke folder dist/
npm run preview  # pratinjau hasil build
```

## 📁 Struktur Project

```
src/
├─ App.jsx             # merangkai seluruh section landing page
├─ main.jsx            # entry point React
├─ index.css           # import Tailwind + tema warna/font (@theme)
├─ data.js             # teks & angka konten
└─ components/
   ├─ Header.jsx       # navigasi
   ├─ Footer.jsx       # footer
   ├─ PapanProyek.jsx  # kartu papan informasi proyek
   ├─ PetaProyek.jsx   # peta Leaflet + OpenStreetMap
   └─ ui.jsx           # komponen reusable (Tombol, StatusGaransi, Marka, Foto, Tag, JudulSeksi)
public/foto/           # aset foto landing page
```

## 📌 Progress Saat Ini

✅ **Landing page lengkap (single page)** dengan 10 section: Hero + pencarian, papan informasi proyek, peta proyek interaktif, timeline masa garansi, alur pelaporan warga, daftar laporan terbaru, rapor kontraktor, panel untuk Dinas PU Bina Marga, FAQ, dan ajakan melapor.
