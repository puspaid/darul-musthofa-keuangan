/**
 * config.js
 * ------------------------------------------------------------
 * Satu-satunya file yang WAJIB diubah setelah deploy backend.
 * Tempel URL Web App Google Apps Script Anda di bawah ini.
 * Contoh: https://script.google.com/macros/s/AKfycb.../exec
 * ------------------------------------------------------------
 */
const CONFIG = {
  // Ganti dengan URL Web App hasil deploy Google Apps Script Anda
  API_URL: "https://script.google.com/macros/s/AKfycbzqU9n67Q90OakSha7U4hv09YuKq0xITm29Mx43xYqF8KbUs8DdUvVpP4TIlVu8wfuivA/exec",

  // Nama pesantren, dipakai di berbagai tempat pada UI
  NAMA_LEMBAGA: "Pondok Pesantren Darul Musthofa",
  NAMA_APLIKASI: "Buku Kas Digital",

  // Kategori transaksi (harus SAMA PERSIS dengan yang ada di Code.gs)
  KATEGORI_PEMASUKAN: ["SPP", "Donasi", "Unit Usaha", "Lainnya"],
  KATEGORI_PENGELUARAN: ["Belanja Dapur", "Listrik & Air", "Gaji Pengajar", "Perawatan Gedung", "Lainnya"],

  // Nama-nama admin yang boleh login (harus SAMA PERSIS dengan sheet "Admin" di backend)
  // Ini hanya dipakai untuk mengisi dropdown "Nama Admin" pada form input.
  DAFTAR_ADMIN: ["Admin Keuangan"],["Firgiawan Cahyadi"],

  // Berapa lama sesi login (PIN) bertahan di browser (dalam jam) sebelum diminta login ulang
  SESSION_DURATION_HOURS: 12,
};
