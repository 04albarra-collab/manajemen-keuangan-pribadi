import { getState, updateSettings, resetDemo, exportJSON, importJSON, updateSidebarSaldo } from "./store.js";
import { getLang, setLang, applyI18n, updateLangButtons } from "./i18n.js";
import { downloadFile } from "./utils.js";
import { icon } from "./icons.js";
import { toast } from "./components/toast.js";
import { confirmDialog } from "./components/confirm.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderTransaksi, openQuickAdd } from "./views/transaksi.js";
import { renderKategori } from "./views/kategori.js";
import { renderTarget } from "./views/target.js";
import { renderPinjaman } from "./views/pinjaman.js";
import { renderLaporan } from "./views/laporan.js";

const titles = {
  dashboard: { id: "Dashboard", en: "Dashboard" },
  transaksi: { id: "Transaksi", en: "Transactions" },
  kategori: { id: "Kategori & Budget", en: "Categories & Budget" },
  target: { id: "Target Menabung", en: "Savings Goals" },
  pinjaman: { id: "Hutang & Piutang", en: "Debts & Loans" },
  laporan: { id: "Laporan", en: "Reports" },
};

function currentRoute() {
  const h = location.hash.replace("#/", "").replace("#", "");
  return titles[h] ? h : "dashboard";
}

export function refresh() {
  const r = currentRoute();
  const el = document.getElementById("app");
  document.querySelectorAll("[data-route]").forEach((a) =>
    a.classList.toggle("active", a.dataset.route === r));
  document.getElementById("page-title").textContent = titles[r][getLang()];
  ({ dashboard: renderDashboard, transaksi: renderTransaksi, kategori: renderKategori, target: renderTarget, pinjaman: renderPinjaman, laporan: renderLaporan })[r](el);
  updateSidebarSaldo();
  document.getElementById("sidebar")?.classList.remove("open");
}

function initTheme() {
  const theme = getState().settings?.theme || "light";
  document.documentElement.dataset.theme = theme;
  document.getElementById("btn-theme").innerHTML = icon(theme === "dark" ? "sun" : "moon", 19);
}

function bind() {
  window.addEventListener("hashchange", refresh);
  document.getElementById("lang-id").onclick = () => { setLang("id"); updateSettings({ lang: "id" }); refresh(); };
  document.getElementById("lang-en").onclick = () => { setLang("en"); updateSettings({ lang: "en" }); refresh(); };
  document.getElementById("btn-theme").onclick = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    updateSettings({ theme: next }); initTheme();
  };
  document.getElementById("btn-quick-add").onclick = () => openQuickAdd(refresh);
  document.getElementById("btn-hamburger").onclick = () => document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("btn-export-json").onclick = () => {
    downloadFile("dompetku-backup.json", exportJSON(), "application/json");
    toast("Backup diunduh", "success");
  };
  document.getElementById("btn-import-json").onclick = () => document.getElementById("import-json-file").click();
  document.getElementById("import-json-file").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try { importJSON(JSON.parse(rd.result)); setLang(getState().settings.lang || "id"); refresh(); toast("Import berhasil", "success"); }
      catch { toast("File tidak valid!", "error"); }
    };
    rd.readAsText(f); e.target.value = "";
  };
  document.getElementById("btn-reset-demo").onclick = async () => {
    if (await confirmDialog(getLang() === "en" ? "Reset to demo data? Current data will be lost." : "Kembalikan ke data demo? Data saat ini hilang.")) {
      resetDemo(); refresh(); toast("Data demo dimuat", "success");
    }
  };
}

// init
setLang(getState().settings?.lang || localStorage.getItem("mkp_lang") || "id");
applyI18n(); updateLangButtons(); initTheme(); bind();
if (!location.hash) location.hash = "#/dashboard";
refresh();
