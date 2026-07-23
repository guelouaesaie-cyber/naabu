/* NAABU — utilitaires partagés */

export const el = (t, c, h) => {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (h != null) e.innerHTML = h;
  return e;
};

/** Format monnaie en francs CFA (adaptable). */
export function money(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("fr-FR") + " F";
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/** Ouvre une modale bas-écran. content = HTMLElement. Renvoie une fn de fermeture. */
export function openModal(title, sub, content) {
  const back = el("div", "modal-back");
  const modal = el("div", "modal");
  modal.appendChild(el("h2", null, title));
  if (sub) modal.appendChild(el("p", "sub", sub));
  modal.appendChild(content);
  back.appendChild(modal);
  document.body.appendChild(back);
  const close = () => back.remove();
  back.addEventListener("click", e => { if (e.target === back) close(); });
  return close;
}

/** Toast léger. */
export function toast(msg) {
  const t = el("div", null, msg);
  Object.assign(t.style, {
    position: "fixed", bottom: "104px", left: "50%", transform: "translateX(-50%)",
    background: "var(--ink)", color: "#fff", padding: "10px 18px", borderRadius: "999px",
    fontSize: ".85rem", zIndex: 60, boxShadow: "var(--shadow)", opacity: 0, transition: "opacity .2s",
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.style.opacity = 1);
  setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 1800);
}
