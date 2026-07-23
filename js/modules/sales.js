/* NAABU — Module Ventes */
import { el, money, fmtDate, today, openModal, toast } from "../util.js";
import { all, put, del } from "../store.js";

export async function renderSales(view) {
  const sales = (await all("sales")).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const todayTotal = sales.filter(s => s.date === today()).reduce((s, x) => s + x.total, 0);

  view.innerHTML = "";
  const head = el("div", "card");
  head.innerHTML = `
    <div class="kpi" style="border:none;box-shadow:none;padding:0">
      <div class="label">Encaissé aujourd'hui</div>
      <div class="value accent">${money(todayTotal)}</div>
      <div class="sub">${sales.filter(s => s.date === today()).length} vente(s)</div>
    </div>`;
  view.appendChild(head);

  const title = el("div", "section-title", "Historique");
  view.appendChild(title);

  const card = el("div", "card");
  if (!sales.length) {
    card.innerHTML = `<div class="empty"><div class="big">🧾</div>Aucune vente pour l'instant.<br>Appuyez sur + pour enregistrer la première.</div>`;
  } else {
    const list = el("ul", "list");
    sales.forEach(s => {
      const row = el("li", "row");
      row.innerHTML = `
        <div><div class="main">${s.label || "Vente"}</div>
        <div class="meta">${fmtDate(s.date)} · ${s.pay || "espèces"}${s.qty > 1 ? " · ×" + s.qty : ""}</div></div>
        <div class="amount pos">${money(s.total)}</div>`;
      row.addEventListener("dblclick", async () => { await del("sales", s.id); renderSales(view); toast("Vente supprimée"); });
      list.appendChild(row);
    });
    card.appendChild(list);
    card.appendChild(el("p", "meta", "Astuce : double-clic sur une ligne pour la supprimer."));
  }
  view.appendChild(card);

  view._fab = () => openSaleForm(view);
}

function openSaleForm(view) {
  const form = el("div");
  form.innerHTML = `
    <div class="field"><label>Que vendez-vous ?</label>
      <input id="label" placeholder="Ex. Casquette NY, Menu du jour…"/></div>
    <div class="field"><label>Prix unitaire</label>
      <input id="price" type="number" inputmode="numeric" placeholder="0"/></div>
    <div class="field"><label>Quantité</label>
      <input id="qty" type="number" inputmode="numeric" value="1"/></div>
    <div class="field"><label>Paiement</label>
      <select id="pay">
        <option>Espèces</option><option>Wave</option><option>Orange Money</option>
        <option>Carte</option><option>Crédit / dette</option>
      </select></div>
    <button class="btn" id="save">Enregistrer la vente</button>`;
  const close = openModal("Nouvelle vente", "Enregistrement rapide", form);
  form.querySelector("#label").focus();
  form.querySelector("#save").onclick = async () => {
    const price = Number(form.querySelector("#price").value) || 0;
    const qty = Number(form.querySelector("#qty").value) || 1;
    if (price <= 0) { toast("Indiquez un prix"); return; }
    await put("sales", {
      label: form.querySelector("#label").value.trim(),
      price, qty, total: price * qty,
      pay: form.querySelector("#pay").value,
      date: today(),
    });
    close(); toast("Vente enregistrée ✓"); renderSales(view);
  };
}
