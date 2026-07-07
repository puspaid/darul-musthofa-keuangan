Layout.init("laporan");

const periodeSelect = document.getElementById("filter-periode");
const tanggalInput = document.getElementById("filter-tanggal");
tanggalInput.value = todayISO();

async function loadLaporan() {
  const tbody = document.getElementById("laporan-tbody");
  tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Memuat data...</div></td></tr>`;
  try {
    const res = await Api.get("getLaporan", {
      periode: periodeSelect.value,
      tanggal: tanggalInput.value,
    });
    if (!res.success) throw new Error(res.message || "Gagal memuat laporan");

    document.getElementById("sum-income").textContent = formatRupiah(res.totalPemasukan);
    document.getElementById("sum-expense").textContent = formatRupiah(res.totalPengeluaran);
    document.getElementById("sum-net").textContent = formatRupiah(res.totalPemasukan - res.totalPengeluaran);

    if (!res.data || res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Tidak ada transaksi pada periode ini.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map((t) => `
      <tr>
        <td class="ref-id">${t.noRef}</td>
        <td>${formatTanggalIndo(t.tanggal)}</td>
        <td><span class="pill ${t.jenis === "Pemasukan" ? "pill-income" : "pill-expense"}">${t.jenis}</span></td>
        <td>${t.kategori}</td>
        <td>${t.keterangan || "-"}</td>
        <td>${t.adminPenanggungJawab || "-"}</td>
        <td style="text-align:right; font-family:var(--font-ledger); color:${t.jenis === "Pemasukan" ? "var(--dm-emerald)" : "var(--dm-brick)"};">
          ${t.jenis === "Pemasukan" ? "+" : "-"} ${formatRupiah(t.nominal)}
        </td>
        <td>${t.linkBukti ? `<a href="${t.linkBukti}" target="_blank" style="color:var(--dm-emerald); font-size:12.5px;">Lihat</a>` : "-"}</td>
      </tr>`).join("");
  } catch (err) {
    showToast(err.message || "Gagal memuat laporan", "error");
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Gagal memuat data.</div></td></tr>`;
  }
}

document.getElementById("apply-filter-btn").addEventListener("click", loadLaporan);
loadLaporan();

// ---------- Generate & Simpan Laporan ke Drive ----------
document.getElementById("generate-btn").addEventListener("click", async () => {
  const btn = document.getElementById("generate-btn");
  setButtonLoading(btn, true, "Membuat laporan...");
  try {
    const res = await Api.post("generateLaporan", {
      periode: periodeSelect.value,
      tanggal: tanggalInput.value,
    });
    if (res.success) {
      showToast("Laporan berhasil dibuat dan diarsipkan ke Drive", "success");
      document.getElementById("share-filename").textContent = res.fileName;
      document.getElementById("share-panel").style.display = "block";

      const waText = encodeURIComponent(
        `Laporan Keuangan ${CONFIG.NAMA_LEMBAGA} (${periodeSelect.value}):\n${res.viewUrl}`
      );
      document.getElementById("whatsapp-share-btn").href = `https://wa.me/?text=${waText}`;
      document.getElementById("copy-link-btn").onclick = () => {
        navigator.clipboard.writeText(res.viewUrl);
        showToast("Link laporan disalin ke clipboard", "success");
      };
    } else {
      showToast(res.message || "Gagal membuat laporan", "error");
    }
  } catch (err) {
    showToast(err.message || "Terjadi kesalahan", "error");
  } finally {
    setButtonLoading(btn, false);
  }
});
