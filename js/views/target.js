import { getState, addGoal, updateGoal, deleteGoal, depositGoal, withdrawGoal } from "../store.js";
import { formatRp, formatDate, escapeHtml, daysLeft } from "../utils.js";
import { getLang } from "../i18n.js";
import { icon, iconChip } from "../icons.js";
import { openModal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { confirmDialog } from "../components/confirm.js";

export function renderTarget(el) {
  const lang = getLang();
  const goals = getState().goals;

  el.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="btn-add-goal">${icon("target", 16)} ${icon("plus", 15)} ${lang === "en" ? "New Goal" : "Target Baru"}</button>
      <span class="small muted">${goals.length} target • total terkumpul ${formatRp(goals.reduce((s, g) => s + g.savedAmount, 0), lang)}</span>
    </div>
    <div class="grid-2-equal">
      ${goals.map((g) => {
        const pct = g.targetAmount ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) : 0;
        const dl = daysLeft(g.deadline);
        const done = g.savedAmount >= g.targetAmount;
        return `<div class="card goal-card lift">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong class="cat-line">${iconChip("target", g.color || "#db2777", 36, 19)} ${escapeHtml(g.name)}</strong>
            <span class="badge" style="background:${g.color}22;border-color:${g.color}">${done ? `<span class="cat-line">${icon("check", 14)}` : ""}${pct}%${done ? "</span>" : ""}</span>
          </div>
          <div class="small muted">${formatRp(g.savedAmount, lang)} / ${formatRp(g.targetAmount, lang)}
            • ${g.deadline ? (lang === "en" ? "deadline " : "tenggat ") + formatDate(g.deadline, lang) + (dl !== null ? ` (${dl < 0 ? (lang === "en" ? "overdue " : "lewat ") + Math.abs(dl) + "d" : dl + (lang === "en" ? " days left" : " hari lagi")})` : "") : "-"}</div>
          <div class="progress ${done ? "success" : pct >= 75 ? "" : "warn"}"><div style="width:${pct}%;background:${g.color}"></div></div>
          <div class="toolbar">
            <button class="btn btn-sm" data-dep="${g.id}">${icon("wallet", 15)} ${lang === "en" ? "Deposit" : "Setor"}</button>
            <button class="btn btn-sm" data-wd="${g.id}">${icon("upload", 15)} ${lang === "en" ? "Withdraw" : "Tarik"}</button>
            <button class="btn btn-sm" data-edit="${g.id}" title="Edit">${icon("edit", 15)}</button>
            <button class="btn btn-sm" data-del="${g.id}" title="Delete">${icon("trash", 15)}</button>
          </div>
          ${g.history?.length ? `<details class="small"><summary>${lang === "en" ? "History" : "Riwayat"} (${g.history.length})</summary>
            ${g.history.slice(0, 5).map((h) => `<div>${formatDate(h.date, lang)} — <strong class="${h.amount >= 0 ? "up" : "down"}">${h.amount >= 0 ? "+" : ""}${formatRp(h.amount, lang)}</strong></div>`).join("")}</details>` : ""}
        </div>`;
      }).join("") || `<div class="card muted">${lang === "en" ? "No goals yet. Create one!" : "Belum ada target. Buat dulu!"}</div>`}
    </div>`;

  el.querySelector("#btn-add-goal").onclick = () => openGoalModal();
  el.onclick = async (e) => {
    const dep = e.target.closest("[data-dep]"), wd = e.target.closest("[data-wd]");
    const eb = e.target.closest("[data-edit]"), db = e.target.closest("[data-del]");
    if (dep) openMoneyModal(dep.dataset.dep, "in");
    if (wd) openMoneyModal(wd.dataset.wd, "out");
    if (eb) openGoalModal(getState().goals.find((g) => g.id === eb.dataset.edit));
    if (db && await confirmDialog(lang === "en" ? "Delete this goal?" : "Hapus target ini?")) {
      deleteGoal(db.dataset.del); toast("OK", "success"); renderTarget(el);
    }
  };

  function openGoalModal(existing = null) {
    openModal({
      title: existing
        ? `<span class="cat-line">${icon("edit", 18)} Edit Target / Goal</span>`
        : `<span class="cat-line">${icon("target", 18)} Target baru / New goal</span>`,
      body: `<div class="form-grid">
        <label>${lang === "en" ? "Goal name" : "Nama target"}<input name="name" required class="input" value="${escapeHtml(existing?.name || "")}" placeholder="Laptop baru" /></label>
        <div class="row-2">
          <label>Target (Rp)<input name="targetAmount" type="number" min="1" required class="input" value="${existing?.targetAmount || ""}" /></label>
          <label>Deadline<input name="deadline" type="date" class="input" value="${existing?.deadline || ""}" /></label>
        </div>
        <label>Color<input name="color" type="color" class="input" value="${existing?.color || "#4f46e5"}" /></label>
      </div>`,
      onSubmit: (fd) => {
        const d = Object.fromEntries(fd.entries());
        if (existing) updateGoal(existing.id, d); else addGoal(d);
        toast(lang === "en" ? "Saved" : "Tersimpan", "success"); renderTarget(el);
      },
    });
  }
  function openMoneyModal(id, dir) {
    openModal({
      title: dir === "in"
        ? `<span class="cat-line">${icon("wallet", 18)} ${lang === "en" ? "Deposit" : "Setor dana"}</span>`
        : `<span class="cat-line">${icon("upload", 18)} ${lang === "en" ? "Withdraw" : "Tarik dana"}</span>`,
      body: `<div class="form-grid">
        <label>Nominal (Rp)<input name="amount" type="number" min="1" required class="input" placeholder="100000" /></label>
        <label>Tanggal<input name="date" type="date" class="input" value="${new Date().toISOString().slice(0, 10)}" /></label>
      </div>`,
      onSubmit: (fd) => {
        const amount = Number(fd.get("amount"));
        if (dir === "in") depositGoal(id, amount, fd.get("date")); else withdrawGoal(id, amount);
        toast("OK", "success"); renderTarget(el);
      },
    });
  }
}
