/* NAABU — Module Stock */
import { el, money, openModal, toast } from "../util.js";
import { all, put, del } from "../store.js";

export async function renderStock(view) {
  const items = (await all("stock")).sort((a, b) => a.name.localeCompare(b.name));
  const low = items.filter(i => i.qty <= (i.min ?? 3));

  view.innerHTML = "";

  if (low.length) {
    const alert = el("div", "card");
    alert.style.borderColor = "var(--clay)";
    alert.innerHTML = `<div class="section-title" style="margin:0 0 8px;color:var(--clay)">⚠️ Stock bas (${low.length})</div>` +
      low.map(i => `<div class="row"><div class="main">${i.name}</div><div class="amount neg">${i.qty} restant(s)</div></div>`).join("");
    view.appendChild(alert);
  }

  const title = el("div", "section-title", "Inventaire");
  view.appendChild(title);

  const card = el("div", "card");
  if (!items.length) {
    card.innerHTML = `<div class="empty"><div class="big">📦</div>Aucun article en stock.<br>Appuyez sur + pour en ajouter un.</div>`;
  } else {
    const list = el("ul", "list");
    items.forEach(i => {
      const row = el("li", "row");
      const lowCls = i.qty <= (i.min ?? 3) ? "neg" : "";
      row.innerHTML = `
        <div><div class="main">${i.name}</div>
        <div class="meta">Prix ${money(i.price)}${i.min != null ? " · seuil " + i.min : ""}</div></div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn ghost small minus">−</button>
          <div class="amount ${lowCls}" style="min-width:34px;text-align:center">${i.qty}</div>
          <button class="btn small plus">+</button>
        </div>`;
      row.querySelector(".plus").onclick = async () => { i.qty++; await put("stock", i); renderStock(view); };
      row.querySelector(".minus").onclick = async () => { i.qty = Math.max(0, i.qty - 1); await put("stock", i); renderStock(view); };
      row.addEventListener("dblclick", async () => { await del("stock", i.id); renderStock(view); toast("Article supprimé"); });
      list.appendChild(row);
    });
    card.appendChild(list);
    card.appendChild(el("p", "meta", "+ / − pour ajuster · double-clic pour supprimer."));
  }
  view.appendChild(card);
  view._fab = () => openStockForm(view);
}

function openStockForm(view) {
  const form = el("div");
  form.innerHTML = `
    <div class="field"><label>Nom de l'article</label>
      <input id="name" placeholder="Ex. Casquette NY noire"/></div>
    <div class="field"><label>Quantité en stock</label>
      <input id="qty" type="number" inputmode="numeric" value="0"/></div>
    <div class="field"><label>Prix de vente</label>
      <input id="price" type="number" inputmode="numeric" placeholder="0"/></div>
    <div class="field"><label>Seuil d'alerte (stock bas)</label>
      <input id="min" type="number" inputmode="numeric" value="3"/></div>
    <button class="btn" id="save">Ajouter au stock</button>`;
  const close = openModal("Nouvel article", "Suivi d'inventaire", form);
  form.querySelector("#name").focus();
  form.querySelector("#save").onclick = async () => {
    const name = form.querySelector("#name").value.trim();
    if (!name) { toast("Indiquez un nom"); return; }
    await put("stock", {
      name,
      qty: Number(form.querySelector("#qty").value) || 0,
      price: Number(form.querySelector("#price").value) || 0,
      min: Number(form.querySelector("#min").value) || 0,
    });
    close(); toast("Article ajouté ✓"); renderStock(view);
  };
}
