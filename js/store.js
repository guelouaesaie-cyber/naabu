/* =============================================================
   NAABU — Stockage local
   -------------------------------------------------------------
   Toutes les données restent sur l'appareil de l'utilisateur.
   On utilise IndexedDB (via une fine surcouche) et, à défaut,
   un repli sur localStorage. Aucune donnée n'est envoyée ailleurs.
   ============================================================= */

const DB_NAME = "naabu";
const DB_VERSION = 1;
const STORES = ["config", "sales", "stock", "products", "clients", "expenses"];

let _db = null;

/** Ouvre (ou crée) la base IndexedDB. */
function openDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("no-idb"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const opts = name === "config"
            ? { keyPath: "key" }
            : { keyPath: "id", autoIncrement: true };
          db.createObjectStore(name, opts);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function db() {
  if (_db) return _db;
  try { _db = await openDB(); }
  catch (_) { _db = null; } // on basculera sur localStorage
  return _db;
}

/* ---------- Repli localStorage ---------- */
const ls = {
  get(store, key) {
    const all = JSON.parse(localStorage.getItem("naabu:" + store) || "{}");
    return key == null ? Object.values(all) : all[key];
  },
  put(store, value, key) {
    const all = JSON.parse(localStorage.getItem("naabu:" + store) || "{}");
    const id = key ?? value.id ?? (value.id = Date.now() + Math.random());
    all[id] = value;
    localStorage.setItem("naabu:" + store, JSON.stringify(all));
    return id;
  },
  del(store, key) {
    const all = JSON.parse(localStorage.getItem("naabu:" + store) || "{}");
    delete all[key];
    localStorage.setItem("naabu:" + store, JSON.stringify(all));
  },
};

/* ---------- API publique ---------- */

/** Enregistre un objet dans un store. Renvoie l'id. */
export async function put(store, value) {
  const database = await db();
  if (!database) return ls.put(store, value);
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Récupère tous les objets d'un store (tableau). */
export async function all(store) {
  const database = await db();
  if (!database) return ls.get(store);
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/** Supprime un objet par clé. */
export async function del(store, key) {
  const database = await db();
  if (!database) return ls.del(store, key);
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Config (clé/valeur) ---------- */
export async function setConfig(key, value) {
  const database = await db();
  if (!database) { ls.put("config", { key, value }, key); return key; }
  return put("config", { key, value });
}
export async function getConfig(key) {
  const database = await db();
  if (!database) { const v = ls.get("config", key); return v ? v.value : undefined; }
  return new Promise((resolve, reject) => {
    const tx = database.transaction("config", "readonly");
    const req = tx.objectStore("config").get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
    req.onerror = () => reject(req.error);
  });
}

/** Efface toutes les données (réinitialisation). */
export async function wipe() {
  const database = await db();
  if (database) {
    await Promise.all(STORES.map(s => new Promise((res) => {
      const tx = database.transaction(s, "readwrite");
      tx.objectStore(s).clear();
      tx.oncomplete = res;
    })));
  }
  STORES.forEach(s => localStorage.removeItem("naabu:" + s));
}
