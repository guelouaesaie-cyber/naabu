/* =============================================================
   NAABU — Onboarding "Business Setup IA"
   Anime une conversation qui pose les questions du moteur,
   collecte les réponses, puis affiche le résumé des modules.
   ============================================================= */

import { QUESTIONS, resolveModules, MODULES, sectorLabel, nextQuestions } from "./engine.js";
import { setConfig } from "./store.js";

const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Lance l'onboarding dans le conteneur donné.
 * @param {HTMLElement} root
 * @param {Function} onDone  appelé avec (answers, modules, bizName) à la fin
 */
export async function runOnboarding(root, onDone) {
  const answers = {};
  let idx = 0;

  root.innerHTML = `
    <div class="onb">
      <div class="onb-head">
        <div class="logo">NAA<span>BU</span></div>
        <div class="onb-progress"><i style="width:0%"></i></div>
      </div>
      <div class="chat" id="chat"></div>
      <div id="answerZone"></div>
    </div>`;

  const chat = root.querySelector("#chat");
  const zone = root.querySelector("#answerZone");
  const bar  = root.querySelector(".onb-progress i");

  const scroll = () => { chat.scrollTop = chat.scrollHeight; };

  async function botSay(html, delay = 500) {
    const t = el("div", "bubble bot", `<span class="typing"><i></i><i></i><i></i></span>`);
    chat.appendChild(t); scroll();
    await wait(delay);
    t.innerHTML = html; scroll();
  }
  function meSay(text) {
    chat.appendChild(el("div", "bubble me", text)); scroll();
  }

  // Message d'accueil
  await botSay("Bonjour 👋 Bienvenue !", 400);
  await wait(300);
  await botSay("Je vais personnaliser votre espace de travail. Cela prendra moins de 2 minutes.", 700);
  await wait(300);

  // On demande d'abord le nom de l'activité (touche personnelle)
  await botSay("Comment s'appelle votre activité ?", 600);
  await askName();

  async function askName() {
    zone.innerHTML = "";
    const f = el("div", "options");
    f.innerHTML = `
      <input id="bizName" class="opt" style="display:block"
             placeholder="Ex. Chez Awa, Baye Fall Motors…" />
      <button class="btn" id="bizGo">Continuer</button>`;
    zone.appendChild(f);
    const input = f.querySelector("#bizName");
    input.focus();
    const go = async () => {
      const name = input.value.trim() || "Mon activité";
      answers._bizName = name;
      meSay(name);
      await wait(200);
      askQuestion();
    };
    f.querySelector("#bizGo").onclick = go;
    input.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  }

  async function askQuestion() {
    const visible = nextQuestions(answers);
    if (idx >= visible.length) return finish();
    const q = visible[idx];
    bar.style.width = Math.round((idx / visible.length) * 100) + "%";

    await botSay(q.text, 550);
    zone.innerHTML = "";
    const box = el("div", "options");

    if (q.type === "multi") {
      const picked = new Set();
      q.options.forEach((o, i) => {
        const b = el("button", "opt", `<span class="ic">${o.icon || ""}</span><span>${o.label}</span><span class="chk">✓</span>`);
        b.style.animationDelay = (i * 40) + "ms";
        b.onclick = () => {
          if (picked.has(o.value)) { picked.delete(o.value); b.classList.remove("selected"); }
          else { picked.add(o.value); b.classList.add("selected"); }
        };
        box.appendChild(b);
      });
      const done = el("div", "multi-actions");
      done.innerHTML = `<button class="btn">Valider</button>`;
      done.querySelector("button").onclick = async () => {
        answers[q.id] = [...picked];
        const labels = q.options.filter(o => picked.has(o.value)).map(o => o.label);
        meSay(labels.length ? labels.join(", ") : "Aucun");
        idx++; await wait(200); askQuestion();
      };
      zone.appendChild(box); zone.appendChild(done);
    } else {
      q.options.forEach((o, i) => {
        const b = el("button", "opt", `<span class="ic">${o.icon || ""}</span><span>${o.label}</span>`);
        b.style.animationDelay = (i * 40) + "ms";
        b.onclick = async () => {
          answers[q.id] = o.value;
          meSay(o.label);
          idx++; await wait(200); askQuestion();
        };
        box.appendChild(b);
      });
      zone.appendChild(box);
    }
    scroll();
  }

  async function finish() {
    bar.style.width = "100%";
    zone.innerHTML = "";
    await botSay("C'est parfait, j'assemble votre espace… ⚙️", 700);
    await wait(700);

    const mods = resolveModules(answers);
    const summary = el("div", "summary");
    summary.innerHTML = `
      <h1>Votre espace est prêt !</h1>
      <p class="lead">${sectorLabel(answers.sector)} · ${answers._bizName}</p>
      <div class="mods"></div>
      <button class="btn safran" id="enter">Entrer dans mon espace →</button>`;
    const grid = summary.querySelector(".mods");
    mods.forEach((k, i) => {
      const m = MODULES[k];
      const item = el("div", "m", `<span class="ic">${m.icon}</span><span>${m.label}</span><span class="chk">✓</span>`);
      item.style.animationDelay = (i * 60) + "ms";
      grid.appendChild(item);
    });
    root.querySelector(".onb").appendChild(summary);
    summary.scrollIntoView({ behavior: "smooth" });

    summary.querySelector("#enter").onclick = async () => {
      await setConfig("answers", answers);
      await setConfig("modules", mods);
      await setConfig("bizName", answers._bizName);
      await setConfig("onboarded", true);
      onDone(answers, mods, answers._bizName);
    };
  }
}
