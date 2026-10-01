import { icon } from "../icons.js";

export function confirmDialog(message) {
  return new Promise((resolve) => {
    const root = document.getElementById("modal-root");
    root.innerHTML = `
      <div class="modal-backdrop"><div class="modal">
        <div class="modal-head"><strong class="cat-line">${icon("alert", 18)} Konfirmasi / Confirm</strong></div>
        <div class="modal-body"><p>${message}</p></div>
        <div class="modal-foot">
          <button class="btn" id="c-no">Batal / Cancel</button>
          <button class="btn btn-danger" id="c-yes">${icon("trash", 15)} Hapus / Delete</button>
        </div></div></div>`;
    document.getElementById("c-no").onclick = () => { root.innerHTML = ""; resolve(false); };
    document.getElementById("c-yes").onclick = () => { root.innerHTML = ""; resolve(true); };
  });
}
