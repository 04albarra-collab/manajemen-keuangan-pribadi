import { uid, todayStr } from "./utils.js";

// Kategori default bilingual + budget
export function defaultCategories() {
  return [
    { id: "c_makanan", name_id: "Makanan", name_en: "Food", type: "expense", icon: "food", color: "#ef4444", budget: 1500000 },
    { id: "c_transport", name_id: "Transport", name_en: "Transport", type: "expense", icon: "transport", color: "#f59e0b", budget: 800000 },
    { id: "c_belanja", name_id: "Belanja", name_en: "Shopping", type: "expense", icon: "shopping", color: "#8b5cf6", budget: 1000000 },
    { id: "c_tagihan", name_id: "Tagihan", name_en: "Bills", type: "expense", icon: "bills", color: "#0284c7", budget: 1200000 },
    { id: "c_kesehatan", name_id: "Kesehatan", name_en: "Health", type: "expense", icon: "health", color: "#10b981", budget: 500000 },
    { id: "c_edukasi", name_id: "Edukasi", name_en: "Education", type: "expense", icon: "education", color: "#0ea5e9", budget: 600000 },
    { id: "c_hiburan", name_id: "Hiburan", name_en: "Entertainment", type: "expense", icon: "entertainment", color: "#ec4899", budget: 500000 },
    { id: "c_invest", name_id: "Investasi", name_en: "Investment", type: "expense", icon: "investment", color: "#14b8a6", budget: 1000000 },
    { id: "c_lain", name_id: "Lainnya", name_en: "Others", type: "expense", icon: "others", color: "#64748b", budget: 400000 },
    { id: "c_gaji", name_id: "Gaji", name_en: "Salary", type: "income", icon: "salary", color: "#22c55e", budget: 0 },
    { id: "c_freelance", name_id: "Freelance", name_en: "Freelance", type: "income", icon: "freelance", color: "#16a34a", budget: 0 },
    { id: "c_bonus", name_id: "Bonus", name_en: "Bonus", type: "income", icon: "bonus", color: "#84cc16", budget: 0 },
  ];
}

function d(offsetDays, dayOverride = null) {
  const t = new Date();
  t.setDate(t.getDate() - offsetDays);
  const y = t.getFullYear(), m = String(t.getMonth() + 1).padStart(2, "0");
  const dday = String(dayOverride ?? t.getDate()).padStart(2, "0");
  return `${y}-${m}-${dday}`;
}

export function defaultLoans() {
  return [
    { id: uid("loan"), type: "hutang", person: "Kredit HP (paylater)", amount: 3600000, paidAmount: 1200000, date: d(50), dueDate: d(-40), note: "Cicilan 12x, tiap tanggal 5", history: [{ date: d(20), amount: 600000 }, { date: d(5), amount: 600000 }], createdAt: new Date().toISOString() },
    { id: uid("loan"), type: "piutang", person: "Andi", amount: 500000, paidAmount: 200000, date: d(12), dueDate: d(-20), note: "Pinjam untuk servis motor", history: [{ date: d(3), amount: 200000 }], createdAt: new Date().toISOString() },
    { id: uid("loan"), type: "piutang", person: "Sinta", amount: 1000000, paidAmount: 1000000, date: d(60), dueDate: d(30), note: "Sudah lunas", history: [{ date: d(30), amount: 1000000 }], createdAt: new Date().toISOString() },
  ];
}

export function getSeedData() {
  const categories = defaultCategories();
  const T = (type, amount, date, categoryId, note, wallet = "Bank", recurring = "none") => ({
    id: uid("trx"), type, amount, date, categoryId, note, wallet, recurring,
    createdAt: new Date().toISOString(),
  });
  const transactions = [
    T("income", 8000000, d(75, 1), "c_gaji", "Gaji bulanan", "Bank", "monthly"),
    T("income", 1500000, d(68, 8), "c_freelance", "Proyek landing page", "Bank"),
    T("expense", 85000, d(70, 3), "c_makanan", "Makan siang + kopi", "E-Wallet"),
    T("expense", 450000, d(65, 5), "c_tagihan", "Listrik + internet", "Bank", "monthly"),
    T("expense", 200000, d(60, 10), "c_transport", "Bensin + parkir", "Cash"),
    T("income", 8000000, d(45, 1), "c_gaji", "Gaji bulanan", "Bank", "monthly"),
    T("expense", 120000, d(44, 2), "c_makanan", "Groceries mingguan", "E-Wallet"),
    T("expense", 350000, d(40, 6), "c_belanja", "Sepatu", "E-Wallet"),
    T("expense", 150000, d(35, 9), "c_hiburan", "Nonton + makan", "Cash"),
    T("expense", 500000, d(33, 5), "c_invest", "Reksadana", "Bank", "monthly"),
    T("income", 2000000, d(30, 12), "c_bonus", "Bonus proyek", "Bank"),
    T("income", 8000000, d(15, 1), "c_gaji", "Gaji bulanan", "Bank", "monthly"),
    T("income", 1200000, d(12, 10), "c_freelance", "Desain logo", "E-Wallet"),
    T("expense", 95000, d(10), "c_makanan", "Bukber + ojol", "E-Wallet"),
    T("expense", 180000, d(8), "c_transport", "Ojol seminggu", "E-Wallet"),
    T("expense", 450000, d(6), "c_tagihan", "Listrik + internet", "Bank"),
    T("expense", 250000, d(5), "c_kesehatan", "Vitamin + cek lab", "Cash"),
    T("expense", 300000, d(4), "c_edukasi", "Kursus online", "Bank"),
    T("expense", 220000, d(3), "c_belanja", "Pakaian", "E-Wallet"),
    T("expense", 120000, d(2), "c_hiburan", "Topup game + kopi", "E-Wallet"),
    T("expense", 75000, d(1), "c_makanan", "Sarapan + makan siang", "Cash"),
    T("income", 500000, d(1), "c_freelance", "Jasa ketik", "Cash"),
  ];
  const goals = [
    { id: uid("goal"), name: "Laptop baru", targetAmount: 12000000, savedAmount: 3500000, deadline: "2027-03-01", color: "#4f46e5", history: [{ date: d(20), amount: 1000000 }, { date: d(5), amount: 500000 }] },
    { id: uid("goal"), name: "Dana darurat", targetAmount: 20000000, savedAmount: 8000000, deadline: "2027-12-31", color: "#16a34a", history: [{ date: d(40), amount: 2000000 }] },
    { id: uid("goal"), name: "Liburan Bali", targetAmount: 5000000, savedAmount: 1250000, deadline: "2026-12-20", color: "#ec4899", history: [{ date: d(2), amount: 250000 }] },
  ];
  return {
    transactions, categories, goals, loans: defaultLoans(),
    settings: { theme: "light", lang: localStorage.getItem("mkp_lang") || "id" },
    version: 2,
  };
}
