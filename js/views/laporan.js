import { getState } from "../store.js";
import { formatRp, formatDate, toCSV, downloadFile, escapeHtml, monthLabel } from "../utils.js";
import { getLang, catName } from "../i18n.js";
import { icon, catBadge, iconChip } from "../icons.js";
import { renderMonthlyChart, renderCategoryChart } from "../charts/charts.js";

export function renderLaporan(el) {
  const lang = getLang();
  const st = getState();
  const months = [...new Set(st.transactions.map((t) => t.date.slice(0, 7)))].sort().reverse();
  const cur = months[0] || new Date().toISOString().slice(0, 7);

  el.innerHTML = `
    <div class="card">
      <div class="toolbar">
        <select class="select" id="r-month">${months.map((m) => `<option value="${m}" ${m === cur ? "selected" : ""}>${monthLabel(m, lang)}</option>`).join("")}</select>
        <select class="select" id="r-range">
          <option value="1">1 ${lang === "en" ? "month" : "bulan"}</option>
          <option value="3">3 ${lang === "en" ? "months" : "bulan"}</option>
          <option value="6" selected>6 ${lang === "en" ? "months" : "bulan"}</option>
          <option value="12">12 ${lang === "en" ? "months" : "bulan"}</option>
        </select>
        <button class="btn" id="r-csv">${icon("download", 16)} CSV</button>
        <button class="btn" id="r-print">${icon("printer", 16)} Print / PDF</button>
      </div>
      <div id="r-summary"></div>
    </div>
    <div class="grid-2 mt">
      <div class="card"><h3 class="sect-title">${iconChip("dashboard", "#4f46e5", 34, 18)} Pemasukan vs Pengeluaran</h3><div class="chart-box"><canvas id="ch-monthly"></canvas></div></div>
      <div class="card"><h3 id="r-cat-title"></h3><div class="chart-box"><canvas id="ch-category"></canvas></div></div>
    </div>
    <div class="card mt"><h3 class="sect-title">${iconChip("laporan", "#16a34a", 34, 18)} Detail</h3><div class="table-wrap"><table class="table">
      <thead><tr><th>${lang === "en" ? "Date" : "Tanggal"}</th><th>Type</th><th>Kategori</th><th>Note</th><th style="text-align:right">Nominal</th></tr></thead>
      <tbody id="r-body"></tbody></table></div></div>`;

  const draw = () => {
    const mk = el.querySelector("#r-month").value;
    const range = Number(el.querySelector("#r-range").value);
    const rows = st.transactions.filter((t) => t.date.slice(0, 7) <= mk).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 500);
    const inMonth = rows.filter((t) => t.date.startsWith(mk));
    const inc = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const catMap = Object.fromEntries(st.categories.map((c) => [c.id, c]));

    el.querySelector("#r-summary").innerHTML = `
      <div class="grid-4">
        <div><div class="kpi-label">${monthLabel(mk, lang)}</div><div class="kpi-value">${formatRp(inc - exp, lang)}</div><div class="small muted">net</div></div>
        <div><div class="kpi-label">${lang === "en" ? "Income" : "Pemasukan"}</div><div class="kpi-value up">${formatRp(inc, lang)}</div></div>
        <div><div class="kpi-label">${lang === "en" ? "Expense" : "Pengeluaran"}</div><div class="kpi-value down">${formatRp(exp, lang)}</div></div>
        <div><div class="kpi-label">Transaksi</div><div class="kpi-value">${inMonth.length}</div></div>
      </div>`;
    el.querySelector("#r-cat-title").innerHTML = `<span class="cat-line">${icon("kategori", 16)} ${(lang === "en" ? "Spending " : "Pengeluaran ") + monthLabel(mk, lang)}</span>`;
    el.querySelector("#r-body").innerHTML = inMonth.map((t) => {
      const c = catMap[t.categoryId];
      return `<tr><td>${formatDate(t.date, lang)}</td><td>${t.type}</td><td>${c ? `<span class="cat-line">${catBadge(c, 24)}<span>${escapeHtml(catName(c, lang))}</span></span>` : "-"}</td><td>${escapeHtml(t.note || "")}</td><td style="text-align:right">${formatRp(t.amount, lang)}</td></tr>`;
    }).join("") || `<tr><td colspan="5" class="muted">No data</td></tr>`;

    renderMonthlyChart(st.transactions, range);
    renderCategoryChart(st.transactions, st.categories, mk);

    el.querySelector("#r-csv").onclick = () => {
      const header = ["date", "type", "category", "note", "wallet", "amount"];
      const lines = inMonth.map((t) => [t.date, t.type, catMap[t.categoryId] ? catName(catMap[t.categoryId], lang) : "", t.note, t.wallet, t.amount]);
      downloadFile(`laporan-${mk}.csv`, toCSV([header, ...lines]), "text/csv");
    };
    el.querySelector("#r-print").onclick = () => window.print();
  };
  el.querySelector("#r-month").onchange = draw;
  el.querySelector("#r-range").onchange = draw;
  draw();
}
