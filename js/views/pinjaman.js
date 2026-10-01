import { getState, addLoan, updateLoan, deleteLoan, payLoan, loanOutstanding, loanStatus, loanSummary } from "../store.js";
import { formatRp, formatDate, escapeHtml, toCSV, downloadFile } from "../utils.js";
import { getLang } from "../i18n.js";
import { icon, iconChip } from "../icons.js";
import { openModal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { confirmDialog } from "../components/confirm.js";

let f = { type: "all", status: "all", q: "" };

const TYPE_META = {
  hutang: { color: "#dc2626", id: "Hutang (saya pinjam)", en: "Debt (I borrowed)" },
  piutang: { color: "#16a34a", id: "Piutang (saya meminjami)", en: "Receivable (I lent)" },
};
const STATUS_META = {
  aktif: { id: "Aktif", en: "Active" },
  overdue: { id: "Jatuh tempo", en: "Overdue" },
  lunas: { id: "Lunas", en: "Settled" },
};

export function renderPinjaman(el) {
  const lang = getLang();
  const sum = loanSummary();

  el.innerHTML = `
    <div class="grid-4">
      <div class="card lift"><div class="kpi-top">${iconChip("loan", "#dc2626")}<div class="kpi-label">${lang === "en" ? "My Debts (outstanding)" : "Hutang saya (sisa)"}</div></div>
        <div class="kpi-value down">${formatRp(sum.hutang, lang)}</div></div>
      <div class="card lift"><div class="kpi-top">${iconChip("wallet", "#16a34a")}<div class="kpi-label">${lang === "en" ? "Receivables (outstanding)" : "Piutang saya (sisa)"}</div></div>
        <div class="kpi-value up">${formatRp(sum.piutang, lang)}</div></div>
      <div class="card lift"><div class="kpi-top">${iconChip("dashboard", "#4f46e5")}<div class="kpi-label">Net</div></div>
        <div class="kpi-value">${formatRp(sum.net, lang)}</div>
        <div class="kpi-sub muted">${lang === "en" ? "receivables minus debts" : "piutang dikurangi hutang"}</div></div>
      <div class="card lift"><div class="kpi-top">${iconChip("alert", "#d97706")}<div class="kpi-label">${lang === "en" ? "Overdue" : "Jatuh tempo"}</div></div>
        <div class="kpi-value">${sum.overdue}</div>
        <div class="kpi-sub muted">${lang === "en" ? "need attention" : "perlu perhatian"}</div></div>
    </div>

    <div class="card mt">
      <div class="toolbar">
        <button class="btn btn-primary" id="btn-add-loan">${icon("plus", 16)} ${lang === "en" ? "New Record" : "Catat Baru"}</button>
        <select class="select" id="f-type">
          <option value="all">${lang === "en" ? "All types" : "Semua tipe"}</option>
          <option value="hutang" ${f.type === "hutang" ? "selected" : ""}>Hutang</option>
          <option value="piutang" ${f.type === "piutang" ? "selected" : ""}>Piutang</option>
        </select>
        <select class="select" id="f-status">
          <option value="all">${lang === "en" ? "All statuses" : "Semua status"}</option>
          ${Object.entries(STATUS_META).map(([k, v]) => `<option value="${k}" ${f.status === k ? "selected" : ""}>${lang === "en" ? v.en : v.id}</option>`).join("")}
        </select>
        <input class="input" id="f-q" placeholder="${lang === "en" ? "Search name/note..." : "Cari nama/catatan..."}" value="${escapeHtml(f.q)}" style="flex:1;min-width:160px" />
        <button class="btn" id="btn-csv">${icon("download", 16)} CSV</button>
      </div>
      <div id="loan-list" class="grid-2-equal"></div>
    </div>`;

  const draw = () => {
    let rows = [...getState().loans].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (f.type !== "all") rows = rows.filter((r) => r.type === f.type);
    if (f.status !== "all") rows = rows.filter((r) => loanStatus(r) === f.status);
    if (f.q) { const q = f.q.toLowerCase(); rows = rows.filter((r) => `${r.person} ${r.note}`.toLowerCase().includes(q)); }

    el.querySelector("#loan-list").innerHTML = rows.map((l) => {
      const out = loanOutstanding(l);
      const st = loanStatus(l);
      const pct = l.amount ? Math.min(100, Math.round(((l.paidAmount || 0) / l.amount) * 100)) : 0;
      const meta = TYPE_META[l.type] || TYPE_META.hutang;
      const badgeCls = st === "lunas" ? "income" : st === "overdue" ? "expense" : "";
      return `<div class="card goal-card lift">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <strong class="cat-line">${iconChip("loan", meta.color, 36, 19)} ${escapeHtml(l.person)}</strong>
          <span class="badge ${badgeCls}">${lang === "en" ? STATUS_META[st].en : STATUS_META[st].id}</span>
        </div>
        <div class="small muted"><span class="badge">${lang === "en" ? meta.en : meta.id}</span>
          • ${formatRp(l.paidAmount || 0, lang)} / ${formatRp(l.amount, lang)}
          • ${l.date ? (lang === "en" ? "since " : "sejak ") + formatDate(l.date, lang) : "-"}${l.dueDate ? " • " + (lang === "en" ? "due " : "tenggat ") + formatDate(l.dueDate, lang) : ""}</div>
        ${l.note ? `<div class="small">${escapeHtml(l.note)}</div>` : ""}
        <div class="progress ${st === "lunas" ? "success" : st === "overdue" ? "danger" : ""}"><div style="width:${pct}%"></div></div>
        <div class="small"><strong>${lang === "en" ? "Remaining" : "Sisa"}: ${formatRp(out, lang)}</strong> (${pct}%)</div>
        <div class="toolbar">
          ${st !== "lunas" ? `<button class="btn btn-sm btn-primary" data-pay="${l.id}">${icon("wallet", 15)} ${l.type === "hutang" ? (lang === "en" ? "Pay" : "Bayar") : (lang === "en" ? "Collect" : "Tagih")}</button>` : ""}
          <button class="btn btn-sm" data-edit="${l.id}" title="Edit">${icon("edit", 15)}</button>
          <button class="btn btn-sm" data-del="${l.id}" title="Delete">${icon("trash", 15)}</button>
        </div>
        ${l.history?.length ? `<details class="small"><summary>${lang === "en" ? "Payments" : "Pembayaran"} (${l.history.length})</summary>
          ${l.history.slice(0, 5).map((h) => `<div>${formatDate(h.date, lang)} — <strong class="up">+${formatRp(h.amount, lang)}</strong></div>`).join("")}</details>` : ""}
      </div>`;
    }).join("") || `<div class="card muted">${lang === "en" ? "No records. Add your first debt or receivable!" : "Belum ada catatan. Tambahkan hutang/piutang pertama!"}</div>`;
  };
  draw();

  el.querySelector("#f-type").onchange = (e) => { f.type = e.target.value; draw(); };
  el.querySelector("#f-status").onchange = (e) => { f.status = e.target.value; draw(); };
  el.querySelector("#f-q").oninput = (e) => { f.q = e.target.value; draw(); };
  el.querySelector("#btn-add-loan").onclick = () => openLoanModal(null, draw);
  el.querySelector("#btn-csv").onclick = () => {
    const rows = getState().loans;
    downloadFile("hutang-piutang.csv", toCSV([
      ["person", "type", "amount", "paid", "remaining", "status", "date", "due", "note"],
      ...rows.map((l) => [l.person, l.type, l.amount, l.paidAmount || 0, loanOutstanding(l), loanStatus(l), l.date, l.dueDate || "", l.note || ""]),
    ]), "text/csv");
  };
  el.querySelector("#loan-list").onclick = async (e) => {
    const pay = e.target.closest("[data-pay]");
    const eb = e.target.closest("[data-edit]");
    const db = e.target.closest("[data-del]");
    if (pay) openPayModal(pay.dataset.pay, draw);
    if (eb) openLoanModal(getState().loans.find((l) => l.id === eb.dataset.edit), draw);
    if (db && await confirmDialog(lang === "en" ? "Delete this record?" : "Hapus catatan ini?")) {
      deleteLoan(db.dataset.del); toast("OK", "success"); draw();
    }
  };
}

function openLoanModal(existing, refresh) {
  const lang = getLang();
  openModal({
    title: existing
      ? `<span class="cat-line">${icon("edit", 18)} Edit</span>`
      : `<span class="cat-line">${icon("plus", 18)} ${lang === "en" ? "New debt / receivable" : "Hutang / piutang baru"}</span>`,
    body: `<div class="form-grid">
      <div class="row-2">
        <label>${lang === "en" ? "Type" : "Tipe"}<select name="type" class="select">
          <option value="hutang" ${existing?.type !== "piutang" ? "selected" : ""}>Hutang — ${lang === "en" ? "I borrowed" : "saya pinjam"}</option>
          <option value="piutang" ${existing?.type === "piutang" ? "selected" : ""}>Piutang — ${lang === "en" ? "I lent" : "saya meminjami"}</option>
        </select></label>
        <label>${lang === "en" ? "Person / party" : "Nama orang / pihak"}<input name="person" required class="input" value="${escapeHtml(existing?.person || "")}" placeholder="Andi / Paylater / Bank..." /></label>
      </div>
      <div class="row-2">
        <label>Total (Rp)<input name="amount" type="number" min="1" required class="input" value="${existing?.amount || ""}" /></label>
        <label>${lang === "en" ? "Date" : "Tanggal pinjam"}<input name="date" type="date" required class="input" value="${existing?.date || new Date().toISOString().slice(0, 10)}" /></label>
      </div>
      <label>${lang === "en" ? "Due date (optional)" : "Tenggat (opsional)"}<input name="dueDate" type="date" class="input" value="${existing?.dueDate || ""}" /></label>
      <label>Note<input name="note" class="input" value="${escapeHtml(existing?.note || "")}" placeholder="Cicilan 12x..." /></label>
    </div>`,
    onSubmit: (fd) => {
      const d = Object.fromEntries(fd.entries());
      if (Number(d.amount) <= 0) { toast("Nominal harus > 0", "error"); return false; }
      if (existing) updateLoan(existing.id, d); else addLoan(d);
      toast(lang === "en" ? "Saved" : "Tersimpan", "success"); refresh();
    },
  });
}

function openPayModal(id, refresh) {
  const lang = getLang();
  const l = getState().loans.find((l) => l.id === id);
  if (!l) return;
  const out = loanOutstanding(l);
  openModal({
    title: `<span class="cat-line">${icon("wallet", 18)} ${l.type === "hutang" ? (lang === "en" ? "Pay debt" : "Bayar hutang") : (lang === "en" ? "Record collection" : "Catat penagihan")} — ${escapeHtml(l.person)}</span>`,
    body: `<div class="form-grid">
      <div class="small muted">${lang === "en" ? "Remaining" : "Sisa"}: <strong>${formatRp(out, lang)}</strong></div>
      <label>Nominal (Rp)<input name="amount" type="number" min="1" max="${out}" required class="input" value="${out}" /></label>
      <label>Tanggal<input name="date" type="date" class="input" value="${new Date().toISOString().slice(0, 10)}" /></label>
    </div>`,
    submitLabel: lang === "en" ? "Record" : "Catat",
    onSubmit: (fd) => {
      payLoan(id, Number(fd.get("amount")), fd.get("date"));
      toast(lang === "en" ? "Recorded" : "Tercatat", "success"); refresh();
    },
  });
}
