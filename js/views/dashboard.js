import { getState, balance, monthStats, spendingByCategory, loanSummary } from "../store.js";
import { formatRp, formatDate, currentMonthKey, monthLabel, escapeHtml } from "../utils.js";
import { getLang, catName } from "../i18n.js";
import { icon, catBadge, iconChip } from "../icons.js";
import { renderMonthlyChart, renderCategoryChart, renderTrendChart } from "../charts/charts.js";

export function renderDashboard(el) {
  const st = getState();
  const lang = getLang();
  const now = new Date();
  const stats = monthStats(now.getFullYear(), now.getMonth() + 1);
  const bal = balance();
  const mk = currentMonthKey();
  const spent = spendingByCategory(mk);

  const alerts = st.categories
    .filter((c) => c.type === "expense" && c.budget > 0)
    .map((c) => ({ c, used: spent[c.id] || 0 }))
    .filter((x) => x.used / x.c.budget >= 0.8);

  const recent = [...st.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const catMap = Object.fromEntries(st.categories.map((c) => [c.id, c]));
  const loans = loanSummary();

  el.innerHTML = `
    <div class="grid-4">
      <div class="card lift"><div class="kpi-top">${iconChip("wallet", "#4f46e5")}<div class="kpi-label">${lang === "en" ? "Total Balance" : "Total Saldo"}</div></div>
        <div class="kpi-value">${formatRp(bal, lang)}</div>
        <div class="kpi-sub muted">${st.transactions.length} transaksi / transactions</div></div>
      <div class="card lift"><div class="kpi-top">${iconChip("salary", "#16a34a")}<div class="kpi-label">${lang === "en" ? "Income (this month)" : "Pemasukan (bulan ini)"}</div></div>
        <div class="kpi-value up">+${formatRp(stats.income, lang)}</div>
        <div class="kpi-sub muted">${monthLabel(mk, lang)}</div></div>
      <div class="card lift"><div class="kpi-top">${iconChip("shopping", "#dc2626")}<div class="kpi-label">${lang === "en" ? "Expense (this month)" : "Pengeluaran (bulan ini)"}</div></div>
        <div class="kpi-value down">-${formatRp(stats.expense, lang)}</div>
        <div class="kpi-sub muted">Net: ${formatRp(stats.net, lang)}</div></div>
      <div class="card lift"><div class="kpi-top">${iconChip("target", "#8b5cf6")}<div class="kpi-label">${lang === "en" ? "Savings Rate" : "Rasio Menabung"}</div></div>
        <div class="kpi-value">${Math.round(stats.rate * 100)}%</div>
        <div class="progress ${stats.rate >= 0.2 ? "success" : "warn"}"><div style="width:${Math.min(100, stats.rate * 100)}%"></div></div></div>
    </div>

    ${alerts.length ? `<div class="mt grid-2-equal">` + alerts.map(({ c, used }) => {
      const pct = Math.min(999, Math.round((used / c.budget) * 100));
      const over = used > c.budget;
      return `<div class="alert ${over ? "danger" : "warn"}"><span class="cat-line">${catBadge(c, 26)}<span><strong>${escapeHtml(catName(c, lang))}</strong> — ${pct}% ${lang === "en" ? "of budget used" : "budget terpakai"} (${formatRp(used, lang)} / ${formatRp(c.budget, lang)})${over ? (lang === "en" ? " — OVER BUDGET!" : " — LEWAT BATAS!") : ""}</span></span></div>`;
    }).join("") + `</div>` : ""}

    <div class="card mt lift"><h3 class="sect-title">${iconChip("loan", "#7c3aed", 34, 18)} ${lang === "en" ? "Debts & Receivables" : "Hutang & Piutang"} <span style="flex:1"></span><a class="small" href="#/pinjaman">${lang === "en" ? "Manage" : "Kelola"} &rarr;</a></h3>
      <div class="grid-4">
        <div><div class="kpi-label">${lang === "en" ? "My debts" : "Hutang saya"}</div><div class="kpi-value down" style="font-size:19px">${formatRp(loans.hutang, lang)}</div></div>
        <div><div class="kpi-label">${lang === "en" ? "My receivables" : "Piutang saya"}</div><div class="kpi-value up" style="font-size:19px">${formatRp(loans.piutang, lang)}</div></div>
        <div><div class="kpi-label">Net</div><div class="kpi-value" style="font-size:19px">${formatRp(loans.net, lang)}</div></div>
        <div><div class="kpi-label">${lang === "en" ? "Overdue" : "Jatuh tempo"}</div><div class="kpi-value" style="font-size:19px">${loans.overdue}</div></div>
      </div></div>

    <div class="grid-2 mt">
      <div class="card"><h3 class="sect-title">${iconChip("dashboard", "#4f46e5", 34, 18)} ${lang === "en" ? "Monthly Income vs Expense (6 months)" : "Pemasukan vs Pengeluaran Bulanan (6 bulan)"}</h3>
        <div class="chart-box"><canvas id="ch-monthly"></canvas></div></div>
      <div class="card"><h3 class="sect-title">${iconChip("kategori", "#d97706", 34, 18)} ${lang === "en" ? "Spending by Category" : "Pengeluaran per Kategori"} — ${monthLabel(mk, lang)}</h3>
        <div class="chart-box"><canvas id="ch-category"></canvas></div></div>
    </div>

    <div class="grid-2 mt">
      <div class="card"><h3 class="sect-title">${iconChip("investment", "#0ea5e9", 34, 18)} ${lang === "en" ? "Net Cashflow Trend (12 months)" : "Tren Arus Kas Bersih (12 bulan)"}</h3>
        <div class="chart-box"><canvas id="ch-trend"></canvas></div></div>
      <div class="card"><h3 class="sect-title">${iconChip("transaksi", "#0284c7", 34, 18)} ${lang === "en" ? "Recent Transactions" : "Transaksi Terbaru"}</h3>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>${lang === "en" ? "Date" : "Tanggal"}</th><th>Kategori</th><th>Note</th><th style="text-align:right">Nominal</th></tr></thead>
          <tbody>${recent.map((t) => {
            const c = catMap[t.categoryId];
            return `<tr><td>${formatDate(t.date, lang)}</td>
              <td><span class="cat-line">${c ? catBadge(c, 26) + "<span>" + escapeHtml(catName(c, lang)) + "</span>" : "-"}</span></td>
              <td>${escapeHtml(t.note || "")}</td>
              <td style="text-align:right" class="${t.type === "income" ? "up" : "down"}">${t.type === "income" ? "+" : "-"}${formatRp(t.amount, lang)}</td></tr>`;
          }).join("") || `<tr><td colspan="4" class="muted">Belum ada data / No data</td></tr>`}</tbody>
        </table></div>
        <p class="small muted"><a href="#/transaksi">${lang === "en" ? "View all" : "Lihat semua"} &rarr;</a></p>
      </div>
    </div>`;

  renderMonthlyChart(st.transactions, 6);
  renderCategoryChart(st.transactions, st.categories, mk);
  renderTrendChart(st.transactions, 12);
}
