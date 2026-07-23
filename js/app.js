/* =============================================================
   NAABU — Application principale
   Assemble l'espace de travail personnalisé à partir des modules
   activés par le moteur, et gère la navigation.
   ============================================================= */

import { getConfig, setConfig, wipe } from "./store.js";
import { MODULES, resolveModules, sectorLabel } from "./engine.js";
import { runOnboarding } from "./onboarding.js";
import { el, openModal, toast } from "./util.js";

import { renderDashboard } from "./modules/dashboard.js";
import { renderSales } from "./modules/sales.js";
import { renderStock } from "./modules/stock.js";
import { renderClients, renderAccounting, renderReports, renderSoon } from "./modules/misc.js";

const root = document.getElementById("app");

/* Association module -> fonction de rendu.
   Les modules "soon" retombent sur renderSoon. */
const RENDERERS = {
  dashboard:  renderDashboard,
  sales:      renderSales,
  stock:      renderStock,
  products:   (v) => renderSoon(v, "products"),
  clients:    renderClients,
  suppliers:  (v) => renderSoon(v, "suppliers"),
  accounting: renderAccounting,
  marketing:  (v) => renderSoon(v, "marketing"),
  delivery:   (v) => renderSoon(v, "delivery"),
  expiry:     (v) => renderSoon(v, "expiry"),
  variants:   (v) => renderSoon(v, "variants"),
  services:   (v) => renderSoon(v, "services"),
  multistore: (v) => renderSoon(v, "multistore"),
  loyalty:    (v) => renderSoon(v, "loyalty"),
  reports:    renderReports,
  ai:         renderDashboard, // l'assistant vit dans le tableau de bord pour le MVP
};

/* Modules mis en avant dans la barre du bas (max 5, le reste dans "Plus") */
const NAV_PRIORITY = ["dashboard", "sales", "stock", "clients", "accounting", "reports"];

let state = { modules: [], bizName: "", current: "dashboard" };

async function boot() {
  const done = await getConfig("onboarded");
  if (!done) {
    runOnboarding(root, (answers, modules, bizName) => {
      state.modules = modules; state.bizName = bizName;
      buildApp();
    });
    return;
  }
  state.modules = (await getConfig("modules")) || resolveModules({});
  state.bizName = (await getConfig("bizName")) || "Mon activité";
  buildApp();
}

function buildApp() {
  // On garde dashboard toujours en premier
  if (!state.modules.includes("dashboard")) state.modules.unshift("dashboard");
  state.current = "dashboard";

  const navMods = NAV_PRIORITY.filter(k => state.modules.includes(k)).slice(0, 5);
  const extra = state.modules.filter(k => !navMods.includes(k) && MODULES[k]);

  root.innerHTML = `
    <div class="app">
      <div class="topbar">
        <div>
          <div class="brand">NAA<span>BU</span></div>
          <div class="biz">${state.bizName}</div>
        </div>
        <button class="menu-btn" id="settingsBtn" aria-label="Réglages">⚙️</button>
      </div>
      <div class="view" id="view"></div>
      <button class="fab" id="fab" aria-label="Ajouter">＋</button>
      <nav class="tabbar" id="tabbar"></nav>
    </div>`;

  const tabbar = root.querySelector("#tabbar");
  navMods.forEach(k => {
    const m = MODULES[k];
    const b = el("button", null, `<span class="ic">${m.icon}</span><span>${m.label}</span>`);
    b.dataset.mod = k;
    b.onclick = () => navigate(k);
    tabbar.appendChild(b);
  });
  if (extra.length) {
    const b = el("button", null, `<span class="ic">⋯</span><span>Plus</span>`);
    b.onclick = () => openMore(extra);
    tabbar.appendChild(b);
  }

  root.querySelector("#settingsBtn").onclick = openSettings;
  navigate("dashboard");
}

async function navigate(key) {
  state.current = key;
  const view = root.querySelector("#view");
  const fab = root.querySelector("#fab");

  // état actif de la barre
  root.querySelectorAll(".tabbar button").forEach(b => {
    b.classList.toggle("active", b.dataset.mod === key);
  });

  view._fab = null;
  const render = RENDERERS[key] || ((v) => renderSoon(v, key));
  await render(view);

  // Gestion du bouton +
  if (view._fab) {
    fab.style.display = "flex";
    fab.onclick = view._fab;
  } else {
    fab.style.display = "none";
  }
  view.scrollIntoView({ behavior: "instant", block: "start" });
}

function openMore(extra) {
  const box = el("div", "mod-grid");
  extra.forEach(k => {
    const m = MODULES[k];
    const c = el("button", "mod");
    c.innerHTML = `<span class="ic">${m.icon}</span><span class="name">${m.label}</span><span class="d">${m.desc}</span>`;
    c.onclick = () => { close(); navigate(k); };
    box.appendChild(c);
  });
  const close = openModal("Tous vos modules", "Votre espace personnalisé", box);
}

function openSettings() {
  const box = el("div");
  const activeList = state.modules.map(k => {
    const m = MODULES[k];
    const badge = m.status === "live" ? `<span class="badge live">actif</span>` : `<span class="badge soon">à venir</span>`;
    return `<div class="row"><div class="main">${m.icon} ${m.label}</div>${badge}</div>`;
  }).join("");

  box.innerHTML = `
    <div class="section-title" style="margin-top:0">Modules de votre espace</div>
    <div class="card" style="margin-bottom:16px">${activeList}</div>
    <button class="btn ghost" id="redo" style="margin-bottom:10px">Refaire la configuration</button>
    <button class="btn" id="reset" style="background:var(--clay)">Effacer toutes les données</button>
    <p class="meta" style="margin-top:14px;text-align:center">NAABU · vos données restent sur cet appareil.</p>`;

  const close = openModal("Réglages", sectorLabel((state.answers || {}).sector), box);

  box.querySelector("#redo").onclick = async () => {
    await setConfig("onboarded", false);
    close(); runOnboarding(root, (a, m, b) => { state.modules = m; state.bizName = b; buildApp(); });
  };
  box.querySelector("#reset").onclick = async () => {
    if (confirm("Effacer définitivement toutes vos données ? Cette action est irréversible.")) {
      await wipe();
      close(); toast("Données effacées");
      runOnboarding(root, (a, m, b) => { state.modules = m; state.bizName = b; buildApp(); });
    }
  };
}

boot();
