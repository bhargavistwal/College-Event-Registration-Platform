// ===================== APP: BASE =====================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TAB_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);

const ICONS = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  ticket:'<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  logout:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  chart:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
  home:'<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  queue:'<path d="M3 6h12M3 12h12M3 18h8"/><path d="m17 15 3 3-3 3"/>',
  shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  arrowLeft:'<path d="M19 12H5M11 18l-6-6 6-6"/>',
  rupee:'<path d="M7 4h10M7 9h10M9 4c4 0 6 2 6 5s-3 5-7 5l8 6"/>',
  door:'<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"/><path d="M14 12h.01"/>',
  db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  code:'<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'
};
const icon = (n, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;

// ---------- password hashing (PBKDF2-SHA256, 100,000 iterations, per-user salt) ----------
const Crypto = {
  hex: buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join(""),
  unhex: s => new Uint8Array(s.match(/.{2}/g).map(b => parseInt(b, 16))),
  async derive(pw, saltHex) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: Crypto.unhex(saltHex), iterations: 100000 }, key, 256);
    return Crypto.hex(bits);
  },
  async make(pw) { const salt = Crypto.hex(crypto.getRandomValues(new Uint8Array(16))); return { salt, hash: await Crypto.derive(pw, salt) }; },
  async verify(pw, rec) { if (!rec || !rec.salt || !rec.hash) return false; const h2 = await Crypto.derive(pw, rec.salt);
    let diff = h2.length ^ rec.hash.length; for (let i = 0; i < h2.length; i++) diff |= h2.charCodeAt(i) ^ rec.hash.charCodeAt(i); return diff === 0; }
};

// ---------- storage: shared database when available, else this browser ----------
const LS = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const clone = o => JSON.parse(JSON.stringify(o));
const MAX_DOC = 250000;

const Store = {
  mode: "loading",   // "db" | "local" | "loading"
  status: "loading", // "ready" | "empty" | "loading" | "offline" | "error"
  state: null, readOnly: false, listeners: new Set(), _db: null,
  on(fn) { this.listeners.add(fn); },
  emit() { for (const fn of this.listeners) fn(); },
  async init() {
    let db = null;
    try {
      if (window.claude && typeof window.claude.use === "function")
        db = await Promise.race([window.claude.use("db"), sleep(12000).then(() => null)]);
    } catch { db = null; }
    if (db) return this.initDb(db);
    return this.initLocal();
  },
  initLocal() {
    this.mode = "local";
    let s = LS.get("cerp.state.v1");
    if (!s || !Array.isArray(s.events)) { s = clone(SEED); LS.set("cerp.state.v1", s); }
    this.state = s; this.status = "ready";
    window.addEventListener("storage", e => { if (e.key === "cerp.state.v1") { this.state = LS.get("cerp.state.v1") || this.state; this.emit(); } });
    this.emit();
  },
  initDb(db) {
    this.mode = "db"; this._db = db;
    this._ref = db.doc("app/state"); this._lock = db.doc("app/lock");
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { this.status = "offline"; this.emit(); } }, 10000);
    this._ref.onSnapshot(snap => {
      if (!snap.metadata.fromCache) { settled = true; clearTimeout(timer); }
      if (!snap.exists) { if (!snap.metadata.fromCache) { this.state = null; this.status = "empty"; } }
      else { this.state = snap.data(); this.status = "ready"; }
      this.emit();
    }, err => { settled = true; clearTimeout(timer); this.status = this.state ? "ready" : "error"; this.error = err; this.emit(); });
    (async () => { try { const u = await window.claude.use("user"); if (u && typeof u.can === "function") { const c = await u.can("data.write"); if (c === false) { this.readOnly = true; this.emit(); } } } catch {} })();
  },
  // Apply fn to a fresh copy of the state. fn must return {ok:true,...} to save.
  // Writes from this tab run one at a time; the db lease below orders writes across tabs and devices.
  _chain: Promise.resolve(),
  mutate(fn) {
    const run = this._chain.then(() => this._mutate(fn));
    this._chain = run.catch(() => {});
    return run;
  },
  async _mutate(fn) {
    if (this.readOnly) return { ok: false, msg: "You have view-only access to this platform’s data, so changes can’t be saved." };
    if (this.mode === "local") {
      const draft = clone(LS.get("cerp.state.v1") || this.state);
      const r = fn(draft);
      if (r && r.ok) {
        if (JSON.stringify(draft).length > MAX_DOC) return { ok: false, msg: "Storage is full. Delete some records before adding more." };
        if (!LS.set("cerp.state.v1", draft)) return { ok: false, msg: "This browser blocked saving. Check that site storage is allowed." };
        this.state = draft; this.emit();
      }
      return r;
    }
    // db mode: a short lease on app/lock serialises writers so seat counts and queues stay consistent
    let got = false;
    for (let i = 0; i < 30 && !got; i++) {
      try { const a = await this._lock.acquire({ holder: TAB_ID, ttlMs: 1500 }); got = a.acquired; } catch (e) { return this.dbErr(e); }
      if (!got) await sleep(180 + Math.random() * 220);
    }
    if (!got) return { ok: false, msg: "The system is busy with other registrations. Try again in a moment." };
    try {
      const snap = await this._ref.get();
      if (!snap.exists) return { ok: false, msg: "Platform data isn’t set up yet." };
      const draft = clone(snap.data());
      const r = fn(draft);
      if (r && r.ok) {
        if (JSON.stringify(draft).length > MAX_DOC) return { ok: false, msg: "Storage is full. Delete some records before adding more." };
        await this._ref.set(draft);
        this.state = draft; this.emit();
      }
      return r;
    } catch (e) { return this.dbErr(e); }
  },
  dbErr(e) {
    if (e && e.code === "invalid_argument") { this.readOnly = true; this.emit(); return { ok: false, msg: "You have view-only access to this platform’s data, so changes can’t be saved." }; }
    if (e && e.code === "quota_exceeded") return { ok: false, msg: "Storage is full. Delete some records before adding more." };
    return { ok: false, msg: "Couldn’t reach the database. Check your connection and try again." };
  },
  async reset() {
    const fresh = clone(SEED); fresh.activity = [{ t: Date.now(), kind: "admin", text: "Demo data reset" }];
    if (this.mode === "local") { LS.set("cerp.state.v1", fresh); this.state = fresh; this.emit(); return { ok: true }; }
    try { await this._ref.set(fresh); this.state = fresh; this.status = "ready"; this.emit(); return { ok: true }; } catch (e) { return this.dbErr(e); }
  }
};

