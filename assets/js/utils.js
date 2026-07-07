/**
 * utils.js — helper murni, tidak bergantung pada halaman tertentu
 */

/** Format angka menjadi "Rp 1.500.000" */
function formatRupiah(angka) {
  const n = Number(angka) || 0;
  return "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

/** Format angka dengan pemisah ribuan saja (tanpa "Rp"), untuk isi input */
function formatRibuan(angka) {
  const digits = String(angka).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

/** Ambil angka murni dari string berformat "1.500.000" -> 1500000 */
function parseRibuan(str) {
  return Number(String(str).replace(/\D/g, "")) || 0;
}

/** Pasang auto-format pemisah ribuan pada sebuah <input> */
function attachCurrencyFormatter(inputEl) {
  inputEl.addEventListener("input", () => {
    const caretFromEnd = inputEl.value.length - inputEl.selectionStart;
    inputEl.value = formatRibuan(inputEl.value);
    const pos = Math.max(inputEl.value.length - caretFromEnd, 0);
    inputEl.setSelectionRange(pos, pos);
  });
}

/** Nama hari dalam Bahasa Indonesia dari objek Date */
function namaHari(date) {
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return hari[date.getDay()];
}

/** Format tanggal "2026-07-07" -> "7 Juli 2026" */
function formatTanggalIndo(isoDate) {
  if (!isoDate) return "-";
  const d = new Date(isoDate + "T00:00:00");
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

/** Tanggal hari ini dalam format YYYY-MM-DD (untuk value <input type=date>) */
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Jam saat ini "HH:MM" */
function nowTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Tampilkan notifikasi toast di pojok kanan atas */
function showToast(message, type = "info", duration = 3600) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const icons = {
    success: "✓",
    error: "!",
    info: "•",
  };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span style="font-weight:700">${icons[type] || "•"}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .25s ease, transform .25s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(-6px)";
    setTimeout(() => el.remove(), 250);
  }, duration);
}

/** Toggle tombol menjadi state "loading" dengan spinner */
function setButtonLoading(btnEl, isLoading, loadingText = "Memproses...") {
  if (isLoading) {
    btnEl.dataset.originalText = btnEl.innerHTML;
    btnEl.disabled = true;
    btnEl.innerHTML = `<span class="spinner"></span> ${loadingText}`;
  } else {
    btnEl.disabled = false;
    btnEl.innerHTML = btnEl.dataset.originalText || btnEl.innerHTML;
  }
}

/** Debounce sederhana */
function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
