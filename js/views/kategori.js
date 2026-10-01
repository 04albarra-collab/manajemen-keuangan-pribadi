import { getState, addCategory, updateCategory, deleteCategory, spendingByCategory } from "../store.js";
import { formatRp, escapeHtml, currentMonthKey } from "../utils.js";
import { getLang, catName } from "../i18n.js";
import { icon, catBadge, iconChip, CATEGORY_ICONS } from "../icons.js";
import { openModal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { confirmDialog } from "../components/confirm.js";

export function renderKategori(el) {
  const lang = getLang();
  const st = getState();
  const spent = spendingByCategory(currentMonthKey());
  const COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#0284c7", "#10b981", "#ec4899", "#14b8a6", "#64748b", "#22c55e"];

  const card = (c) => {
    const used = spent[c.id] || 0;
    const pct = c.budget > 0 ? Math.min(100, Math.round((used / c.budget) * 100)) : 0;
    const cls = pct >= 100 ? "danger" : pct >= 80 ? "warn" : "";
    return `<div class="card lift">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong class="cat-line">${catBadge(c, 36)} ${escapeHtml(catName(c, lang))}</strong>
        <span class="badge ${c.type}">${c.type}</span>
      </div>
      <div class="small muted">Budget: ${c.budget ? formatRp(c.budget, lang) : "—"} • ${lang === "en" ? "Used" : "Terpakai"}: ${formatRp(used, lang)}</div>
      ${c.budget ? `<div class="progress ${cls}"><div style="width:${pct}%"></div></div><div class="small">${pct}%</div>` : ""}
      <div class="toolbar">
        <button class="btn btn-sm" data-edit="${c.id}">${icon("edit", 15)} Edit</button>
        <button class="btn btn-sm" data-del="${c.id}">${icon("trash", 15)}</button>
      </div></div>`;
  };

  el.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="btn-add-cat">${icon("plus", 16)} ${lang === "en" ? "Add Category" : "Tambah Kategori"}</button>
      <span class="small muted">${lang === "en" ? "Set monthly budget per expense category. Alert at 80% / 100%." : "Atur budget bulanan per kategori pengeluaran. Peringatan di 80% / 100%."}</span>
    </div>
    <h3 class="sect-title">${iconChip("transaksi", "#dc2626", 34, 18)} Expense / Pengeluaran</h3>
    <div class="grid-4">${st.categories.filter((c) => c.type === "expense").map(card).join("")}</div>
    <h3 class="sect-title mt">${iconChip("wallet", "#16a34a", 34, 18)} Income / Pemasukan</h3>
    <div class="grid-4">${st.categories.filter((c) => c.type === "income").map(card).join("")}</div>`;

  el.querySelector("#btn-add-cat").onclick = () => openCatModal();
  el.onclick = async (e) => {
    const eb = e.target.closest("[data-edit]"), db = e.target.closest("[data-del]");
    if (eb) openCatModal(st.categories.find((c) => c.id === eb.dataset.edit));
    if (db) {
      if (await confirmDialog(lang === "en" ? "Delete this category?" : "Hapus kategori ini?")) {
        try { deleteCategory(db.dataset.del); toast("OK", "success"); renderKategori(el); }
        catch { toast(lang === "en" ? "Category is used by transactions!" : "Kategori dipakai transaksi, tidak bisa dihapus!", "error"); }
      }
    }
  };

  function openCatModal(existing = null) {
    const curIcon = existing?.icon || "others";
    openModal({
      title: existing
        ? `<span class="cat-line">${icon("edit", 18)} Edit Kategori</span>`
        : `<span class="cat-line">${icon("plus", 18)} Kategori baru / New category</span>`,
      body: `<div class="form-grid">
        <div class="row-2">
          <label>Nama (ID)<input name="name_id" required class="input" value="${escapeHtml(existing?.name_id || "")}" placeholder="Makanan" /></label>
          <label>Name (EN)<input name="name_en" required class="input" value="${escapeHtml(existing?.name_en || "")}" placeholder="Food" /></label>
        </div>
        <div class="row-2">
          <label>Type<select name="type" class="select">
            <option value="expense" ${existing?.type !== "income" ? "selected" : ""}>expense</option>
            <option value="income" ${existing?.type === "income" ? "selected" : ""}>income</option>
          </select></label>
          <label>Budget / bulan (Rp, 0 = tanpa batas)<input name="budget" type="number" min="0" class="input" value="${existing?.budget || 0}" /></label>
        </div>
        <label>${lang === "en" ? "Icon" : "Ikon"}<div class="icon-picker">
          ${CATEGORY_ICONS.map((n) => `<label><input type="radio" name="icon" value="${n}" ${curIcon === n ? "checked" : ""} /><span class="pick">${icon(n, 20)}</span></label>`).join("")}
        </div></label>
        <label>Color<select name="color" class="select">${COLORS.map((c) => `<option value="${c}" ${existing?.color === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
      </div>`,
      onSubmit: (fd) => {
        const d = Object.fromEntries(fd.entries());
        if (existing) updateCategory(existing.id, d); else addCategory(d);
        toast(lang === "en" ? "Saved" : "Tersimpan", "success");
        renderKategori(el);
      },
    });
  }
}
