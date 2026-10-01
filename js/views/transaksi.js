import { getState, addTransaction, updateTransaction, deleteTransaction } from "../store.js";
import { formatRp, formatDate, todayStr, escapeHtml, debounce } from "../utils.js";
import { getLang, catName, t } from "../i18n.js";
import { icon, catBadge } from "../icons.js";
import { openModal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { confirmDialog } from "../components/confirm.js";

let f = { q: "", type: "all", cat: "all", wallet: "all", from: "", to: "", page: 1 };
const PER = 10;

const catLabel = (c, lang) => escapeHtml(catName(c, lang));
const catCell = (c, lang) => c
  ? `<span class="cat-line">${catBadge(c, 26)}<span>${catLabel(c, lang)}</span></span>`
  : "-";

export function renderTransaksi(el) {
  const lang = getLang();
  const st = getState();
  const cats = st.categories;

  el.innerHTML = `
    <div class="card">
      <div class="toolbar">
        <input class="input" id="f-q" placeholder="${t("cari")}" value="${escapeHtml(f.q)}" style="flex:1;min-width:160px" />
        <select class="select" id="f-type">
          <option value="all">${lang === "en" ? "All types" : "Semua tipe"}</option>
          <option value="income" ${f.type === "income" ? "selected" : ""}>${lang === "en" ? "Income" : "Pemasukan"}</option>
          <option value="expense" ${f.type === "expense" ? "selected" : ""}>${lang === "en" ? "Expense" : "Pengeluaran"}</option>
        </select>
        <select class="select" id="f-cat">
          <option value="all">${lang === "en" ? "All categories" : "Semua kategori"}</option>
          ${cats.map((c) => `<option value="${c.id}" ${f.cat === c.id ? "selected" : ""}>${catLabel(c, lang)}</option>`).join("")}
        </select>
        <select class="select" id="f-wallet">
          <option value="all">${lang === "en" ? "All wallets" : "Semua dompet"}</option>
          ${["Cash", "Bank", "E-Wallet"].map((w) => `<option ${f.wallet === w ? "selected" : ""}>${w}</option>`).join("")}
        </select>
        <input class="input" type="date" id="f-from" value="${f.from}" aria-label="from" />
        <input class="input" type="date" id="f-to" value="${f.to}" aria-label="to" />
        <button class="btn btn-primary" id="btn-add">${icon("plus", 16)} ${lang === "en" ? "Add" : "Tambah"}</button>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>${lang === "en" ? "Date" : "Tanggal"}</th><th>Type</th><th>Kategori</th><th>Note</th><th>Wallet</th><th style="text-align:right">Nominal</th><th></th></tr></thead>
        <tbody id="trx-body"></tbody>
      </table></div>
      <div class="toolbar"><span class="small muted" id="trx-count"></span>
        <span style="flex:1"></span>
        <button class="btn btn-sm" id="pg-prev" aria-label="prev">&lsaquo;</button>
        <span class="small" id="pg-info"></span>
        <button class="btn btn-sm" id="pg-next" aria-label="next">&rsaquo;</button>
      </div>
    </div>`;

  const body = el.querySelector("#trx-body");
  const draw = () => {
    let rows = [...getState().transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (f.type !== "all") rows = rows.filter((r) => r.type === f.type);
    if (f.cat !== "all") rows = rows.filter((r) => r.categoryId === f.cat);
    if (f.wallet !== "all") rows = rows.filter((r) => r.wallet === f.wallet);
    if (f.from) rows = rows.filter((r) => r.date >= f.from);
    if (f.to) rows = rows.filter((r) => r.date <= f.to);
    if (f.q) { const q = f.q.toLowerCase(); rows = rows.filter((r) => (r.note || "").toLowerCase().includes(q)); }

    const pages = Math.max(1, Math.ceil(rows.length / PER));
    f.page = Math.min(Math.max(1, f.page), pages);
    const slice = rows.slice((f.page - 1) * PER, f.page * PER);
    const catMap = Object.fromEntries(getState().categories.map((c) => [c.id, c]));

    body.innerHTML = slice.map((r) => {
      const c = catMap[r.categoryId];
      return `<tr>
        <td>${formatDate(r.date, lang)}</td>
        <td><span class="badge ${r.type}">${r.type === "income" ? "&uarr; " + t("pemasukan") : "&darr; " + t("pengeluaran")}</span>${r.recurring && r.recurring !== "none" ? ` <span title="recurring">${icon("repeat", 14)}</span>` : ""}</td>
        <td>${catCell(c, lang)}</td>
        <td>${escapeHtml(r.note || "")}</td><td>${escapeHtml(r.wallet || "")}</td>
        <td style="text-align:right" class="${r.type === "income" ? "up" : "down"}"><strong>${r.type === "income" ? "+" : "-"}${formatRp(r.amount, lang)}</strong></td>
        <td style="white-space:nowrap"><button class="btn btn-sm" data-edit="${r.id}" title="${t("edit")}">${icon("edit", 15)}</button>
            <button class="btn btn-sm" data-del="${r.id}" title="${t("hapus")}">${icon("trash", 15)}</button></td></tr>`;
    }).join("") || `<tr><td colspan="7" class="muted">Tidak ada data / No data</td></tr>`;

    el.querySelector("#trx-count").textContent = `${rows.length} data`;
    el.querySelector("#pg-info").textContent = `${f.page}/${pages}`;
  };
  draw();

  el.querySelector("#f-q").oninput = debounce((e) => { f.q = e.target.value; f.page = 1; draw(); });
  el.querySelector("#f-type").onchange = (e) => { f.type = e.target.value; f.page = 1; draw(); };
  el.querySelector("#f-cat").onchange = (e) => { f.cat = e.target.value; f.page = 1; draw(); };
  el.querySelector("#f-wallet").onchange = (e) => { f.wallet = e.target.value; f.page = 1; draw(); };
  el.querySelector("#f-from").onchange = (e) => { f.from = e.target.value; f.page = 1; draw(); };
  el.querySelector("#f-to").onchange = (e) => { f.to = e.target.value; f.page = 1; draw(); };
  el.querySelector("#pg-prev").onclick = () => { f.page = Math.max(1, f.page - 1); draw(); };
  el.querySelector("#pg-next").onclick = () => { f.page++; draw(); };
  el.querySelector("#btn-add").onclick = () => openTrxModal();
  body.onclick = async (e) => {
    const eb = e.target.closest("[data-edit]"), db = e.target.closest("[data-del]");
    if (eb) openTrxModal(getState().transactions.find((x) => x.id === eb.dataset.edit));
    if (db) {
      if (await confirmDialog(lang === "en" ? "Delete this transaction?" : "Hapus transaksi ini?")) {
        deleteTransaction(db.dataset.del); toast(lang === "en" ? "Deleted" : "Terhapus", "success"); renderTransaksi(el);
      }
    }
  };

  function openTrxModal(existing = null) {
    const cats = getState().categories;
    const type = existing?.type || "expense";
    const filtered = (tp) => cats.filter((c) => c.type === tp).map((c) => `<option value="${c.id}" ${existing?.categoryId === c.id ? "selected" : ""}>${catLabel(c, lang)}</option>`).join("");
    openModal({
      title: `<span class="cat-line">${icon(existing ? "edit" : "plus", 18)} ${existing ? t("edit") : t("tambah")} Transaksi</span>`,
      body: `
        <div class="form-grid">
          <div class="row-2">
            <label>Type<select name="type" id="m-type" class="select">
              <option value="expense" ${type === "expense" ? "selected" : ""}>${t("pengeluaran")}</option>
              <option value="income" ${type === "income" ? "selected" : ""}>${t("pemasukan")}</option>
            </select></label>
            <label>Nominal (Rp)<input name="amount" type="number" min="1" required class="input" value="${existing?.amount || ""}" placeholder="50000" /></label>
          </div>
          <div class="row-2">
            <label>${lang === "en" ? "Date" : "Tanggal"}<input name="date" type="date" required class="input" value="${existing?.date || todayStr()}" /></label>
            <label>Wallet<select name="wallet" class="select">${["Cash", "Bank", "E-Wallet"].map((w) => `<option ${existing?.wallet === w ? "selected" : ""}>${w}</option>`).join("")}</select></label>
          </div>
          <label>Kategori<select name="categoryId" id="m-cat" class="select">${filtered(type)}</select></label>
          <label>Catatan / Note<input name="note" class="input" value="${escapeHtml(existing?.note || "")}" placeholder="Makan siang..." /></label>
          <label><span class="cat-line">${icon("repeat", 15)} ${lang === "en" ? "Recurring" : "Rutin"}</span><select name="recurring" class="select">
            ${["none", "weekly", "monthly"].map((r) => `<option value="${r}" ${existing?.recurring === r ? "selected" : ""}>${r}</option>`).join("")}
          </select></label>
        </div>`,
      onSubmit: (fd) => {
        const data = Object.fromEntries(fd.entries());
        if (Number(data.amount) <= 0) { toast("Nominal harus > 0", "error"); return false; }
        if (existing) updateTransaction(existing.id, data); else addTransaction(data);
        toast(lang === "en" ? "Saved" : "Tersimpan", "success");
        renderTransaksi(el);
      },
    });
    setTimeout(() => {
      document.getElementById("m-type")?.addEventListener("change", (e) => {
        const tp = e.target.value;
        document.getElementById("m-cat").innerHTML = filtered(tp);
      });
    }, 50);
  }
}

export function openQuickAdd(refresh) {
  const st = getState(); const lang = getLang();
  const cats = st.categories.filter((c) => c.type === "expense");
  openModal({
    title: `<span class="cat-line">${icon("plus", 18)} ${t("tambah_transaksi")}</span>`,
    body: `<div class="form-grid">
      <div class="row-2">
        <label>Type<select name="type" class="select"><option value="expense">${t("pengeluaran")}</option><option value="income">${t("pemasukan")}</option></select></label>
        <label>Nominal<input name="amount" type="number" min="1" required class="input" placeholder="50000" /></label>
      </div>
      <div class="row-2">
        <label>Tanggal<input name="date" type="date" required class="input" value="${todayStr()}" /></label>
        <label>Wallet<select name="wallet" class="select"><option>Cash</option><option>Bank</option><option>E-Wallet</option></select></label>
      </div>
      <label>Kategori<select name="categoryId" class="select">${cats.map((c) => `<option value="${c.id}">${catLabel(c, lang)}</option>`).join("")}</select></label>
      <label>Note<input name="note" class="input" placeholder="..." /></label>
      <input type="hidden" name="recurring" value="none" />
    </div>`,
    onSubmit: (fd) => {
      const data = Object.fromEntries(fd.entries());
      if (data.type === "income") {
        const inc = getState().categories.find((c) => c.type === "income");
        if (inc) data.categoryId = inc.id;
      }
      addTransaction(data); toast(lang === "en" ? "Saved" : "Tersimpan", "success"); refresh?.();
    },
  });
}
