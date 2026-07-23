/* =============================================================
   NAABU — Moteur de personnalisation ("Business Setup IA")
   -------------------------------------------------------------
   Ce fichier contient toute la logique métier de configuration :
     1. Le catalogue des modules disponibles
     2. Le questionnaire conversationnel
     3. Les règles de décision qui activent/désactivent les modules
   Aucune dépendance externe. Testable et extensible.
   ============================================================= */

/* -------------------------------------------------------------
   1. CATALOGUE DES MODULES
   Chaque module a une clé stable, un libellé, une icône (emoji),
   une description courte et un statut d'implémentation.
   status: "live"  -> module réellement fonctionnel dans ce MVP
           "soon"  -> apparaît dans l'espace mais marqué "à venir"
   ------------------------------------------------------------- */
export const MODULES = {
  dashboard:   { label: "Tableau de bord", icon: "📊", desc: "KPI, graphiques et alertes", status: "live",  core: true },
  sales:       { label: "Ventes",          icon: "🧾", desc: "Enregistrement rapide, historique", status: "live", core: true },
  stock:       { label: "Stock",           icon: "📦", desc: "Entrées, sorties, inventaire, alertes", status: "live" },
  products:    { label: "Produits",        icon: "🏷️", desc: "Catégories, variantes, prix", status: "live" },
  clients:     { label: "Clients",         icon: "👥", desc: "CRM, historique, dettes, fidélité", status: "live" },
  suppliers:   { label: "Fournisseurs",    icon: "🚚", desc: "Commandes, paiements, historique", status: "soon" },
  accounting:  { label: "Comptabilité",    icon: "💰", desc: "Dépenses, revenus, trésorerie", status: "live" },
  marketing:   { label: "Marketing",       icon: "📣", desc: "Promotions, campagnes, réseaux", status: "soon" },
  delivery:    { label: "Livraisons",      icon: "🛵", desc: "Suivi des livraisons et adresses", status: "soon" },
  expiry:      { label: "Dates & lots",    icon: "⏳", desc: "Péremption et suivi par lot", status: "soon" },
  variants:    { label: "Variantes",       icon: "🎨", desc: "Tailles, couleurs, parfums, marques", status: "soon" },
  services:    { label: "Prestations",     icon: "🛠️", desc: "Services, rendez-vous, devis", status: "soon" },
  multistore:  { label: "Multi-points",    icon: "🏬", desc: "Plusieurs dépôts / boutiques", status: "soon" },
  loyalty:     { label: "Fidélité",        icon: "⭐", desc: "Points et récompenses clients", status: "soon" },
  reports:     { label: "Rapports",        icon: "📑", desc: "Export PDF, Excel, CSV", status: "live" },
  ai:          { label: "Assistant IA",    icon: "🤖", desc: "Conseils et prévisions", status: "live", core: true },
};

/* -------------------------------------------------------------
   2. LE QUESTIONNAIRE
   Chaque question a :
     - id        : clé de la réponse
     - text      : la question posée par l'assistant
     - type      : "choice" (une réponse) | "multi" (plusieurs)
     - options   : [{ value, label, icon? }]
     - skipIf    : (answers) => bool  -> saute la question si vrai
   L'ordre compte : le profil "métier" oriente les questions suivantes.
   ------------------------------------------------------------- */
