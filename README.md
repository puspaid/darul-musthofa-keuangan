<div align="center">

# 📗 Buku Kas Digital — Pondok Pesantren Darul Musthofa

**Aplikasi pembukuan keuangan (pemasukan & pengeluaran) berbasis web, tanpa biaya hosting database, dibangun di atas ekosistem Google Workspace.**

[![Made with HTML5](https://img.shields.io/badge/Frontend-HTML5%20%7C%20Tailwind%20%7C%20JS-0F6E5B?style=flat-square)](#)
[![Backend](https://img.shields.io/badge/Backend-Google%20Apps%20Script-B8912F?style=flat-square)](#)
[![Database](https://img.shields.io/badge/Database-Google%20Sheets-0F6E5B?style=flat-square)](#)
[![Storage](https://img.shields.io/badge/Storage-Google%20Drive-B8912F?style=flat-square)](#)
[![Deploy](https://img.shields.io/badge/Hosting-GitHub%20Pages-181717?style=flat-square&logo=github)](#)
[![License](https://img.shields.io/badge/License-MIT-6B7A75?style=flat-square)](#)

</div>

---

## 📌 Ringkasan

Pondok Pesantren Darul Musthofa membutuhkan sistem pembukuan yang **rapi, real-time, dan bisa diakses tanpa biaya server bulanan**. Proyek ini menjawab kebutuhan tersebut dengan arsitektur *serverless*: frontend statis di GitHub Pages, dan Google Sheets + Google Drive sebagai database & penyimpanan file — dijembatani oleh Google Apps Script sebagai REST API.

Dibangun end-to-end: dari desain sistem, skema database, autentikasi, hingga UI/UX — sebagai bagian dari kontribusi digitalisasi administrasi pesantren yang saya kerjakan secara mandiri.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 📊 **Dashboard Real-Time** | Ringkasan saldo, total pemasukan/pengeluaran bulan berjalan, dan grafik tren 12 bulan (Chart.js) |
| ✍️ **Input Transaksi Terstruktur** | Form terpisah pemasukan (SPP, Donasi, Unit Usaha) & pengeluaran (dapur, listrik, gaji, dll) dengan validasi |
| 🧾 **Nomor Referensi Otomatis** | Setiap transaksi mendapat ID unik, contoh: `DM-IN-20260707-001` |
| 📎 **Upload Bukti ke Google Drive** | Foto nota/transfer otomatis tersimpan & tertaut ke Google Drive, terorganisir per tahun/bulan |
| 📅 **Filter Multi-Periode** | Rekap Harian / Mingguan / Bulanan dihitung real-time dari data harian |
| 📈 **Rekap Otomatis** | Setiap input baru langsung memicu kalkulasi ulang rekap bulanan & tahunan di backend |
| 📤 **Laporan yang Bisa Dibagikan** | Generate laporan resmi ke Google Sheet arsip + bagikan via WhatsApp/link view-only |
| 💰 **Auto-Format Rupiah** | Input nominal otomatis berformat ribuan (`Rp 1.500.000`) untuk mencegah salah ketik |
| 🔐 **Proteksi PIN Bertingkat** | Token sesi ditandatangani (HMAC) & kedaluwarsa otomatis — aman meski kode berada di repo publik |

---

## 🏗️ Arsitektur

```
┌─────────────────────┐         HTTPS (fetch)        ┌──────────────────────────┐
│   GitHub Pages        │ ───────────────────────────▶ │  Google Apps Script Web  │
│   (Frontend statis)   │ ◀─────────────────────────── │  App (REST-like API)     │
│  HTML · Tailwind · JS  │        JSON response         └────────────┬─────────────┘
└─────────────────────┘                                            │
                                                          ┌──────────┴───────────┐
                                                          ▼                      ▼
                                                 ┌─────────────────┐   ┌──────────────────┐
                                                 │  Google Sheets   │   │   Google Drive    │
                                                 │  (Database)      │   │ (Bukti & Arsip)   │
                                                 └─────────────────┘   └──────────────────┘
```

**Kenapa arsitektur ini?** Nol biaya hosting database, cukup familiar untuk diaudit pengurus yayasan (data tetap berbentuk spreadsheet yang bisa dibuka manual), dan cukup ringan untuk skala transaksi harian sebuah pesantren.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Chart.js
- **Backend:** Google Apps Script (V8 runtime)
- **Database:** Google Sheets
- **File Storage:** Google Drive API
- **Autentikasi:** Token sesi stateless bertanda tangan HMAC-SHA256
- **Hosting:** GitHub Pages (static)

---

## 📂 Struktur Proyek

```
darul-musthofa-keuangan/
├── index.html              # Halaman login (proteksi PIN)
├── dashboard.html           # Ringkasan & grafik tren
├── input.html                # Form input transaksi
├── laporan.html              # Filter periode & generate laporan
├── assets/
│   ├── css/style.css        # Design system (tema emerald & gold)
│   └── js/                   # Modul: config, auth, api, layout, dsb.
└── backend/
    ├── Code.gs                # API backend (Apps Script)
    └── appsscript.json        # Manifest project
```

---

## 🚀 Menjalankan Proyek Ini

Panduan instalasi lengkap (setup Google Sheets, Apps Script, Script Properties,
hingga deploy ke GitHub Pages) tersedia di [`SETUP.md`](./SETUP.md).

Ringkas:
1. Deploy `backend/Code.gs` sebagai Google Apps Script Web App.
2. Tempel URL Web App ke `assets/js/config.js`.
3. Push ke GitHub, aktifkan GitHub Pages dari branch `main`.

---

## 🔒 Catatan Keamanan

Karena frontend bersifat publik (GitHub Pages), PIN admin **tidak pernah disimpan
di kode**. PIN diverifikasi sepenuhnya di backend dan menghasilkan token sesi
bertanda tangan yang kedaluwarsa otomatis — pendekatan yang cukup untuk skala
aplikasi internal seperti ini.

---

## 👩‍💻 Tentang Pengembang

Dibangun oleh **Fidyah Kumala Puspa Ratih** — pendidik & digital developer di
Yayasan Darul Musthofa, mahasiswa Teknologi Pendidikan Universitas Terbuka.
Proyek ini merupakan bagian dari inisiatif digitalisasi administrasi pesantren
yang dikerjakan secara mandiri, mencakup perancangan sistem, backend, hingga
antarmuka pengguna.

📫 Proyek terkait lainnya: *Portal Digital Santri*, *Ready to Perform! (AI Career Prediction)*

---

<div align="center">
<sub>Dibuat dengan 🤍 untuk kemajuan administrasi pesantren.</sub>
</div>
