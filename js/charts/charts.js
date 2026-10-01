import { lastNMonths, monthLabel } from "../utils.js";
import { getLang } from "../i18n.js";

const cache = {};

// Palet kategorikal yang tenang (bukan neon/rainbow AI-slop)
const CATEGORY_PALETTE = [
  "#2f7d4f", "#b7791f", "#3e6fa3", "#8c7a5b",
  "#6b7280", "#a15c5c", "#5b8c7a", "#7a6a8a",
];

function themeColors() {
  const dark = document.documentElement.dataset.theme === "dark";
  return {
    dark,
    grid: dark ? "#2c2b29" : "#e7e4dd",
    tick: dark ? "#a8a49a" : "#6f6b62",
    income: "#2f7d4f",
    expense: "#6b7280",
    net: dark ? "#e9e6e0" : "#1b1a18",
    avg: dark ? "#7c7870" : "#9c978d",
  };
}

function baseOptions() {
  const t = themeColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, boxHeight: 10, padding: 14, color: t.tick, font: { size: 12 } },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: t.tick, font: { size: 11 } } },
      y: { grid: { color: t.grid }, border: { display: false }, ticks: { color: t.tick, font: { size: 11 }, maxTicksLimit: 5 } },
    },
  };
}

function make(id, config) {
  if (cache[id]) { cache[id].destroy(); }
  const el = document.getElementById(id);
  if (!el) return;
  if (window.Chart && Chart.defaults) {
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    Chart.defaults.font.size = 12;
  }
  cache[id] = new Chart(el, config);
}

export function renderMonthlyChart(transactions, months = 6) {
  const lang = getLang();
  const t = themeColors();
  const keys = lastNMonths(months);
  const income = keys.map((k) => transactions.filter((tr) => tr.date.startsWith(k) && tr.type === "income").reduce((s, tr) => s + tr.amount, 0));
  const expense = keys.map((k) => transactions.filter((tr) => tr.date.startsWith(k) && tr.type === "expense").reduce((s, tr) => s + tr.amount, 0));
  make("ch-monthly", {
    type: "bar",
    data: {
      labels: keys.map((k) => monthLabel(k, lang)),
      datasets: [
        { label: lang === "en" ? "Income" : "Pemasukan", data: income, backgroundColor: t.income, borderRadius: 3, barPercentage: 0.6, categoryPercentage: 0.6 },
        { label: lang === "en" ? "Expense" : "Pengeluaran", data: expense, backgroundColor: t.expense, borderRadius: 3, barPercentage: 0.6, categoryPercentage: 0.6 },
      ],
    },
    options: baseOptions(),
  });
}

export function renderCategoryChart(transactions, categories, monthKey) {
  const lang = getLang();
  const t = themeColors();
  const map = {};
  transactions.filter((tr) => tr.type === "expense" && tr.date.startsWith(monthKey))
    .forEach((tr) => { map[tr.categoryId] = (map[tr.categoryId] || 0) + tr.amount; });
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
        backgroundColor: entries.length
          ? entries.map((_, i) => CATEGORY_PALETTE[i % CATEGORY_PALETTE.length])
          : [t.grid],
        borderWidth: 2,
        borderColor: t.dark ? "#1d1c1a" : "#ffffff",
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "68%",
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, padding: 14, color: t.tick, font: { size: 12 } } } },
    },
  });
}

export function renderTrendChart(transactions, months = 12) {
  const lang = getLang();
  const t = themeColors();
  const keys = lastNMonths(months);
  const net = keys.map((k) => transactions.filter((tr) => tr.date.startsWith(k))
    .reduce((s, tr) => s + (tr.type === "income" ? tr.amount : -tr.amount), 0));
  const avg = net.length ? net.reduce((a, b) => a + b, 0) / net.length : 0;
  make("ch-trend", {
    type: "line",
    data: {
      labels: keys.map((k) => monthLabel(k, lang)),
      datasets: [
        { label: lang === "en" ? "Net cashflow" : "Arus kas bersih", data: net, borderColor: t.net, borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: lang === "en" ? "Average" : "Rata-rata", data: keys.map(() => Math.round(avg)), borderColor: t.avg, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, tension: 0 },
      ],
    },
    options: baseOptions(),
  });
}
