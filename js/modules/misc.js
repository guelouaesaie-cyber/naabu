/* NAABU — Modules Clients, Comptabilité, Rapports, et vues "à venir" */
import { el, money, fmtDate, today, openModal, toast } from "../util.js";
import { all, put, del } from "../store.js";
import { MODULES } from "../engine.js";

/* ---------------- CLIENTS ---------------- */
export async function renderClients(view) {
  const clients = (await all("clients")).sort((a, b) => a.name.localeCompare(b.name));
  view.innerHTML = "";
  const title = el("div", "section-title", "Répertoire clients");
  view.appendChild(title);
  const card = el("div", "card");
  if (!clients.length) {
    card.innerHTML = `<div class="empty"><div class="big">👥</div>Aucun client enregistré.<br>Appuyez sur + pour en ajouter.</div>`;
  } else {
    const list = el("ul", "list");
    clients.forEach(c => {
      const row = el("li", "row");
      row.innerHTML = `
        <div><div class="main">${c.name}</div>
        <div class="meta">${c.phone || "—"}${c.debt ? " · doit " : ""}</div></div>
        ${c.debt ? `<div class="amount neg">${money(c.debt)}</div>` : `<div class="badge live">à jour</div>`}`;
      row.querySelector(".main").style.cursor = "pointer";
      row.querySelector(".main").onclick = () => {
        if (c.phone) window.open("https://wa.me/" + c.phone.replace(/\D/g, ""), "_blank");
        else toast("Aucun numéro enregistré");
      };
      row.addEventListener("dblclick", async () => { await del("clients", c.id); renderClients(view); toast("Client supprimé"); });
      list.appendChild(row);
    });
    card.appendChild(list);
    card.appendChild(el("p", "meta", "Touchez un nom pour écrire sur WhatsApp · double-clic pour supprimer."));
  }
  view.appendChild(card);
  view._fab = () => {
    const form = el("div");
    form.innerHTML = `
      <div class="field"><label>Nom du client</label><input id="name" placeholder="Ex. Awa Diop"/></div>
      <div class="field"><label>Téléphone (WhatsApp)</label><input id="phone" placeholder="Ex. 221771234567"/></div>
      <div class="field"><label>Dette éventuelle</label><input id="debt" type="number" inputmode="numeric" value="0"/></div>
      <button class="btn" id="save">Ajouter le client</button>`;
    const close = openModal("Nouveau client", "Fiche CRM", form);
    form.querySelector("#name").focus();
    form.querySelector("#save").onclick = async () => {
      const name = form.querySelector("#name").value.trim();
      if (!name) { toast("Indiquez un nom"); return; }
      await put("clients", { name, phone: form.querySelector("#phone").value.trim(), debt: Number(form.querySelector("#debt").value) || 0 });
      close(); toast("Client ajouté ✓"); renderClients(view);
    };
  };
}

