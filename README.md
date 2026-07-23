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
  vocab.js            Vocabulaire adaptatif selon le métier
  store.js            Stockage local (IndexedDB, repli localStorage)
  onboarding.js       "Business Setup IA" — la conversation d'accueil
  app.js              Shell, navigation dynamique, réglages
  util.js             Helpers (monnaie, dates, modale, confirmation, toast)
  modules/
    dashboard.js      Raccourcis, KPI, graphe, alertes, conseil de l'assistant
    products.js       Catalogue : articles + variantes + stock (le socle)
    sales.js          Vente depuis le catalogue, panier, saisie différée
    orders.js         Commandes, livreurs, statuts, conversion en vente
    misc.js           Clients (CRM), Comptabilité, Export CSV,
                      et les vues "à venir" des modules non encore construits
```

### Modèle de données (stores locaux)

| Store       | Champs principaux                                                |
|-------------|------------------------------------------------------------------|
| `config`    | `key`, `value` (réponses, modules, nom, onboarded)               |
| `products`  | `name`, `emoji`, `variants[]` → `{name, qty, price, min}`        |
| `sales`     | `items[]` → `{productId, variantIndex, label, price, qty}`, `total`, `pay`, `date` |
| `orders`    | `client`, `phone`, `address`, `courier`, `items[]`, `total`, `status`, `date` |
| `clients`   | `name`, `phone`, `debt`                                          |
| `expenses`  | `label`, `amount`, `cat`, `date`                                 |

**Le point clé** : une vente référence les articles du catalogue
(`productId` + `variantIndex`). C'est ce lien qui permet de décrémenter le
stock automatiquement — et de le restituer si on supprime la vente.

---

## ✅ Ce que fait la version actuelle (v2)

Modules **pleinement fonctionnels** :

- **Catalogue** — vos articles avec leurs variantes (parfums, tailles,
  couleurs, modèles). Chaque variante a sa quantité et son prix.
- **Ventes** — on vend en touchant un article : le stock se décrémente tout
  seul. Panier multi-articles, plusieurs moyens de paiement, et **saisie
  différée** pour enregistrer les ventes notées sur un cahier.
- **Commandes & livraisons** — prise de commande avec client, adresse et
  livreur (Yango, Gozem, livreur maison, retrait). Statuts : à préparer →
  en route → livrée. Une commande livrée devient une vente automatiquement.
- **Tableau de bord** — raccourcis d'action, KPI, graphe 7 jours, commandes
  en cours, alertes de stock bas, conseils de l'assistant.
- **Clients** (CRM + lien WhatsApp), **Comptabilité**, **Export CSV**.

Modules **affichés selon le profil mais marqués « à venir »** : Fournisseurs,
Marketing, Dates & lots, Prestations, Multi-points, Fidélité.

### Le vocabulaire s'adapte au métier

Les écrans sont les mêmes pour tous, mais les mots changent (`js/vocab.js`) :
une glacière voit « parfums », un vendeur de vêtements voit « variantes »,
une pharmacie voit « présentations », un coiffeur voit « formules ».
C'est ce qui rend l'app utilisable par n'importe quel commerce sans la
rendre générique.

## 🛣️ Plan par phases

- **v1** — Setup IA + tableau de bord + ventes + stock simple.
- **v2 (actuelle)** — Catalogue avec variantes, lien stock↔vente automatique,
  commandes & livraisons, saisie différée, vocabulaire adaptatif.
- **v3** — Fournisseurs, marketing WhatsApp, dates de péremption, fidélité.
- **v4** — Synchronisation multi-appareils optionnelle, assistant IA connecté.

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
