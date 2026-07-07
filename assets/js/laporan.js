Layout.init("laporan");

const periodeSelect = document.getElementById("filter-periode");
const tanggalInput = document.getElementById("filter-tanggal");
tanggalInput.value = todayISO();

document.getElementById("report-kop").textContent = CONFIG.NAMA_LEMBAGA;

/** Label periode yang mudah dibaca, dipakai di kartu laporan & nama file */
function buildPeriodeLabel() {
  const labelJenis = { harian: "Harian", mingguan: "Mingguan", bulanan: "Bulanan" }[periodeSelect.value] || "";
  return `${labelJenis} — ${formatTanggalIndo(tanggalInput.value)}`;
}

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

    document.getElementById("report-periode").textContent = buildPeriodeLabel();
    document.getElementById("report-jumlah").textContent = (res.data || []).length;
    document.getElementById("report-footer").textContent =
      `Dibuat otomatis melalui Buku Kas Digital · ${formatTanggalIndo(todayISO())}`;

    if (!res.data || res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Tidak ada transaksi pada periode ini.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map((t) => `
      <tr>
        <td class="ref-id" data-label="No. Ref">${t.noRef}</td>
        <td data-label="Tanggal">${formatTanggalIndo(t.tanggal)}</td>
        <td data-label="Jenis"><span class="pill ${t.jenis === "Pemasukan" ? "pill-income" : "pill-expense"}">${t.jenis}</span></td>
        <td data-label="Kategori">${t.kategori}</td>
        <td data-label="Keterangan">${t.keterangan || "-"}</td>
        <td data-label="Admin">${t.adminPenanggungJawab || "-"}</td>
        <td data-label="Nominal" style="text-align:right; font-family:var(--font-ledger); color:${t.jenis === "Pemasukan" ? "var(--dm-emerald)" : "var(--dm-brick)"};">
          ${t.jenis === "Pemasukan" ? "+" : "-"} ${formatRupiah(t.nominal)}
        </td>
        <td data-label="Bukti">${t.linkBukti ? `<a href="${t.linkBukti}" target="_blank" style="color:var(--dm-emerald); font-size:12.5px;">Lihat</a>` : "-"}</td>
      </tr>`).join("");
  } catch (err) {
    showToast(err.message || "Gagal memuat laporan", "error");
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Gagal memuat data.</div></td></tr>`;
  }
}

document.getElementById("apply-filter-btn").addEventListener("click", loadLaporan);
loadLaporan();

// ---------- Unduh / Bagikan kartu laporan sebagai gambar ----------
function reportFileName() {
  return `Laporan-${periodeSelect.value}-${tanggalInput.value}.png`.replace(/\s+/g, "");
}

async function captureReportCard() {
  const node = document.getElementById("report-card");
  const canvas = await html2canvas(node, {
    scale: Math.max(2, window.devicePixelRatio || 1),
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  return canvas;
}

document.getElementById("download-image-btn").addEventListener("click", async () => {
  const btn = document.getElementById("download-image-btn");
  setButtonLoading(btn, true, "Menyiapkan gambar...");
  try {
    const canvas = await captureReportCard();
    const link = document.createElement("a");
    link.download = reportFileName();
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("Gambar laporan berhasil diunduh", "success");
  } catch (err) {
    showToast("Gagal membuat gambar laporan", "error");
  } finally {
    setButtonLoading(btn, false);
  }
});

document.getElementById("share-image-btn").addEventListener("click", async () => {
  const btn = document.getElementById("share-image-btn");
  setButtonLoading(btn, true, "Menyiapkan gambar...");
  try {
    const canvas = await captureReportCard();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], reportFileName(), { type: "image/png" });

    // Di HP (Android/iOS) ini akan membuka menu bagikan bawaan (WhatsApp, dll)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Laporan Keuangan ${CONFIG.NAMA_LEMBAGA}`,
        text: `Laporan Keuangan ${CONFIG.NAMA_LEMBAGA} (${buildPeriodeLabel()})`,
      });
    } else {
      // Fallback untuk desktop / browser yang tidak mendukung Web Share API dengan file:
      // langsung unduh gambarnya agar tetap bisa dibagikan manual.
      const link = document.createElement("a");
      link.download = reportFileName();
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("Browser ini belum mendukung bagikan langsung — gambar diunduh, silakan bagikan manual.", "info");
    }
  } catch (err) {
    if (err && err.name !== "AbortError") {
      showToast("Gagal membagikan laporan", "error");
    }
  } finally {
    setButtonLoading(btn, false);
  }
});

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