export const QUESTIONS = [
  {
    id: "sector",
    text: "Pour commencer, dans quel domaine travaillez-vous ?",
    type: "choice",
    options: [
      { value: "food",     label: "Alimentaire / Restaurant / Glacier", icon: "🍽️" },
      { value: "retail",   label: "Boutique / Revente / Grossiste",      icon: "🛍️" },
      { value: "pharmacy", label: "Pharmacie / Santé",                   icon: "💊" },
      { value: "beauty",   label: "Salon / Beauté / Coiffure",           icon: "💇" },
      { value: "garage",   label: "Garage / Atelier / Artisan",          icon: "🔧" },
      { value: "services", label: "Services / Freelance / Prestataire",  icon: "🧠" },
      { value: "ecom",     label: "E-commerce / Marketplace",            icon: "🌐" },
      { value: "agri",     label: "Agriculture / Élevage",               icon: "🌾" },
      { value: "other",    label: "Association / ONG / Autre",           icon: "🤝" },
    ],
  },
  {
    id: "offer",
    text: "Vendez-vous des produits, des services, ou les deux ?",
    type: "choice",
    options: [
      { value: "products", label: "Des produits",  icon: "📦" },
      { value: "services", label: "Des services",  icon: "🛠️" },
      { value: "both",     label: "Les deux",      icon: "🔀" },
    ],
  },
  {
    id: "stock",
    text: "Gérez-vous un stock de marchandises ?",
    type: "choice",
    skipIf: (a) => a.offer === "services",
    options: [
      { value: "yes", label: "Oui, je gère du stock", icon: "✅" },
      { value: "no",  label: "Non", icon: "❌" },
    ],
  },
  {
    id: "perishable",
    text: "Vos produits ont-ils une date de péremption ou un suivi par lot ?",
    type: "choice",
    skipIf: (a) => a.stock !== "yes",
    options: [
      { value: "yes", label: "Oui (frais, médicaments, cosmétiques…)", icon: "⏳" },
      { value: "no",  label: "Non", icon: "❌" },
    ],
  },
  {
    id: "hasVariants",
    text: "Vos produits ont-ils des variantes (tailles, couleurs, parfums…) ?",
    type: "choice",
    skipIf: (a) => a.stock !== "yes",
    options: [
      { value: "yes", label: "Oui", icon: "🎨" },
      { value: "no",  label: "Non", icon: "❌" },
    ],
  },
  {
    id: "team",
    text: "Combien de personnes travaillent avec vous ?",
    type: "choice",
    options: [
      { value: "solo",  label: "Juste moi",    icon: "🙋" },
      { value: "small", label: "2 à 5",        icon: "👥" },
      { value: "big",   label: "Plus de 5",    icon: "👨‍👩‍👧‍👦" },
    ],
  },
  {
    id: "delivery",
    text: "Faites-vous des livraisons ?",
    type: "choice",
    options: [
      { value: "yes", label: "Oui", icon: "🛵" },
      { value: "no",  label: "Non", icon: "🏠" },
    ],
  },
  {
    id: "suppliers",
    text: "Travaillez-vous avec des fournisseurs à suivre ?",
    type: "choice",
    options: [
      { value: "yes", label: "Oui", icon: "🚚" },
      { value: "no",  label: "Non", icon: "❌" },
    ],
  },
  {
    id: "channels",
    text: "Sur quels canaux vendez-vous ou communiquez-vous ?",
    type: "multi",
    options: [
      { value: "whatsapp",  label: "WhatsApp",  icon: "💬" },
      { value: "instagram", label: "Instagram", icon: "📸" },
      { value: "facebook",  label: "Facebook",  icon: "👍" },
      { value: "tiktok",    label: "TikTok",    icon: "🎵" },
      { value: "shop",      label: "En boutique", icon: "🏪" },
    ],
  },
  {
    id: "loyalty",
    text: "Souhaitez-vous fidéliser vos clients (points, remises, dettes) ?",
    type: "choice",
    options: [
      { value: "yes", label: "Oui", icon: "⭐" },
      { value: "no",  label: "Non", icon: "❌" },
    ],
  },
  {
    id: "multistore",
    text: "Avez-vous plusieurs points de vente ou dépôts ?",
    type: "choice",
    options: [
      { value: "yes", label: "Oui", icon: "🏬" },
      { value: "no",  label: "Un seul", icon: "🏠" },
    ],
  },
  {
    id: "finance",
    text: "Voulez-vous suivre bénéfices, dépenses et objectifs ?",
    type: "choice",
    options: [
      { value: "yes", label: "Oui, c'est important", icon: "💰" },
      { value: "no",  label: "Plus tard", icon: "⏭️" },
    ],
  },
];