/* ---------------- COMPTABILITÉ ---------------- */
export async function renderAccounting(view) {
  const sales = await all("sales");
  const expenses = (await all("expenses")).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const revenue = sales.reduce((s, x) => s + (x.total || 0), 0);
  const spent = expenses.reduce((s, x) => s + (x.amount || 0), 0);
  const profit = revenue - spent;

  view.innerHTML = "";
  const kpis = el("div", "kpi-grid");
  kpis.innerHTML = `
    <div class="kpi"><div class="label">Revenus</div><div class="value pos">${money(revenue)}</div></div>
    <div class="kpi"><div class="label">Dépenses</div><div class="value" style="color:var(--clay)">${money(spent)}</div></div>`;
  view.appendChild(kpis);
  const p = el("div", "card");
  p.style.marginTop = "12px";
  p.innerHTML = `<div class="label" style="font-size:.72rem;color:var(--ink-soft);text-transform:uppercase">Résultat net</div>
    <div class="value ${profit >= 0 ? "pos" : ""}" style="font-family:var(--font-display);font-size:2rem;font-weight:600;color:${profit >= 0 ? "var(--ok)" : "var(--clay)"}">${money(profit)}</div>`;
  view.appendChild(p);

  view.appendChild(el("div", "section-title", "Dépenses"));
  const card = el("div", "card");
  if (!expenses.length) {
    card.innerHTML = `<div class="empty"><div class="big">💰</div>Aucune dépense enregistrée.</div>`;
  } else {
    const list = el("ul", "list");
    expenses.forEach(x => {
      const row = el("li", "row");
      row.innerHTML = `<div><div class="main">${x.label}</div><div class="meta">${fmtDate(x.date)} · ${x.cat}</div></div><div class="amount neg">-${money(x.amount)}</div>`;
      row.addEventListener("dblclick", async () => { await del("expenses", x.id); renderAccounting(view); toast("Supprimé"); });
      list.appendChild(row);
    });
    card.appendChild(list);
  }
  view.appendChild(card);

  view._fab = () => {
    const form = el("div");
    form.innerHTML = `
      <div class="field"><label>Intitulé</label><input id="label" placeholder="Ex. Achat marchandise"/></div>
      <div class="field"><label>Montant</label><input id="amount" type="number" inputmode="numeric" placeholder="0"/></div>
      <div class="field"><label>Catégorie</label>
        <select id="cat"><option>Achat stock</option><option>Transport</option><option>Loyer</option><option>Salaire</option><option>Marketing</option><option>Autre</option></select></div>
      <button class="btn" id="save">Enregistrer la dépense</button>`;
    const close = openModal("Nouvelle dépense", "Suivi de trésorerie", form);
    form.querySelector("#label").focus();
    form.querySelector("#save").onclick = async () => {
      const amount = Number(form.querySelector("#amount").value) || 0;
      if (amount <= 0) { toast("Indiquez un montant"); return; }
      await put("expenses", { label: form.querySelector("#label").value.trim() || "Dépense", amount, cat: form.querySelector("#cat").value, date: today() });
      close(); toast("Dépense enregistrée ✓"); renderAccounting(view);
    };
  };
}

/* ---------------- RAPPORTS (export CSV) ---------------- */
export async function renderReports(view) {
  view.innerHTML = "";
  view.appendChild(el("div", "section-title", "Exporter mes données"));
  const card = el("div", "card");
  card.innerHTML = `<p style="color:var(--ink-soft);margin-bottom:16px">Téléchargez vos données au format CSV (ouvrable dans Excel). Tout reste sur votre appareil.</p>`;
  ["sales", "stock", "clients", "expenses"].forEach(store => {
    const labels = { sales: "Ventes", stock: "Stock", clients: "Clients", expenses: "Dépenses" };
    const b = el("button", "btn ghost", `Exporter ${labels[store]} (CSV)`);
    b.style.marginBottom = "10px";
    b.onclick = () => exportCSV(store, labels[store]);
    card.appendChild(b);
  });
  view.appendChild(card);
  view._fab = null;
}

async function exportCSV(store, label) {
  const rows = await all(store);
  if (!rows.length) { toast("Rien à exporter"); return; }
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const csv = [cols.join(",")]
    .concat(rows.map(r => cols.map(c => JSON.stringify(r[c] ?? "")).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `naabu-${store}-${today()}.csv`;
  a.click();
  toast(label + " exporté ✓");
}

/* ---------------- VUE "À VENIR" (modules soon) ---------------- */
export function renderSoon(view, key) {
  const m = MODULES[key];
  view.innerHTML = `
    <div class="card"><div class="empty">
      <div class="big">${m.icon}</div>
      <h3 style="margin:8px 0 6px">${m.label}</h3>
      <p>${m.desc}</p>
      <p style="margin-top:14px"><span class="badge soon">Bientôt disponible</span></p>
      <p class="meta" style="margin-top:16px">Ce module fait partie de votre espace personnalisé et sera activé dans une prochaine version.</p>
    </div></div>`;
  view._fab = null;
}
