# Buku Kas Digital — Pondok Pesantren Darul Musthofa

Aplikasi pembukuan keuangan (pemasukan & pengeluaran) untuk Ponpes Darul Musthofa.
Frontend statis (GitHub Pages) + Backend Google Apps Script (Google Sheets sebagai
database, Google Drive sebagai penyimpanan file).

## Struktur Proyek

```
darul-musthofa-keuangan/
├── index.html              ← Halaman login (PIN)
├── dashboard.html           ← Ringkasan & grafik tren
├── input.html                ← Form input transaksi
├── laporan.html              ← Filter periode + generate laporan
├── assets/
│   ├── css/style.css        ← Semua styling (tema emerald/gold)
│   └── js/
│       ├── config.js         ← ⚠️ WAJIB DIISI: URL backend & pengaturan
│       ├── utils.js           ← Format Rupiah, tanggal, toast, dll.
│       ├── api.js             ← Wrapper fetch ke Google Apps Script
│       ├── auth.js            ← Sesi login & token
│       ├── layout.js          ← Sidebar & navigasi bersama
│       ├── dashboard.js
│       ├── transaksi.js
│       └── laporan.js
├── backend/
│   ├── Code.gs                ← Kode backend Apps Script
│   └── appsscript.json        ← Manifest project Apps Script
└── README.md                  ← Panduan ini
```

---

## BAGIAN 1 — Menyiapkan Backend (Google Sheets + Apps Script)

