// ---- Tune vs. real AdMob revenue ----
const COINS_PER_AD = 2, DAILY_AD_LIMIT = 30;
const PRICES = { "60 UC": 1000, "325 UC": 5400, "660 UC": 11000 };

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const today = () => new Date().toISOString().slice(0, 10);

let ready = false;
async function init(db) {
  if (ready) return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS users(uid TEXT PRIMARY KEY, coins INTEGER NOT NULL DEFAULT 0, ads_today INTEGER NOT NULL DEFAULT 0, day TEXT NOT NULL DEFAULT '')"),
    db.prepare("CREATE TABLE IF NOT EXISTS adtx(tx TEXT PRIMARY KEY, uid TEXT, at TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, email TEXT, reward TEXT, pubg_id TEXT, cost INTEGER, status TEXT DEFAULT 'pending', created_at TEXT)"),
  ]);
  ready = true;
}

// ---- Firebase ID token verification ----
let jwks = null;
async function verifyUser(req, env) {
  const tok = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const [h, p, s] = tok.split(".");
  if (!s) return null;
  const head = JSON.parse(atob(h.replace(/-/g, "+").replace(/_/g, "/")));
  if (!jwks) jwks = (await (await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")).json()).keys;
  const jwk = jwks.find((k) => k.kid === head.kid);
  if (!jwk) { jwks = null; return null; }
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(s), new TextEncoder().encode(h + "." + p));
  if (!ok) return null;
  const c = JSON.parse(new TextDecoder().decode(b64u(p)));
  if (c.aud !== env.FIREBASE_PROJECT || c.iss !== "https://securetoken.google.com/" + env.FIREBASE_PROJECT || c.exp < Date.now() / 1000 || !c.sub) return null;
  return { uid: c.sub, email: (c.email || "").toLowerCase(), verified: c.email_verified === true };
}

// ---- AdMob SSV verification (ECDSA P-256, DER -> raw) ----
let admobKeys = null;
function derToRaw(der) {
  let o = 2; if (der[1] & 0x80) o += der[1] & 0x7f;
  const rd = (off) => { const l = der[off + 1]; let v = der.slice(off + 2, off + 2 + l); while (v.length > 32) v = v.slice(1); const out = new Uint8Array(32); out.set(v, 32 - v.length); return [out, off + 2 + l]; };
  const [r, n] = rd(o); const [s] = rd(n);
  const raw = new Uint8Array(64); raw.set(r, 0); raw.set(s, 32); return raw;
}
async function ssv(url, env) {
  const qs = url.search.slice(1), i = qs.indexOf("&signature=");
  if (i < 0) return null;
  const signed = qs.slice(0, i), rest = new URLSearchParams(qs.slice(i + 1));
  if (!admobKeys) admobKeys = (await (await fetch("https://www.gstatic.com/admob/reward/verifier-keys.json")).json()).keys;
  const k = admobKeys.find((x) => String(x.keyId) === rest.get("key_id"));
  if (!k) return null;
  const spki = Uint8Array.from(atob(k.pem.replace(/-----[A-Z ]+-----|\s/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("spki", spki, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, derToRaw(b64u(rest.get("signature"))), new TextEncoder().encode(signed));
  if (!ok) return null;
  const p = new URLSearchParams(signed);
  return { uid: p.get("user_id"), tx: p.get("transaction_id") };
}

export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(req.url), db = env.DB, path = url.pathname;
    try {
      await init(db);

      if (path === "/ssv") {
        const r = await ssv(url, env);
        if (!r || !r.uid || !r.tx) return new Response("bad", { status: 403 });
        const d = today();
        await db.batch([
          db.prepare("INSERT OR IGNORE INTO users(uid) VALUES(?)").bind(r.uid),
          db.prepare("INSERT OR IGNORE INTO adtx(tx,uid,at) VALUES(?,?,?)").bind(r.tx, r.uid, new Date().toISOString()),
          db.prepare("UPDATE users SET coins=coins+?, ads_today=CASE WHEN day=? THEN ads_today+1 ELSE 1 END, day=? WHERE uid=? AND changes()>0 AND (day<>? OR ads_today<?)").bind(COINS_PER_AD, d, d, r.uid, d, DAILY_AD_LIMIT),
        ]);
        return new Response("ok");
      }

      const u = await verifyUser(req, env);
      if (!u) return json({ error: "unauthorized" }, 401);
      const isAdmin = u.verified && u.email === env.ADMIN_EMAIL.toLowerCase();

      if (path === "/api/me") {
        await db.prepare("INSERT OR IGNORE INTO users(uid) VALUES(?)").bind(u.uid).run();
        const me = await db.prepare("SELECT coins, CASE WHEN day=? THEN ads_today ELSE 0 END AS ads FROM users WHERE uid=?").bind(today(), u.uid).first();
        const { results } = await db.prepare("SELECT reward, pubg_id, status FROM orders WHERE uid=? ORDER BY id DESC LIMIT 20").bind(u.uid).all();
        return json({ coins: me.coins, ads: me.ads, isAdmin, orders: results });
      }

      if (path === "/api/redeem" && req.method === "POST") {
        const { reward, pubgId } = await req.json();
        const cost = PRICES[reward], id = String(pubgId || "").trim();
        if (!u.verified) return json({ error: "أكد بريدك الأول" }, 400);
        if (!cost || !/^[0-9]{5,20}$/.test(id)) return json({ error: "بيانات غلط" }, 400);
        await db.prepare("INSERT OR IGNORE INTO users(uid) VALUES(?)").bind(u.uid).run();
        const r = await db.batch([
          db.prepare("UPDATE users SET coins=coins-? WHERE uid=? AND coins>=?").bind(cost, u.uid, cost),
          db.prepare("INSERT INTO orders(uid,email,reward,pubg_id,cost,created_at) SELECT ?,?,?,?,?,? WHERE changes()>0").bind(u.uid, u.email, reward, id, cost, new Date().toISOString()),
        ]);
        if (!r[0].meta.changes) return json({ error: "الكوينات مش كفاية" }, 400);
        if (env.TG_TOKEN && env.TG_CHAT) ctx.waitUntil(fetch("https://api.telegram.org/bot" + env.TG_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: env.TG_CHAT, text: "🎮 طلب شحن جديد\n" + reward + "\nPUBG ID: " + id + "\n" + u.email }) }));
        return json({ ok: true });
      }

      if (path === "/api/admin/orders") {
        if (!isAdmin) return json({ error: "forbidden" }, 403);
        const { results } = await db.prepare("SELECT id, reward, pubg_id, email FROM orders WHERE status='pending' ORDER BY id").all();
        return json({ orders: results });
      }

      if (path === "/api/admin/review" && req.method === "POST") {
        if (!isAdmin) return json({ error: "forbidden" }, 403);
        const { id, action } = await req.json();
        if (!["done", "rejected"].includes(action)) return json({ error: "bad" }, 400);
        await db.batch([
          db.prepare("UPDATE orders SET status=? WHERE id=? AND status='pending'").bind(action, id),
          db.prepare("UPDATE users SET coins=coins+(SELECT cost FROM orders WHERE id=?) WHERE uid=(SELECT uid FROM orders WHERE id=?) AND changes()>0 AND ?='rejected'").bind(id, id, action),
        ]);
        return json({ ok: true });
      }
      return json({ error: "not found" }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: "server error" }, 500);
    }
  },
};