/* -------------------------------------------------------------
   3. LES RÈGLES DE DÉCISION
   On part d'un ensemble de modules "core" toujours actifs, puis
   chaque règle inspecte les réponses et active des modules.
   Une règle = { when(answers) -> bool, enable: [clés] , note? }
   L'ensemble est facilement extensible : ajoutez une règle,
   le moteur la prend en compte automatiquement.
   ------------------------------------------------------------- */
const RULES = [
  // --- Offre ---
  { when: a => a.offer === "products" || a.offer === "both", enable: ["products", "stock"] },
  { when: a => a.offer === "services" || a.offer === "both", enable: ["services"] },

  // --- Stock & dérivés ---
  { when: a => a.stock === "yes",            enable: ["stock", "products"] },
  { when: a => a.perishable === "yes",       enable: ["expiry"] },
  { when: a => a.hasVariants === "yes",      enable: ["variants", "products"] },

  // --- Secteurs spécifiques ---
  { when: a => a.sector === "food",     enable: ["stock", "products", "expiry"] },
  { when: a => a.sector === "retail",   enable: ["stock", "products", "suppliers"] },
  { when: a => a.sector === "pharmacy", enable: ["stock", "products", "expiry", "suppliers"] },
  { when: a => a.sector === "beauty",   enable: ["services", "clients", "loyalty"] },
  { when: a => a.sector === "garage",   enable: ["services", "clients", "suppliers"] },
  { when: a => a.sector === "services", enable: ["services", "clients"] },
  { when: a => a.sector === "ecom",     enable: ["stock", "products", "delivery", "marketing"] },
  { when: a => a.sector === "agri",     enable: ["stock", "products", "suppliers"] },

  // --- Logistique & relation ---
  { when: a => a.delivery === "yes",    enable: ["delivery"] },
  { when: a => a.suppliers === "yes",   enable: ["suppliers"] },
  { when: a => a.loyalty === "yes",     enable: ["clients", "loyalty"] },
  { when: a => a.multistore === "yes",  enable: ["multistore"] },
  { when: a => a.finance === "yes",     enable: ["accounting", "reports"] },

  // --- Canaux -> marketing ---
  { when: a => Array.isArray(a.channels) &&
               a.channels.some(c => ["instagram","facebook","tiktok","whatsapp"].includes(c)),
    enable: ["marketing", "clients"] },

  // --- Équipe -> journal / permissions (représenté par reports ici) ---
  { when: a => a.team === "big" || a.team === "small", enable: ["reports"] },
];

/* Modules toujours présents, quel que soit le profil */
const CORE = Object.entries(MODULES)
  .filter(([, m]) => m.core)
  .map(([k]) => k);

/**
 * Applique toutes les règles aux réponses et renvoie l'ensemble
 * ordonné des clés de modules à activer.
 * @param {Object} answers
 * @returns {string[]} clés de modules activés, dans l'ordre du catalogue
 */
export function resolveModules(answers) {
  const active = new Set(CORE);
  for (const rule of RULES) {
    try {
      if (rule.when(answers)) rule.enable.forEach(k => active.add(k));
    } catch (_) { /* une règle qui échoue ne casse pas le moteur */ }
  }
  // On respecte l'ordre du catalogue pour un affichage stable
  return Object.keys(MODULES).filter(k => active.has(k));
}

/**
 * Renvoie la liste des questions à poser compte tenu des réponses
 * déjà données (gère les skipIf dynamiquement).
 */
export function nextQuestions(answers) {
  return QUESTIONS.filter(q => !(q.skipIf && q.skipIf(answers)));
}

/**
 * Petit label lisible du secteur, pour le résumé final.
 */
export function sectorLabel(value) {
  const q = QUESTIONS.find(q => q.id === "sector");
  const opt = q.options.find(o => o.value === value);
  return opt ? opt.label : "Votre activité";
}
