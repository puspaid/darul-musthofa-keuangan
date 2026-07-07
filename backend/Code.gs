/**
 * ============================================================================
 *  BUKU KAS DIGITAL — PONDOK PESANTREN DARUL MUSTHOFA
 *  Backend: Google Apps Script (Web App) + Google Sheets + Google Drive
 * ============================================================================
 *  CARA PAKAI SINGKAT:
 *  1. Buat Google Spreadsheet baru, buka Extensions > Apps Script.
 *  2. Hapus isi default, tempel seluruh isi file ini.
 *  3. Jalankan fungsi `setup()` sekali (lihat panduan README untuk detail izin).
 *  4. Deploy > New deployment > Web app > Execute as: Me, Access: Anyone.
 *  5. Salin URL Web App ke assets/js/config.js (API_URL) di frontend.
 * ============================================================================
 */

// ------------------------------------------------------------------
// KONFIGURASI TETAP
// ------------------------------------------------------------------
const SHEET_TRANSAKSI = "Transaksi";
const SHEET_REKAP_BULANAN = "RekapBulanan";
const SHEET_REKAP_TAHUNAN = "RekapTahunan";
const ROOT_FOLDER_NAME = "Buku Kas Digital - Darul Musthofa";
const FOLDER_BUKTI = "Bukti Transaksi";
const FOLDER_ARSIP = "Arsip Laporan";

const TRANSAKSI_HEADERS = [
  "NoRef", "Jenis", "Hari", "Tanggal", "Waktu", "Kategori",
  "Nominal", "Keterangan", "AdminPenanggungJawab", "LinkBukti", "Timestamp",
];

// ============================================================================
// SETUP — jalankan sekali secara manual dari editor Apps Script
// ============================================================================
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet_(ss, SHEET_TRANSAKSI, TRANSAKSI_HEADERS);
  getOrCreateSheet_(ss, SHEET_REKAP_BULANAN, ["Bulan", "TotalPemasukan", "TotalPengeluaran", "Saldo"]);
  getOrCreateSheet_(ss, SHEET_REKAP_TAHUNAN, ["Tahun", "TotalPemasukan", "TotalPengeluaran", "Saldo"]);

  getOrCreateDriveFolder_(ROOT_FOLDER_NAME);

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("ADMIN_PIN")) {
    props.setProperty("ADMIN_PIN", "123456"); // GANTI SEGERA lewat Project Settings > Script Properties
  }
  if (!props.getProperty("SESSION_SECRET")) {
    props.setProperty("SESSION_SECRET", Utilities.getUuid() + Utilities.getUuid());
  }
  Logger.log("Setup selesai. Jangan lupa ganti ADMIN_PIN di Script Properties!");
}

