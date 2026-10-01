import { t } from "../i18n.js";
import { icon } from "../icons.js";

export function openModal({ title, body, onSubmit, submitLabel }) {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-backdrop" id="m-backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head"><strong>${title}</strong>
          <button class="icon-btn" id="m-close" aria-label="close">${icon("x", 18)}</button></div>
        <form id="m-form"><div class="modal-body">${body}</div>
          <div class="modal-foot">
            <button type="button" class="btn" id="m-cancel">${t("batal")}</button>
            <button type="submit" class="btn btn-primary">${submitLabel || t("simpan")}</button>
          </div>
        </form>
      </div>
    </div>`;
  const close = () => { root.innerHTML = ""; };
  document.getElementById("m-close").onclick = close;
  document.getElementById("m-cancel").onclick = close;
  document.getElementById("m-backdrop").addEventListener("mousedown", (e) => {
    if (e.target.id === "m-backdrop") close();
  });
  document.getElementById("m-form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (onSubmit(fd, close) !== false) close();
  };
  return close;
}
