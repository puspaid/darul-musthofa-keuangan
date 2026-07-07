/**
 * auth.js
 * ------------------------------------------------------------
 * Karena aplikasi ini dideploy statis di GitHub Pages (publik), proteksi PIN
 * dilakukan dengan bantuan backend: PIN yang benar (disimpan sebagai Script
 * Property di Google Apps Script, BUKAN di kode frontend) menghasilkan token
 * sesi yang ditandatangani (signed) dan punya batas waktu. Token inilah yang
 * disimpan di localStorage dan dikirim ulang pada setiap aksi tulis. Backend
 * memverifikasi tanda tangan token pada setiap permintaan.
 * ------------------------------------------------------------
 */

const Auth = {
  STORAGE_KEY: "dm_session_token",
  ADMIN_NAME_KEY: "dm_admin_name",

  getToken() {
    return localStorage.getItem(this.STORAGE_KEY) || "";
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setSession(token, adminName) {
    localStorage.setItem(this.STORAGE_KEY, token);
    if (adminName) localStorage.setItem(this.ADMIN_NAME_KEY, adminName);
  },

  getAdminName() {
    return localStorage.getItem(this.ADMIN_NAME_KEY) || "";
  },

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ADMIN_NAME_KEY);
  },

  /** Panggil ini di awal setiap halaman selain index.html (login) */
  guardPage() {
    if (!this.isLoggedIn()) {
      window.location.href = "index.html";
    }
  },

  async login(pin) {
    const res = await Api.post("login", { pin });
    if (res.success) {
      this.setSession(res.token, res.adminName || "");
    }
    return res;
  },
};