// ============================================================================
// ENTRY POINTS WEB APP
// ============================================================================
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    switch (action) {
      case "getDashboard":
        result = requireAuth_(e.parameter.token, () => getDashboard_());
        break;
      case "getLaporan":
        result = requireAuth_(e.parameter.token, () => getLaporan_(e.parameter.periode, e.parameter.tanggal));
        break;
      default:
        result = { success: false, message: "Aksi tidak dikenal." };
    }
    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({ success: false, message: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;
    switch (action) {
      case "login":
        result = login_(body.pin);
        break;
      case "addTransaksi":
        result = requireAuth_(body.token, () => addTransaksi_(body));
        break;
      case "generateLaporan":
        result = requireAuth_(body.token, () => generateLaporan_(body.periode, body.tanggal));
        break;
      default:
        result = { success: false, message: "Aksi tidak dikenal." };
    }
    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({ success: false, message: String(err) });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// AUTENTIKASI (token bertanda tangan, stateless, tanpa perlu tabel sesi)
// ============================================================================
function login_(pin) {
  const props = PropertiesService.getScriptProperties();
  const adminPin = props.getProperty("ADMIN_PIN");
  if (!pin || String(pin) !== String(adminPin)) {
    return { success: false, message: "PIN salah." };
  }
  const hours = 12;
  const expiry = Date.now() + hours * 3600 * 1000;
  const token = signToken_(expiry);
  return { success: true, token };
}

function signToken_(expiry) {
  const secret = PropertiesService.getScriptProperties().getProperty("SESSION_SECRET");
  const payload = String(expiry);
  const sigBytes = Utilities.computeHmacSha256Signature(payload, secret);
  const sigHex = sigBytes.map((b) => ((b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))).join("");
  return payload + "." + sigHex;
}

function verifyToken_(token) {
  if (!token || token.indexOf(".") === -1) return false;
  const [payload, sig] = token.split(".");
  const expected = signToken_(Number(payload)).split(".")[1];
  if (sig !== expected) return false;
  return Number(payload) > Date.now();
}

/** Jalankan `fn` hanya jika token valid, kalau tidak kembalikan error unauthorized */
function requireAuth_(token, fn) {
  if (!verifyToken_(token)) {
    return { success: false, error: "unauthorized", message: "Sesi tidak valid atau kedaluwarsa." };
  }
  return fn();
}

// ============================================================================
// TRANSAKSI
// ============================================================================
function addTransaksi_(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet_(ss, SHEET_TRANSAKSI, TRANSAKSI_HEADERS);

  const jenis = body.jenis === "Pengeluaran" ? "Pengeluaran" : "Pemasukan";
  const tanggal = body.tanggal; // format YYYY-MM-DD
  const noRef = generateNoRef_(sheet, jenis, tanggal);

  let linkBukti = "";
  if (body.fileBase64) {
    linkBukti = uploadBuktiToDrive_(body.fileBase64, body.fileName, body.mimeType, tanggal);
  }

  sheet.appendRow([
    noRef,
    jenis,
    body.hari || "",
    tanggal,
    body.waktu || "",
    body.kategori || "",
    Number(body.nominal) || 0,
    body.keterangan || "",
    body.adminPenanggungJawab || "",
    linkBukti,
    new Date(),
  ]);

  updateRekap_();

  return { success: true, noRef, linkBukti };
}

/** Nomor referensi otomatis: DM-IN-20260707-001 / DM-OUT-20260707-001 */
function generateNoRef_(sheet, jenis, tanggalISO) {
  const kodeJenis = jenis === "Pemasukan" ? "IN" : "OUT";
  const tanggalRingkas = tanggalISO.replace(/-/g, "");
  const data = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const ref = String(data[i][0] || "");
    if (ref.indexOf(`DM-${kodeJenis}-${tanggalRingkas}-`) === 0) count++;
  }
  const urutan = String(count + 1).padStart(3, "0");
  return `DM-${kodeJenis}-${tanggalRingkas}-${urutan}`;
}

/** Simpan bukti transfer/nota ke Drive, terorganisir per Tahun/Bulan, return link view-only */
function uploadBuktiToDrive_(base64, fileName, mimeType, tanggalISO) {
  const rootFolder = getOrCreateDriveFolder_(ROOT_FOLDER_NAME);
  const buktiFolder = getOrCreateSubfolder_(rootFolder, FOLDER_BUKTI);

  const d = new Date(tanggalISO + "T00:00:00");
  const tahun = String(d.getFullYear());
  const bulan = Utilities.formatDate(d, Session.getScriptTimeZone(), "MM-MMMM");
  const tahunFolder = getOrCreateSubfolder_(buktiFolder, tahun);
  const bulanFolder = getOrCreateSubfolder_(tahunFolder, bulan);

  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType || "application/octet-stream", fileName || "bukti");
  const file = bulanFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

// ============================================================================
// REKAP OTOMATIS (bulanan & tahunan) — dipanggil setiap ada transaksi baru
// ============================================================================
function updateRekap_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = readTransaksi_(ss);

  const perBulan = {}; // "2026-07" -> {in, out}
  const perTahun = {}; // "2026" -> {in, out}

  data.forEach((t) => {
    const bulanKey = t.tanggal.slice(0, 7);
    const tahunKey = t.tanggal.slice(0, 4);
    if (!perBulan[bulanKey]) perBulan[bulanKey] = { in: 0, out: 0 };
    if (!perTahun[tahunKey]) perTahun[tahunKey] = { in: 0, out: 0 };
    if (t.jenis === "Pemasukan") {
      perBulan[bulanKey].in += t.nominal;
      perTahun[tahunKey].in += t.nominal;
    } else {
      perBulan[bulanKey].out += t.nominal;
      perTahun[tahunKey].out += t.nominal;
    }
  });

  writeRekapSheet_(ss, SHEET_REKAP_BULANAN, perBulan, "Bulan");
  writeRekapSheet_(ss, SHEET_REKAP_TAHUNAN, perTahun, "Tahun");
}

