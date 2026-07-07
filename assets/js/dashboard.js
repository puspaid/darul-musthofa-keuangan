Layout.init("dashboard");

document.getElementById("today-label").textContent =
  `${namaHari(new Date())}, ${formatTanggalIndo(todayISO())}`;

let trendChart;

async function loadDashboard() {
  document.getElementById("recent-tbody").innerHTML =
    `<tr><td colspan="5"><div class="empty-state">Memuat data...</div></td></tr>`;
  try {
    const data = await Api.get("getDashboard");
    if (!data.success) throw new Error(data.message || "Gagal memuat data");

    document.getElementById("stat-income").textContent = formatRupiah(data.totalPemasukanBulanIni);
    document.getElementById("stat-expense").textContent = formatRupiah(data.totalPengeluaranBulanIni);
    document.getElementById("stat-balance").textContent = formatRupiah(data.saldoSaatIni);

    renderChart(data.trend12Bulan);
    renderRecent(data.transaksiTerbaru);
  } catch (err) {
    showToast(err.message || "Gagal memuat dashboard", "error");
    document.getElementById("recent-tbody").innerHTML =
      `<tr><td colspan="5"><div class="empty-state">Gagal memuat data. Periksa koneksi ke backend.</div></td></tr>`;
  }
}

function renderChart(trend) {
  const ctx = document.getElementById("trend-chart");
  const labels = trend.map((t) => t.label);
  const income = trend.map((t) => t.pemasukan);
  const expense = trend.map((t) => t.pengeluaran);

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Pemasukan", data: income, backgroundColor: "#0F6E5B", borderRadius: 5, maxBarThickness: 22 },
        { label: "Pengeluaran", data: expense, backgroundColor: "#B5453A", borderRadius: 5, maxBarThickness: 22 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } } },
      scales: {
        y: { ticks: { callback: (v) => "Rp " + (v / 1000).toLocaleString("id-ID") + "rb" }, grid: { color: "#EEF2F0" } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderRecent(list) {
  const tbody = document.getElementById("recent-tbody");
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">Belum ada transaksi.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((t) => `
    <tr>
      <td class="ref-id" data-label="No. Ref">${t.noRef}</td>
      <td data-label="Tanggal">${formatTanggalIndo(t.tanggal)}</td>
      <td data-label="Kategori"><span class="pill ${t.jenis === "Pemasukan" ? "pill-income" : "pill-expense"}">${t.kategori}</span></td>
      <td data-label="Keterangan">${t.keterangan || "-"}</td>
      <td data-label="Nominal" style="text-align:right; font-family:var(--font-ledger); color:${t.jenis === "Pemasukan" ? "var(--dm-emerald)" : "var(--dm-brick)"};">
        ${t.jenis === "Pemasukan" ? "+" : "-"} ${formatRupiah(t.nominal)}
      </td>
    </tr>`).join("");
}

document.getElementById("refresh-btn").addEventListener("click", loadDashboard);
loadDashboard();
