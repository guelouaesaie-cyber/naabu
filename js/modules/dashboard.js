/* NAABU — Tableau de bord intelligent */
import { el, money, today } from "../util.js";
import { all, getConfig } from "../store.js";

export async function renderDashboard(view) {
  const sales = await all("sales");
  const expenses = await all("expenses");
  const stock = await all("stock");
  const bizName = (await getConfig("bizName")) || "Mon activité";

  const revenue = sales.reduce((s, x) => s + (x.total || 0), 0);
  const spent = expenses.reduce((s, x) => s + (x.amount || 0), 0);
  const profit = revenue - spent;
  const todayTotal = sales.filter(s => s.date === today()).reduce((s, x) => s + x.total, 0);
  const lowStock = stock.filter(i => i.qty <= (i.min ?? 3));

  view.innerHTML = "";

  const hello = el("div");
  hello.innerHTML = `<h2 style="margin-bottom:2px">Bonjour 👋</h2><p class="meta" style="margin-bottom:16px">${bizName}</p>`;
  view.appendChild(hello);

  // KPI principaux
  const grid = el("div", "kpi-grid");
  grid.innerHTML = `
    <div class="kpi"><div class="label">Aujourd'hui</div><div class="value accent">${money(todayTotal)}</div><div class="sub">encaissé</div></div>
    <div class="kpi"><div class="label">Chiffre d'affaires</div><div class="value">${money(revenue)}</div><div class="sub">total</div></div>
    <div class="kpi"><div class="label">Bénéfice</div><div class="value ${profit >= 0 ? "pos" : ""}" style="${profit < 0 ? "color:var(--clay)" : ""}">${money(profit)}</div><div class="sub">net</div></div>
    <div class="kpi"><div class="label">Ventes</div><div class="value">${sales.length}</div><div class="sub">enregistrées</div></div>`;
  view.appendChild(grid);

  // Mini-graphe : 7 derniers jours
  view.appendChild(el("div", "section-title", "Ventes des 7 derniers jours"));
  const chartCard = el("div", "card chart-wrap");
  const days = last7Days();
  const totals = days.map(d => sales.filter(s => s.date === d).reduce((s, x) => s + x.total, 0));
  const max = Math.max(...totals, 1);
  const chart = el("div", "chart");
  days.forEach((d, i) => {
    const bar = el("div", "bar");
    bar.style.height = Math.max(4, (totals[i] / max) * 100) + "%";
    bar.appendChild(el("span", null, dayShort(d)));
    bar.title = money(totals[i]);
    chart.appendChild(bar);
  });
  chartCard.appendChild(chart);
  view.appendChild(chartCard);

  // Alertes
  if (lowStock.length) {
    const a = el("div", "card");
    a.style.borderColor = "var(--clay)";
    a.innerHTML = `<div class="section-title" style="margin:0 0 8px;color:var(--clay)">⚠️ Alertes stock</div>` +
      lowStock.slice(0, 4).map(i => `<div class="row"><div class="main">${i.name}</div><div class="amount neg">${i.qty} restant(s)</div></div>`).join("");
    view.appendChild(a);
  }

  // Conseil "IA" (heuristique locale, sans serveur)
  view.appendChild(el("div", "section-title", "🤖 Conseil de l'assistant"));
  const tip = el("div", "card");
  tip.innerHTML = `<p style="line-height:1.6">${advise({ sales, revenue, profit, lowStock, todayTotal })}</p>`;
  view.appendChild(tip);

  view._fab = null;
}

/* Heuristiques de conseil — 100% local, extensible vers une vraie IA plus tard */
function advise({ sales, revenue, profit, lowStock, todayTotal }) {
  if (!sales.length) return "Commencez par enregistrer vos ventes dans l'onglet Ventes. Dès les premières entrées, je vous montrerai vos tendances et vos produits les plus rentables.";
  if (lowStock.length) return `Vous avez <b>${lowStock.length} article(s)</b> en stock bas. Pensez à réapprovisionner « ${lowStock[0].name} » avant la rupture pour ne pas perdre de ventes.`;
  if (profit < 0) return "Vos dépenses dépassent vos revenus sur la période. Regardez l'onglet Comptabilité pour repérer les postes les plus lourds et ajuster vos marges.";
  // Produit le plus vendu
  const byLabel = {};
  sales.forEach(s => { byLabel[s.label || "Vente"] = (byLabel[s.label || "Vente"] || 0) + s.total; });
  const best = Object.entries(byLabel).sort((a, b) => b[1] - a[1])[0];
  if (best) return `Votre meilleure source de revenus est <b>« ${best[0]} »</b> (${money(best[1])}). Mettez-le en avant auprès de vos clients et assurez-vous d'avoir toujours du stock.`;
  return "Belle progression ! Continuez à enregistrer chaque vente pour affiner vos prévisions.";
}

function last7Days() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
function dayShort(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2);
}
