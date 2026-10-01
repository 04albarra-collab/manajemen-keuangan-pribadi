import { icon } from "../icons.js";

export function toast(msg, type = "") {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const ic = type === "error" ? icon("alert", 16) : type === "success" ? icon("check", 16) : "";
  el.innerHTML = `${ic}<span></span>`;
  el.querySelector("span").textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 2600);
}
