Layout.init("input");

const jenisInput = document.getElementById("jenis-transaksi");
const kategoriSelect = document.getElementById("input-kategori");
const kategoriCustomWrap = document.getElementById("kategori-custom-wrap");
const kategoriCustomInput = document.getElementById("input-kategori-custom");
const KATEGORI_CUSTOM_VALUE = "__CUSTOM__";

const adminSelect = document.getElementById("input-admin");
const tabPemasukan = document.getElementById("tab-pemasukan");
const tabPengeluaran = document.getElementById("tab-pengeluaran");
const nominalInput = document.getElementById("input-nominal");

attachCurrencyFormatter(nominalInput);

// Isi default tanggal/waktu/hari
document.getElementById("input-tanggal").value = todayISO();
document.getElementById("input-waktu").value = nowTime();
document.getElementById("input-hari").value = namaHari(new Date());
document.getElementById("input-tanggal").addEventListener("change", (e) => {
  const d = new Date(e.target.value + "T00:00:00");
  document.getElementById("input-hari").value = namaHari(d);
});

// Isi dropdown admin dari config
CONFIG.DAFTAR_ADMIN.forEach((nama) => {
  const opt = document.createElement("option");
  opt.value = nama;
  opt.textContent = nama;
  adminSelect.appendChild(opt);
});
if (Auth.getAdminName()) adminSelect.value = Auth.getAdminName();

function fillKategori(jenis) {
  kategoriSelect.innerHTML = "";
  const list = jenis === "Pemasukan" ? CONFIG.KATEGORI_PEMASUKAN : CONFIG.KATEGORI_PENGELUARAN;
  list.forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    kategoriSelect.appendChild(opt);
  });

  const optCustom = document.createElement("option");
  optCustom.value = KATEGORI_CUSTOM_VALUE;
  optCustom.textContent = "+ Kategori lain (tulis sendiri)";
  kategoriSelect.appendChild(optCustom);

  toggleKategoriCustom();
}

function toggleKategoriCustom() {
  const isCustom = kategoriSelect.value === KATEGORI_CUSTOM_VALUE;
  kategoriCustomWrap.style.display = isCustom ? "block" : "none";
  kategoriCustomInput.required = isCustom;
  if (!isCustom) kategoriCustomInput.value = "";
}

kategoriSelect.addEventListener("change", toggleKategoriCustom);

function setTab(jenis) {
  jenisInput.value = jenis;
  fillKategori(jenis);
  if (jenis === "Pemasukan") {
    tabPemasukan.className = "btn";
    tabPemasukan.style.background = "var(--dm-emerald)";
    tabPemasukan.style.color = "#fff";
    tabPengeluaran.className = "btn btn-secondary";
    tabPengeluaran.style.border = "none";
  } else {
    tabPengeluaran.className = "btn";
    tabPengeluaran.style.background = "var(--dm-brick)";
    tabPengeluaran.style.color = "#fff";
    tabPemasukan.className = "btn btn-secondary";
    tabPemasukan.style.border = "none";
  }
}

tabPemasukan.addEventListener("click", () => setTab("Pemasukan"));
tabPengeluaran.addEventListener("click", () => setTab("Pengeluaran"));
setTab("Pemasukan");

/** Ubah File menjadi base64 (tanpa prefix data:...;base64,) */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("transaksi-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submit-btn");

  const nominal = parseRibuan(nominalInput.value);
  if (nominal <= 0) {
    showToast("Nominal harus lebih dari 0", "error");
    return;
  }

  let kategoriFinal = kategoriSelect.value;
  if (kategoriFinal === KATEGORI_CUSTOM_VALUE) {
    kategoriFinal = kategoriCustomInput.value.trim();
    if (!kategoriFinal) {
      showToast("Kategori tulisan sendiri tidak boleh kosong", "error");
      return;
    }
  }

  const payload = {
    jenis: jenisInput.value,
    hari: document.getElementById("input-hari").value,
    tanggal: document.getElementById("input-tanggal").value,
    waktu: document.getElementById("input-waktu").value,
    kategori: kategoriFinal,
    nominal,
    keterangan: document.getElementById("input-keterangan").value.trim(),
    adminPenanggungJawab: adminSelect.value,
  };

  const fileEl = document.getElementById("input-bukti");
  setButtonLoading(btn, true, "Menyimpan...");

  try {
    if (fileEl.files && fileEl.files[0]) {
      const file = fileEl.files[0];
      payload.fileBase64 = await fileToBase64(file);
      payload.fileName = file.name;
      payload.mimeType = file.type || "application/octet-stream";
    }

    const res = await Api.post("addTransaksi", payload);
    if (res.success) {
      showToast(`Transaksi tersimpan (No. Ref: ${res.noRef})`, "success");
      document.getElementById("transaksi-form").reset();
      document.getElementById("input-tanggal").value = todayISO();
      document.getElementById("input-waktu").value = nowTime();
      document.getElementById("input-hari").value = namaHari(new Date());
      if (Auth.getAdminName()) adminSelect.value = Auth.getAdminName();
      toggleKategoriCustom();
    } else {
      showToast(res.message || "Gagal menyimpan transaksi", "error");
    }
  } catch (err) {
    showToast(err.message || "Terjadi kesalahan saat menyimpan", "error");
  } finally {
    setButtonLoading(btn, false);
  }
});
