import { lastNMonths, monthLabel } from "../utils.js";
import { getLang } from "../i18n.js";

const cache = {};

function make(id, config) {
  if (cache[id]) { cache[id].destroy(); }
  const el = document.getElementById(id);
  if (!el) return;
  cache[id] = new Chart(el, config);
}

export function renderMonthlyChart(transactions, months = 6) {
  const lang = getLang();
  const keys = lastNMonths(months);
  const income = keys.map((k) => transactions.filter((t) => t.date.startsWith(k) && t.type === "income").reduce((s, t) => s + t.amount, 0));
  const expense = keys.map((k) => transactions.filter((t) => t.date.startsWith(k) && t.type === "expense").reduce((s, t) => s + t.amount, 0));
  make("ch-monthly", {
    type: "bar",
    data: {
      labels: keys.map((k) => monthLabel(k, lang)),
      datasets: [
        { label: lang === "en" ? "Income" : "Pemasukan", data: income, backgroundColor: "#22c55e", borderRadius: 6 },
        { label: lang === "en" ? "Expense" : "Pengeluaran", data: expense, backgroundColor: "#ef4444", borderRadius: 6 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
  });
}

export function renderCategoryChart(transactions, categories, monthKey) {
  const lang = getLang();
  const map = {};
  transactions.filter((t) => t.type === "expense" && t.date.startsWith(monthKey))
    .forEach((t) => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const labels = entries.map(([id]) => {
    const c = categories.find((c) => c.id === id);
    if (!c) return id;
    return lang === "en" ? (c.name_en || c.name_id) : (c.name_id || c.name_en);
  });
  make("ch-category", {
    type: "doughnut",
    data: {
      labels: labels.length ? labels : [lang === "en" ? "No data" : "Belum ada data"],
      datasets: [{
        data: entries.length ? entries.map((e) => e[1]) : [1],
        backgroundColor: entries.map(([id]) => categories.find((c) => c.id === id)?.color || "#94a3b8"),
      }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
  });
}

export function renderTrendChart(transactions, months = 12) {
  const lang = getLang();
  const keys = lastNMonths(months);
  const net = keys.map((k) => transactions.filter((t) => t.date.startsWith(k))
    .reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0));
  const avg = net.length ? net.reduce((a, b) => a + b, 0) / net.length : 0;
  make("ch-trend", {
    type: "line",
    data: {
      labels: keys.map((k) => monthLabel(k, lang)),
      datasets: [
        { label: lang === "en" ? "Net cashflow" : "Arus kas bersih", data: net, borderColor: "#4f46e5", backgroundColor: "rgba(79,70,229,.15)", fill: true, tension: 0.35 },
        { label: lang === "en" ? "Average" : "Rata-rata", data: keys.map(() => Math.round(avg)), borderColor: "#f59e0b", borderDash: [6, 4], pointRadius: 0 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
  });
}
