/**
 * api.js
 * ------------------------------------------------------------
 * Jembatan komunikasi Frontend (GitHub Pages) <-> Backend (GAS Web App).
 *
 * Catatan teknis penting:
 * - Permintaan GET dipakai untuk semua aksi BACA (dashboard, daftar transaksi,
 *   laporan) — parameter dikirim lewat query string.
 * - Permintaan POST dipakai untuk semua aksi TULIS (tambah transaksi, upload
 *   bukti, generate laporan) — body dikirim sebagai JSON dengan
 *   Content-Type "text/plain" agar browser TIDAK melakukan CORS preflight
 *   (Google Apps Script Web App tidak menangani preflight OPTIONS dengan baik).
 * - Setiap aksi TULIS wajib menyertakan token sesi (lihat auth.js).
 * ------------------------------------------------------------
 */

const Api = {
  async get(action, params = {}) {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("token", Auth.getToken());
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { method: "GET" });
    return Api._parse(res);
  },

  async post(action, payload = {}) {
    const body = JSON.stringify({ action, token: Auth.getToken(), ...payload });
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });
    return Api._parse(res);
  },

  async _parse(res) {
    if (!res.ok) {
      throw new Error(`Gagal menghubungi server (status ${res.status})`);
    }
    const data = await res.json();
    if (data && data.success === false && data.error === "unauthorized") {
      Auth.logout();
      window.location.href = "index.html";
      throw new Error("Sesi berakhir, silakan login kembali.");
    }
    return data;
  },
};
