let lang = localStorage.getItem("mkp_lang") || "id";

export const dict = {
  id: {
    brand_sub: "Keuangan Pribadi",
    nav_dashboard: "Dashboard", nav_transaksi: "Transaksi", nav_kategori: "Kategori & Budget",
    nav_target: "Target Menabung", nav_pinjaman: "Hutang & Piutang", nav_laporan: "Laporan",
    total_saldo: "Total Saldo", reset_demo: "Reset data demo",
    tambah_transaksi: "Tambah Transaksi", footer: "Dibuat untuk belajar manajemen keuangan",
    pemasukan: "Pemasukan", pengeluaran: "Pengeluaran", menabung_rate: "Rasio Menabung",
    bulan_ini: "Bulan ini", semua: "Semua", cari: "Cari...",
    simpan: "Simpan", batal: "Batal", hapus: "Hapus", edit: "Edit", tambah: "Tambah",
    setor: "Setor", tarik: "Tarik",
  },
  en: {
    brand_sub: "Personal Finance",
    nav_dashboard: "Dashboard", nav_transaksi: "Transactions", nav_kategori: "Categories & Budget",
    nav_target: "Savings Goals", nav_pinjaman: "Debts & Loans", nav_laporan: "Reports",
    total_saldo: "Total Balance", reset_demo: "Reset demo data",
    tambah_transaksi: "Add Transaction", footer: "Built for learning personal finance",
    pemasukan: "Income", pengeluaran: "Expense", menabung_rate: "Savings Rate",
    bulan_ini: "This month", semua: "All", cari: "Search...",
    simpan: "Save", batal: "Cancel", hapus: "Delete", edit: "Edit", tambah: "Add",
    setor: "Deposit", tarik: "Withdraw",
  },
};

export function getLang() { return lang; }
export function setLang(l) {
  lang = l === "en" ? "en" : "id";
  localStorage.setItem("mkp_lang", lang);
  document.documentElement.lang = lang;
  applyI18n();
  updateLangButtons();
}
export function t(key) {
  return (dict[lang] && dict[lang][key]) || dict.id[key] || key;
}
export function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.getAttribute("data-i18n");
    if (dict[lang][k] || dict.id[k]) el.textContent = t(k);
  });
}
export function updateLangButtons() {
  document.getElementById("lang-id")?.classList.toggle("active", lang === "id");
  document.getElementById("lang-en")?.classList.toggle("active", lang === "en");
}
export function catName(cat, l = lang) {
  if (!cat) return "-";
  return l === "en" ? (cat.name_en || cat.name_id || cat.name) : (cat.name_id || cat.name_en || cat.name);
}