// ---------- session ----------
const Session = {
  get() { return LS.get("cerp.session"); },
  set(v) { LS.set("cerp.session", v); },
  clear() { LS.del("cerp.session"); }
};
function me() {
  const s = Session.get(), st = Store.state; if (!s || !st) return null;
  if (s.role === "student") { const x = Core.findStudent(st, s.roll); return x && !x.disabled ? { role: "student", ...x } : null; }
  if (s.role === "admin") { const a = st.admins.find(a => a.username === s.username); return a ? { role: "admin", ...a } : null; }
  return null;
}
const meStudent = () => { const m = me(); return m && m.role === "student" ? m : null; };
const meAdmin = () => { const m = me(); return m && m.role === "admin" ? m : null; };
const Lockout = {
  check() { const l = LS.get("cerp.lockout", { n: 0, until: 0 }); return l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0; },
  fail() { const l = LS.get("cerp.lockout", { n: 0, until: 0 }); l.n = (l.until && l.until < Date.now() ? 0 : l.n) + 1; if (l.n >= 5) { l.until = Date.now() + 60000; l.n = 0; } LS.set("cerp.lockout", l); },
  ok() { LS.del("cerp.lockout"); }
};

// ---------- UI primitives ----------
function toast(msg, kind = "info", ms = 5200) {
  const box = $("#toasts"); const el = document.createElement("div");
  el.className = "toast " + kind; el.setAttribute("role", kind === "bad" ? "alert" : "status");
  el.innerHTML = icon(kind === "ok" ? "checkCircle" : kind === "bad" ? "alert" : kind === "warn" ? "alert" : "info") + `<div>${h(msg)}</div><button aria-label="Dismiss">${icon("x")}</button>`;
  el.querySelector("button").onclick = () => el.remove();
  box.appendChild(el); setTimeout(() => el.remove(), ms);
}
let modalOpen = false;
function modal({ title, body, actions = [{ label: "Close", value: null }], wide = false, onMount }) {
  return new Promise(resolve => {
    modalOpen = true;
    const prev = document.activeElement;
    const bg = document.createElement("div"); bg.className = "modal-bg";
    bg.innerHTML = `<div class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="modal-head"><h2 id="mt">${h(title)}</h2><button class="btn ghost icon sm" data-close aria-label="Close">${icon("x")}</button></div>
      <div class="modal-body">${body}</div><div class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.kind || ""}" data-i="${i}" ${a.submit ? 'type="submit" form="' + a.submit + '"' : 'type="button"'}>${h(a.label)}</button>`).join("")}</div></div>`;
    const close = v => { bg.remove(); modalOpen = false; document.removeEventListener("keydown", onKey); if (prev && prev.focus) prev.focus(); resolve(v); if (pendingRender) render(); };
    const onKey = e => { if (e.key === "Escape") close(null);
      if (e.key === "Tab") { const f = $$("button,input,select,textarea,a[href]", bg).filter(x => !x.disabled); if (!f.length) return; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } };
    bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-close]")) close(null); });
    $$(".modal-foot button", bg).forEach(b => { const a = actions[+b.dataset.i]; if (!a.submit) b.onclick = () => close(a.value); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(bg);
    const api = { close, el: bg };
    if (onMount) onMount(api);
    const f = $("input,select,textarea", bg) || $(".modal-foot .btn.primary,.modal-foot .btn.danger", bg) || $(".modal-foot .btn", bg); if (f) f.focus();
  });
}
const confirmBox = (title, body, label = "Confirm", kind = "primary") => modal({ title, body, actions: [{ label: "Go back", value: false }, { label, value: true, kind }] });
async function withBusy(btn, fn) {
  if (btn && btn.classList.contains("loading")) return;
  if (btn) { btn.classList.add("loading"); btn.setAttribute("aria-busy", "true"); }
  try { return await fn(); } finally { if (btn && btn.isConnected) { btn.classList.remove("loading"); btn.removeAttribute("aria-busy"); } }
}
const timeAgo = t => { const s = Math.round((Date.now() - t) / 1000); if (s < 60) return "just now"; const m = Math.round(s / 60); if (m < 60) return `${m} min ago`; const hr = Math.round(m / 60); if (hr < 24) return `${hr} h ago`; const d = Math.round(hr / 24); return d < 30 ? `${d} d ago` : new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); };
const initials = n => (n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join("") || "?";
const plural = (n, w, p) => `${n} ${n === 1 ? w : (p || w + "s")}`;
