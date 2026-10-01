export const uid = (p = "id") =>
  `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export function formatRp(n, lang = "id") {
  const num = Number(n) || 0;
  if (lang === "en") return "IDR " + num.toLocaleString("en-US");
  return "Rp" + num.toLocaleString("id-ID");
}

export function formatDate(dateStr, lang = "id") {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function monthKeyOf(dateStr) {
  return String(dateStr || "").slice(0, 7); // YYYY-MM
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key, lang = "id") {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { month: "short", year: "numeric" });
}

export function lastNMonths(n, baseKey = currentMonthKey()) {
  const [y, m] = baseKey.split("-").map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline + "T00:00:00") - new Date(todayStr() + "T00:00:00");
  return Math.ceil(diff / 86400000);
}

export function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function toCSV(rows) {
  return rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function debounce(fn, ms = 250) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
