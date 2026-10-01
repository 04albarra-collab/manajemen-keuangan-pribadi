import { getSeedData } from "./seed.js";
import { uid, monthKeyOf } from "./utils.js";

const KEY = "mkp_state_v1";
let state = null;
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = JSON.parse(raw);
      if (!state.transactions || !state.categories) throw new Error("corrupt");
      state.goals ||= [];
      state.loans ||= [];
      state.settings ||= { theme: "light", lang: "id" };
      return;
    }
  } catch { /* fallthrough to seed */ }
  state = getSeedData();
  save();
}

export function getState() {
  if (!state) load();
  ensureRecurring();
  return state;
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => { try { fn(state); } catch {} });
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function commit() { save(); updateSidebarSaldo(); }

export function updateSidebarSaldo() {
  const el = document.getElementById("sidebar-saldo");
  if (!el || !state) return;
  const bal = balance();
  const lang = state.settings?.lang || "id";
  el.textContent = lang === "en"
    ? "IDR " + bal.toLocaleString("en-US")
    : "Rp" + bal.toLocaleString("id-ID");
}

// ---- computed ----
export function balance() {
  return getState().transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
}
export function monthStats(year, month) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  let income = 0, expense = 0;
  for (const t of getState().transactions) {
    if (t.date.startsWith(prefix)) {
      if (t.type === "income") income += t.amount; else expense += t.amount;
    }
  }
  return { income, expense, net: income - expense, rate: income > 0 ? Math.max(0, (income - expense) / income) : 0 };
}
export function spendingByCategory(monthKey) {
  const map = {};
  for (const t of getState().transactions) {
    if (t.type === "expense" && monthKeyOf(t.date) === monthKey) {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    }
  }
  return map;
}

// ---- transactions ----
export function addTransaction(data) {
  const st = getState();
  st.transactions.unshift({ id: uid("trx"), createdAt: new Date().toISOString(), recurring: "none", wallet: "Cash", ...data, amount: Number(data.amount) });
  commit();
}
export function updateTransaction(id, patch) {
  const st = getState();
  const i = st.transactions.findIndex((t) => t.id === id);
  if (i >= 0) { st.transactions[i] = { ...st.transactions[i], ...patch, amount: Number(patch.amount ?? st.transactions[i].amount) }; commit(); }
}
export function deleteTransaction(id) {
  const st = getState();
  st.transactions = st.transactions.filter((t) => t.id !== id);
  commit();
}

// ---- categories ----
export function addCategory(data) {
  const st = getState();
  st.categories.push({ id: uid("cat"), budget: 0, ...data, budget: Number(data.budget) || 0 });
  commit();
}
export function updateCategory(id, patch) {
  const st = getState();
  const c = st.categories.find((c) => c.id === id);
  if (c) Object.assign(c, patch, { budget: Number(patch.budget ?? c.budget) || 0 });
  commit();
}
export function deleteCategory(id) {
  const st = getState();
  if (st.transactions.some((t) => t.categoryId === id)) throw new Error("used");
  st.categories = st.categories.filter((c) => c.id !== id);
  commit();
}

// ---- goals ----
export function addGoal(data) {
  const st = getState();
  st.goals.unshift({ id: uid("goal"), savedAmount: 0, history: [], ...data, targetAmount: Number(data.targetAmount) });
  commit();
}
export function updateGoal(id, patch) {
  const st = getState();
  const g = st.goals.find((g) => g.id === id);
  if (g) Object.assign(g, patch);
  commit();
}
export function deleteGoal(id) {
  const st = getState();
  st.goals = st.goals.filter((g) => g.id !== id);
  commit();
}
export function depositGoal(id, amount, date) {
  const st = getState();
  const g = st.goals.find((g) => g.id === id);
  if (!g) return;
  amount = Number(amount);
  g.savedAmount += amount;
  g.history.unshift({ date: date || new Date().toISOString().slice(0, 10), amount });
  commit();
}
export function withdrawGoal(id, amount) {
  const st = getState();
  const g = st.goals.find((g) => g.id === id);
  if (!g) return;
  amount = Number(amount);
  g.savedAmount = Math.max(0, g.savedAmount - amount);
  g.history.unshift({ date: new Date().toISOString().slice(0, 10), amount: -amount });
  commit();
}

// ---- loans (hutang & piutang) ----
// type: 'hutang' (saya pinjam -> wajib bayar) | 'piutang' (saya meminjami -> wajib ditagih)
export function addLoan(data) {
  const st = getState();
  st.loans.unshift({
    id: uid("loan"), paidAmount: 0, history: [],
    createdAt: new Date().toISOString(), ...data,
    amount: Number(data.amount),
  });
  commit();
}
export function updateLoan(id, patch) {
  const st = getState();
  const l = st.loans.find((l) => l.id === id);
  if (l) Object.assign(l, patch, { amount: Number(patch.amount ?? l.amount) });
  commit();
}
export function deleteLoan(id) {
  const st = getState();
  st.loans = st.loans.filter((l) => l.id !== id);
  commit();
}
export function payLoan(id, amount, date) {
  const st = getState();
  const l = st.loans.find((l) => l.id === id);
  if (!l) return;
  amount = Math.min(Number(amount), l.amount - l.paidAmount);
  if (amount <= 0) return;
  l.paidAmount += amount;
  l.history.unshift({ date: date || new Date().toISOString().slice(0, 10), amount });
  commit();
}
export function loanOutstanding(l) { return Math.max(0, l.amount - (l.paidAmount || 0)); }
export function loanStatus(l) {
  if (loanOutstanding(l) <= 0) return "lunas";
  if (l.dueDate && l.dueDate < new Date().toISOString().slice(0, 10)) return "overdue";
  return "aktif";
}
export function loanSummary() {
  const st = getState();
  let hutang = 0, piutang = 0, overdue = 0;
  for (const l of st.loans) {
    const out = loanOutstanding(l);
    if (out <= 0) continue;
    if (l.type === "hutang") hutang += out; else piutang += out;
    if (loanStatus(l) === "overdue") overdue++;
  }
  return { hutang, piutang, overdue, net: piutang - hutang };
}

// ---- settings / io ----
export function updateSettings(patch) {
  const st = getState();
  Object.assign(st.settings, patch);
  if (patch.lang) localStorage.setItem("mkp_lang", patch.lang);
  commit();
}
export function resetDemo() { state = getSeedData(); save(); }
export function exportJSON() { return JSON.stringify(getState(), null, 2); }
export function importJSON(obj) {
  if (!obj.transactions || !obj.categories) throw new Error("invalid");
  state = { goals: [], loans: [], settings: { theme: "light", lang: "id" }, ...obj };
  save();
}

// Auto-duplicate recurring templates ke bulan berjalan bila belum ada
function ensureRecurring() {
  if (!state || state._recChecked === currentKey()) return;
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const templates = state.transactions.filter((t) => t.recurring && t.recurring !== "none");
  let added = false;
  for (const tpl of templates) {
    if (monthKeyOf(tpl.date) === prefix) continue;
    const day = tpl.date.slice(8, 10);
    const candidate = `${prefix}-${day}`;
    const exists = state.transactions.some(
      (t) => t.note === tpl.note && t.amount === tpl.amount && monthKeyOf(t.date) === prefix
    );
    if (!exists) {
      state.transactions.unshift({ ...tpl, id: uid("trx"), date: candidate, createdAt: new Date().toISOString() });
      added = true;
    }
  }
  state._recChecked = currentKey();
  if (added) localStorage.setItem(KEY, JSON.stringify(state));
}
function currentKey() { return new Date().toISOString().slice(0, 10); }