### 1.1 Buat Spreadsheet
1. Login ke akun **edupuspa@gmail.com** di [sheets.google.com](https://sheets.google.com).
2. Buat spreadsheet baru, beri nama misalnya **"DB Keuangan Darul Musthofa"**.
3. Buka menu **Extensions → Apps Script**.

### 1.2 Tempel kode backend
1. Di editor Apps Script, hapus isi file `Code.gs` default lalu tempel seluruh isi
   file `backend/Code.gs` dari proyek ini.
2. Klik ikon **⚙️ Project Settings**, centang **"Show appsscript.json manifest file"**.
3. Buka file `appsscript.json` yang muncul, ganti isinya dengan isi file
   `backend/appsscript.json` dari proyek ini.

### 1.3 Jalankan setup satu kali
1. Di dropdown fungsi (atas editor), pilih fungsi `setup`.
2. Klik **Run**. Saat diminta izin, klik **Review permissions → pilih akun
   edupuspa@gmail.com → Advanced → Buka (nama proyek) (tidak aman) → Allow**.
   (Peringatan "tidak aman" muncul karena aplikasi belum diverifikasi Google —
   ini normal untuk aplikasi internal seperti ini.)
3. Fungsi ini akan otomatis membuat:
   - Sheet `Transaksi`, `RekapBulanan`, `RekapTahunan` di spreadsheet Anda.
   - Folder **"Buku Kas Digital - Darul Musthofa"** di Google Drive akun
     edupuspa@gmail.com (dengan subfolder yang terbentuk otomatis saat transaksi
     pertama masuk).
   - Dua **Script Properties**: `ADMIN_PIN` (default `123456`) dan `SESSION_SECRET`.

### 1.4 Ganti PIN Admin (WAJIB, jangan lewati)
1. Di editor Apps Script, buka **Project Settings → Script Properties**.
2. Cari `ADMIN_PIN`, klik edit, ganti `123456` dengan PIN rahasia pilihan Anda
   (angka 6-8 digit disarankan).
3. PIN ini **tidak pernah disimpan di kode frontend**, sehingga aman meski
   repositori GitHub Anda publik.

### 1.5 Deploy sebagai Web App
1. Klik tombol **Deploy → New deployment**.
2. Klik ikon gerigi di samping "Select type" → pilih **Web app**.
3. Isi:
   - **Execute as:** Me (edupuspa@gmail.com)
   - **Who has access:** Anyone
4. Klik **Deploy**, lalu **Authorize access** jika diminta lagi.
5. Salin **Web app URL** yang muncul (formatnya seperti
   `https://script.google.com/macros/s/AKfycb.../exec`). URL inilah yang akan
   dipakai frontend.

> Setiap kali Anda mengedit `Code.gs` di kemudian hari, Anda harus membuat
> **New deployment** lagi (atau *Manage deployments → Edit → New version*) agar
> perubahan berlaku pada URL yang sama.

---

## BAGIAN 2 — Menyiapkan Frontend

### 2.1 Isi konfigurasi
Buka `assets/js/config.js`, ubah baris berikut dengan URL Web App dari langkah 1.5:

```javascript
API_URL: "https://script.google.com/macros/s/xxxxxxxxxxxx/exec",
```

Sesuaikan juga (opsional):
- `DAFTAR_ADMIN`: nama-nama admin yang tampil di dropdown form.
- `KATEGORI_PEMASUKAN` / `KATEGORI_PENGELUARAN`: kategori transaksi.

### 2.2 Uji coba lokal (opsional)
Buka `index.html` langsung di browser, atau jalankan server lokal sederhana:
```bash
npx serve .
```
Login menggunakan PIN yang sudah Anda atur di langkah 1.4.

---

## BAGIAN 3 — Deploy ke GitHub Pages

1. Buat repositori baru di GitHub, misalnya `darul-musthofa-keuangan`.
2. Upload seluruh isi folder ini (kecuali folder `backend/`, yang hanya
   dipakai sebagai referensi — boleh disertakan atau tidak, tidak
   memengaruhi situs karena isinya tidak dieksekusi oleh GitHub Pages).
3. Masuk ke **Settings → Pages** pada repositori.
4. Pada **Source**, pilih branch `main` dan folder `/ (root)`.
5. Klik **Save**. Tunggu 1–2 menit, situs akan aktif di:
   `https://<username-anda>.github.io/darul-musthofa-keuangan/`
6. Buka URL tersebut → halaman login akan muncul. Selesai!

---

## Cara Kerja Singkat

- **Autentikasi:** PIN diverifikasi oleh backend (bukan dicek di frontend),
  menghasilkan token bertanda tangan (HMAC) yang kedaluwarsa otomatis setelah
  12 jam. Token ini yang dikirim ulang pada setiap permintaan data maupun
  penyimpanan transaksi.
- **Input transaksi:** Setiap transaksi baru menghasilkan nomor referensi
  otomatis (`DM-IN-20260707-001` / `DM-OUT-20260707-001`), dan langsung memicu
  perhitungan ulang rekap bulanan & tahunan di sheet `RekapBulanan` /
  `RekapTahunan`.
- **Upload bukti:** File dikirim sebagai base64 dari browser, lalu backend
  menuliskannya sebagai file ke Google Drive (folder per tahun/bulan) dan
  mengatur aksesnya menjadi "siapa saja yang punya link boleh melihat", lalu
  menyimpan link tersebut di baris transaksi terkait.
- **Laporan:** Filter Harian/Mingguan/Bulanan dihitung langsung dari data
  `Transaksi` setiap kali diminta, sehingga selalu real-time meski input
  dilakukan harian. Tombol "Generate & Simpan ke Drive" membuat Google Sheet
  laporan baru di folder arsip, dengan izin view-only, siap dibagikan lewat
  WhatsApp atau disalin linknya.

## Catatan Keamanan

Ini adalah proteksi PIN sederhana yang memadai untuk aplikasi internal skala
kecil seperti pembukuan pesantren — bukan sistem keamanan tingkat enterprise.
Untuk keamanan tambahan di kemudian hari, pertimbangkan: PIN yang lebih panjang,
rotasi `SESSION_SECRET` secara berkala, dan membatasi `Who has access` Web App
apabila Google Workspace Anda mendukung domain terbatas.

## Kustomisasi Lanjutan

- **Ganti warna tema:** semua warna didefinisikan sebagai CSS variable di
  bagian atas `assets/css/style.css` (`--dm-emerald`, `--dm-gold`, dst).
- **Tambah kategori:** edit array `KATEGORI_PEMASUKAN` / `KATEGORI_PENGELUARAN`
  di `config.js`, tidak perlu mengubah backend.
- **Tambah admin:** tambahkan nama ke `DAFTAR_ADMIN` di `config.js`.
