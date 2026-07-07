/**
 * layout.js — sidebar & topbar bersama, dipakai di semua halaman selain login
 */
const Layout = {
  NAV_ITEMS: [
    { key: "dashboard", label: "Dashboard", href: "dashboard.html",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/></svg>' },
    { key: "input", label: "Input Transaksi", href: "input.html",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>' },
    { key: "laporan", label: "Laporan", href: "laporan.html",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16M7 15v4M12 9v10M17 5v14"/></svg>' },
  ],

  init(activeKey) {
    Auth.guardPage();

    const navHtml = this.NAV_ITEMS.map((item) => `
      <a class="nav-item ${item.key === activeKey ? "active" : ""}" href="${item.href}">
        ${item.icon}<span>${item.label}</span>
      </a>`).join("");

    const sidebarHtml = `
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <aside class="sidebar geo-pattern" id="sidebar">
        <div class="sidebar-brand">
          <div class="kop">${CONFIG.NAMA_LEMBAGA}</div>
          <div class="nama">${CONFIG.NAMA_APLIKASI}</div>
        </div>
        <nav style="padding-top:14px; flex:1;">${navHtml}</nav>
        <div class="sidebar-footer">
          <div style="color:rgba(255,255,255,0.6); font-size:12px; margin-bottom:10px;">
            Masuk sebagai<br><strong style="color:#fff;">${Auth.getAdminName() || "Admin"}</strong>
          </div>
          <button id="logout-btn" class="btn btn-secondary" style="width:100%;">Keluar</button>
        </div>
      </aside>`;

    const mount = document.getElementById("sidebar-mount");
    mount.outerHTML = sidebarHtml;

    document.getElementById("logout-btn").addEventListener("click", () => {
      Auth.logout();
      window.location.href = "index.html";
    });

    const overlay = document.getElementById("sidebar-overlay");
    const sidebar = document.getElementById("sidebar");
    const hamburgers = document.querySelectorAll(".hamburger-btn");
    hamburgers.forEach((h) =>
      h.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("open");
      })
    );
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });
  },
};
