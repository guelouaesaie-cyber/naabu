# NAABU

**La gestion qui s'adapte à votre commerce.**

Application web (PWA) de gestion pour commerçants et entrepreneurs, quel que
soit le métier. Au premier lancement, un assistant pose quelques questions et
construit automatiquement un espace de travail personnalisé : seuls les
modules utiles apparaissent.

- Fonctionne sur iPhone, Android et ordinateur
- Marche **hors ligne** une fois chargée
- Toutes les données restent **sur l'appareil** (aucun serveur)
- Hébergeable gratuitement sur **GitHub Pages**

---

## Mise en ligne sur GitHub Pages

1. Déposez tout le contenu de ce dossier à la racine de votre dépôt.
2. **Settings → Pages**
3. *Source* : « Deploy from a branch », branche `main`, dossier `/ (root)`
4. L'application est en ligne à `https://VOTRE-PSEUDO.github.io/VOTRE-DEPOT/`

Le fichier `.nojekyll` est nécessaire pour que GitHub serve les modules
JavaScript. Il est déjà présent.

### Tester en local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Un serveur est nécessaire (les modules ES ne se chargent pas en `file://`).

### Installer sur le téléphone

Ouvrez l'adresse dans Safari (iPhone) ou Chrome (Android), puis
**Partager → Sur l'écran d'accueil**.

---

## Les modules

| Module | Ce qu'il fait |
|---|---|
| **Tableau de bord** | Recette du jour, résultat sur 30 jours, alertes, graphique 7 jours, conseils |
| **Ventes** | Point de vente tactile, panier, remises, reçu imprimable et partageable, saisie différée |
| **Catalogue** | Articles et variantes, quantités, prix de vente et d'achat, marge, seuils d'alerte |
| **Commandes** | Prise de commande, livreur (Yango, Gozem, maison…), statuts, conversion en vente |
| **Clients** | Répertoire, créances, fidélité, historique d'achats, contact WhatsApp |
| **Fournisseurs** | Contacts, sommes dues, liste de réapprovisionnement |
| **Finances** | Revenus, dépenses par catégorie, résultat net, marge commerciale |
| **Marketing** | Modèles de messages WhatsApp : promotion, arrivage, relance, catalogue |
| **Péremption** | Suivi des dates limites, alertes à J-7 |
| **Prestations** | Services avec tarif et durée |
| **Points de vente** | Plusieurs boutiques ou dépôts |
| **Rapports** | Meilleures ventes, moyens de paiement, exports CSV |

Chaque module s'active selon les réponses au questionnaire, et peut être
activé ou masqué manuellement dans les réglages.

---

## Comment fonctionne la personnalisation

Tout le moteur est dans **`js/engine.js`** :

- `MODULES` — le catalogue des modules
- `QUESTIONS` — le questionnaire (avec questions conditionnelles via `skipIf`)
- `RULES` — les règles de décision

Ajouter un métier ou une règle se fait en une ligne :

```js
{ when: a => a.sector === "beauty", enable: ["loyalty", "clients"] },
```

L'application lit ensuite la liste des modules actifs et construit la
navigation toute seule.

### Le vocabulaire s'adapte au métier

Dans **`js/vocab.js`** : mêmes écrans, mots différents. Une glacière voit
« parfums », une boutique voit « variantes », une pharmacie voit
« présentations », un salon voit « formules ».

---

## Architecture

```
index.html            Point d'entrée
manifest.webmanifest  Métadonnées PWA
sw.js                 Service worker (hors ligne)
.nojekyll             Requis pour GitHub Pages

css/
  style.css           Design system : tokens, composants, reçu
  onboarding.css      Écran de configuration initiale

js/
  icons.js            Bibliothèque d'icônes SVG (aucun emoji)
  engine.js           Modules, questionnaire, règles de décision
  vocab.js            Vocabulaire adaptatif par métier
  store.js            Stockage local (IndexedDB, repli localStorage)
  util.js             Format, feuilles modales, toasts, exports
  onboarding.js       Configuration initiale conversationnelle
  app.js              Coquille, navigation, réglages, sauvegarde
  modules/
    dashboard.js      Tableau de bord
    sales.js          Ventes, point de vente, reçu
    products.js       Catalogue et variantes
    orders.js         Commandes et livraisons
    clients.js        Répertoire clients
    finance.js        Revenus, dépenses, résultat
    more.js           Fournisseurs, marketing, péremption,
                      prestations, points de vente, rapports
```

### Modèle de données

| Store | Champs |
|---|---|
| `config` | `key`, `value` |
| `products` | `name`, `icon`, `variants[]` → `{name, qty, price, cost, min, expiry}` |
| `sales` | `items[]` → `{productId, variantIndex, label, price, cost, qty}`, `subtotal`, `discount`, `total`, `pay`, `client`, `date` |
| `orders` | `client`, `phone`, `address`, `courier`, `items[]`, `fee`, `total`, `status`, `date` |
| `clients` | `name`, `phone`, `debt`, `points`, `note` |
| `expenses` | `label`, `amount`, `cat`, `date` |
| `suppliers` | `name`, `phone`, `what`, `due` |
| `services` | `name`, `price`, `duration` |
| `stores` | `name`, `address` |

**Le point clé** : une vente référence les articles du catalogue
(`productId` + `variantIndex`). C'est ce lien qui décrémente le stock
automatiquement — et le restitue si la vente est annulée.

---

## Interface

- **Icônes** : toutes les icônes sont des SVG au trait dessinés sur une
  grille 24×24 (`js/icons.js`). Aucun emoji dans l'interface.
- **Typographie** : Inter pour le texte, Inter Tight pour les chiffres,
  avec chiffres tabulaires pour l'alignement des montants.
- **Couleurs** : surface claire neutre, accent indigo, sémantique verte
  (positif), ambre (attention), rouge (négatif).
- **Animations** : entrées de vue, feuilles modales, barres du graphique,
  retour haptique sur mobile. Le réglage « animations réduites » du système
  est respecté.

---

## Sauvegarde

Les réglages permettent d'exporter toutes les données dans un fichier JSON et
de les restaurer sur un autre appareil. Les exports CSV (ventes, catalogue,
dépenses) s'ouvrent dans Excel.

---

## Confidentialité

NAABU n'envoie aucune donnée sur Internet. Tout est stocké dans le navigateur
de l'appareil. L'assistant calcule ses conseils localement à partir de vos
chiffres, sans connexion externe.
