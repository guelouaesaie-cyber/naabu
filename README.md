# NAABU

**L'espace de gestion qui s'adapte à votre commerce.**

NAABU est une application web (PWA) de gestion pour entrepreneurs de tous
secteurs. Au premier lancement, un assistant conversationnel pose quelques
questions et **construit automatiquement un espace de travail personnalisé** :
seuls les modules utiles à votre métier sont activés.

- 📱 Fonctionne sur iPhone, Android et ordinateur (dans le navigateur)
- 🔌 Marche **hors-ligne** une fois chargée
- 🔒 Toutes les données restent **sur votre appareil** (aucun serveur)
- ⚡ Hébergeable gratuitement sur **GitHub Pages** — votre ordinateur n'est jamais le serveur

---

## 🚀 Mettre en ligne sur GitHub Pages

1. Créez un dépôt sur GitHub (par ex. `naabu`).
2. Déposez tout le contenu de ce dossier à la racine du dépôt.
3. Dans le dépôt : **Settings → Pages**.
4. Sous *Build and deployment → Source*, choisissez **Deploy from a branch**,
   branche `main`, dossier `/ (root)`, puis **Save**.
5. Après une minute, votre app est en ligne à l'adresse :
   `https://VOTRE-PSEUDO.github.io/naabu/`

Le fichier `.nojekyll` (déjà présent) est nécessaire pour que GitHub serve
correctement les modules JavaScript.

### Tester en local d'abord

```bash
# depuis ce dossier
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

> Il faut un petit serveur (comme ci-dessus) car l'app utilise les modules
> JavaScript ES ; ouvrir `index.html` par double-clic ne suffit pas.

### Installer sur le téléphone

Ouvrez l'URL dans Safari (iPhone) ou Chrome (Android) puis
**Partager → Sur l'écran d'accueil**. NAABU s'installe comme une vraie app.

---

## 🧠 Comment fonctionne la personnalisation

Tout le « cerveau » vit dans **`js/engine.js`** :

- `MODULES` — le catalogue de tous les modules (ventes, stock, clients…).
- `QUESTIONS` — le questionnaire de l'assistant (gère les questions
  conditionnelles via `skipIf`).
- `RULES` — les règles de décision : chaque règle regarde les réponses et
  active des modules. Le moteur combine toutes les règles.

**Ajouter un métier ou une règle** = ajouter une entrée dans `RULES`.
Par exemple, activer le module fidélité pour les salons de beauté :

```js
{ when: a => a.sector === "beauty", enable: ["loyalty", "clients"] },
```

Aucun autre fichier à toucher : l'app lit la liste des modules activés et
construit la navigation toute seule.

---

## 🗂️ Architecture

```
index.html            Point d'entrée + enregistrement du service worker
manifest.webmanifest  Métadonnées PWA (installation)
sw.js                 Service worker (cache hors-ligne)
.nojekyll             Requis pour GitHub Pages

css/
  style.css           Identité visuelle + composants
  onboarding.css      Écran de configuration conversationnel

js/
  engine.js           Moteur : modules, questionnaire, règles de décision
  store.js            Stockage local (IndexedDB, repli localStorage)
  onboarding.js       "Business Setup IA" — la conversation d'accueil
  app.js              Shell, navigation dynamique, réglages
  util.js             Helpers (monnaie, dates, modale, toast)
  modules/
    dashboard.js      KPI, mini-graphe, alertes, conseil de l'assistant
    sales.js          Ventes : saisie rapide + historique
    stock.js          Inventaire + alertes de stock bas
    misc.js           Clients (CRM), Comptabilité, Rapports (export CSV),
                      et les vues "à venir" des modules non-MVP
```

### Modèle de données (stores locaux)

| Store       | Champs principaux                                  |
|-------------|----------------------------------------------------|
| `config`    | `key`, `value` (réponses, modules, nom, onboarded) |
| `sales`     | `label`, `price`, `qty`, `total`, `pay`, `date`    |
| `stock`     | `name`, `qty`, `price`, `min` (seuil d'alerte)     |
| `clients`   | `name`, `phone`, `debt`                            |
| `expenses`  | `label`, `amount`, `cat`, `date`                   |
| `products`  | (réservé pour une version future)                  |

---

## ✅ Ce que fait le MVP actuel

Modules **pleinement fonctionnels** : Tableau de bord, Ventes, Stock,
Clients, Comptabilité, Rapports (export CSV), Assistant IA (conseils locaux).

Modules **personnalisés mais marqués « à venir »** : Fournisseurs, Marketing,
Livraisons, Dates & lots, Variantes, Prestations, Multi-points, Fidélité,
Produits. Ils apparaissent dans l'espace selon le profil et seront activés
dans les prochaines versions.

## 🛣️ Plan par phases

- **v1 (actuelle)** — Setup IA + tableau de bord + ventes + stock + clients +
  compta + export. Offline. Données locales.
- **v2** — Produits & variantes complets, module fournisseurs, livraisons.
- **v3** — Marketing (campagnes WhatsApp/réseaux), fidélité, dates de péremption.
- **v4** — Synchronisation multi-appareils optionnelle (backend au choix),
  assistant IA connecté à une vraie API.

---

## 🔐 Confidentialité

NAABU n'envoie aucune donnée sur Internet. Tout est stocké dans le navigateur
de l'appareil. L'export CSV et la réinitialisation sont disponibles dans les
**Réglages** (icône ⚙️).

---

*Assistant IA : dans cette version, les conseils sont calculés localement à
partir de vos chiffres (produit le plus rentable, alertes de stock, résultat
net). Aucune connexion externe n'est nécessaire — ce qui garde l'app rapide,
gratuite et privée.*