function writeRekapSheet_(ss, sheetName, map, labelHeader) {
  const sheet = getOrCreateSheet_(ss, sheetName, [labelHeader, "TotalPemasukan", "TotalPengeluaran", "Saldo"]);
  const keys = Object.keys(map).sort();
  sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), 4).clearContent();
  const rows = keys.map((k) => [k, map[k].in, map[k].out, map[k].in - map[k].out]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
}

// ============================================================================
// DASHBOARD
// ============================================================================
function getDashboard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = readTransaksi_(ss);

  const now = new Date();
  const bulanIni = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM");

  let totalPemasukanBulanIni = 0;
  let totalPengeluaranBulanIni = 0;
  let totalPemasukanAll = 0;
  let totalPengeluaranAll = 0;

  data.forEach((t) => {
    if (t.jenis === "Pemasukan") totalPemasukanAll += t.nominal;
    else totalPengeluaranAll += t.nominal;

    if (t.tanggal.slice(0, 7) === bulanIni) {
      if (t.jenis === "Pemasukan") totalPemasukanBulanIni += t.nominal;
      else totalPengeluaranBulanIni += t.nominal;
    }
  });

  // Trend 12 bulan terakhir dari sheet RekapBulanan
  const rekapSheet = getOrCreateSheet_(ss, SHEET_REKAP_BULANAN, ["Bulan", "TotalPemasukan", "TotalPengeluaran", "Saldo"]);
  const rekapData = rekapSheet.getDataRange().getValues().slice(1).filter((r) => r[0]);
  const last12 = rekapData.slice(-12);
  const trend12Bulan = last12.map((r) => ({
    label: formatLabelBulan_(r[0]),
    pemasukan: r[1],
    pengeluaran: r[2],
  }));

  // Transaksi terbaru (8 terakhir, urut descending)
  const transaksiTerbaru = data.slice(-8).reverse().map((t) => ({
    noRef: t.noRef, tanggal: t.tanggal, kategori: t.kategori, keterangan: t.keterangan,
    nominal: t.nominal, jenis: t.jenis,
  }));

  return {
    success: true,
    totalPemasukanBulanIni,
    totalPengeluaranBulanIni,
    saldoSaatIni: totalPemasukanAll - totalPengeluaranAll,
    trend12Bulan,
    transaksiTerbaru,
  };
}

function formatLabelBulan_(yyyyMM) {
  const bulanNama = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const [y, m] = yyyyMM.split("-");
  return `${bulanNama[Number(m) - 1]} ${y}`;
}

// ============================================================================
// LAPORAN (filter multi-periode: harian / mingguan / bulanan)
// ============================================================================
function getLaporan_(periode, tanggalRef) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = readTransaksi_(ss);
  const filtered = filterByPeriode_(data, periode, tanggalRef);

  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  filtered.forEach((t) => {
    if (t.jenis === "Pemasukan") totalPemasukan += t.nominal;
    else totalPengeluaran += t.nominal;
  });

  return {
    success: true,
    data: filtered.slice().reverse().map((t) => ({
      noRef: t.noRef, tanggal: t.tanggal, jenis: t.jenis, kategori: t.kategori,
      keterangan: t.keterangan, adminPenanggungJawab: t.adminPenanggungJawab,
      nominal: t.nominal, linkBukti: t.linkBukti,
    })),
    totalPemasukan,
    totalPengeluaran,
  };
}

function filterByPeriode_(data, periode, tanggalRefISO) {
  const ref = new Date((tanggalRefISO || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")) + "T00:00:00");

  if (periode === "harian") {
    const key = Utilities.formatDate(ref, Session.getScriptTimeZone(), "yyyy-MM-dd");
    return data.filter((t) => t.tanggal === key);
  }

  if (periode === "mingguan") {
    const day = ref.getDay(); // 0 = Minggu
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(ref);
    monday.setDate(ref.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return data.filter((t) => {
      const d = new Date(t.tanggal + "T00:00:00");
      return d >= monday && d <= sunday;
    });
  }

  // default: bulanan
  const bulanKey = Utilities.formatDate(ref, Session.getScriptTimeZone(), "yyyy-MM");
  return data.filter((t) => t.tanggal.slice(0, 7) === bulanKey);
}

/** Buat laporan komprehensif (Google Sheet baru) dan arsipkan ke Drive, hasilkan link view-only */
function generateLaporan_(periode, tanggalRef) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = readTransaksi_(ss);
  const filtered = filterByPeriode_(data, periode, tanggalRef);

  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  filtered.forEach((t) => (t.jenis === "Pemasukan" ? (totalPemasukan += t.nominal) : (totalPengeluaran += t.nominal)));

  const label = periode.charAt(0).toUpperCase() + periode.slice(1);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmm");
  const fileName = `Laporan Keuangan ${label} - Darul Musthofa - ${tanggalRef} (${stamp})`;

  const newSS = SpreadsheetApp.create(fileName);
  const sheet = newSS.getSheets()[0];
  sheet.setName("Laporan");

  sheet.getRange(1, 1).setValue(`Laporan Keuangan ${label} — Pondok Pesantren Darul Musthofa`);
  sheet.getRange(2, 1).setValue(`Periode acuan: ${tanggalRef}   |   Dibuat: ${new Date().toLocaleString("id-ID")}`);
  sheet.getRange(4, 1).setValue("Total Pemasukan");
  sheet.getRange(4, 2).setValue(totalPemasukan);
  sheet.getRange(5, 1).setValue("Total Pengeluaran");
  sheet.getRange(5, 2).setValue(totalPengeluaran);
  sheet.getRange(6, 1).setValue("Saldo Bersih");
  sheet.getRange(6, 2).setValue(totalPemasukan - totalPengeluaran);

  const headers = ["No. Ref", "Tanggal", "Jenis", "Kategori", "Keterangan", "Admin", "Nominal", "Link Bukti"];
  sheet.getRange(8, 1, 1, headers.length).setValues([headers]);
  const rows = filtered.map((t) => [t.noRef, t.tanggal, t.jenis, t.kategori, t.keterangan, t.adminPenanggungJawab, t.nominal, t.linkBukti]);
  if (rows.length > 0) sheet.getRange(9, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);

  // Pindahkan ke folder arsip & buka akses view-only via link
  const rootFolder = getOrCreateDriveFolder_(ROOT_FOLDER_NAME);
  const arsipFolder = getOrCreateSubfolder_(rootFolder, FOLDER_ARSIP);
  const file = DriveApp.getFileById(newSS.getId());
  arsipFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return { success: true, fileName, viewUrl: file.getUrl() };
}

// ============================================================================
// HELPER — SHEET & DRIVE
// ============================================================================
function readTransaksi_(ss) {
  const sheet = getOrCreateSheet_(ss, SHEET_TRANSAKSI, TRANSAKSI_HEADERS);
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).filter((r) => r[0]);
  return rows.map((r) => ({
    noRef: r[0], jenis: r[1], hari: r[2], tanggal: formatDateCell_(r[3]), waktu: r[4],
    kategori: r[5], nominal: Number(r[6]) || 0, keterangan: r[7],
    adminPenanggungJawab: r[8], linkBukti: r[9], timestamp: r[10],
  }));
}

/** Sheet bisa menyimpan tanggal sebagai Date object atau string; normalisasi ke "YYYY-MM-DD" */
function formatDateCell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value);
}

function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateDriveFolder_(name) {
  const it = DriveApp.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(name);
}

function getOrCreateSubfolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}
