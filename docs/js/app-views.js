// ===================== APP: SHARED PIECES =====================
const S = () => Store.state;
const posterOf = (ev, featured = false) => { const p = Core.parentOf(S(), ev); return Posters.svg(ev, { parentName: p ? p.name : "", featured }); };
const upcoming = ev => { const r = Core.parseDateRange(ev.date); return r ? r.end >= Core.startOfToday() : true; };

// Student's relationship to an event
function relation(ev, st) {
  if (!st) return null;
  if (Core.isRegistered(S(), st.roll, ev.id)) return { kind: "registered" };
  const pos = Core.waitingPosition(S(), st.roll, ev.id);
  if (pos) return { kind: "waiting", pos };
  return null;
}
function statusPill(ev) {
  const s = S();
  if (ev.openAccess) return `<span class="pill vio"><span class="dot"></span>Open entry</span>`;
  if (ev.status === "closed") return `<span class="pill"><span class="dot"></span>Registration closed</span>`;
  const left = Core.availableSeats(s, ev), waiting = (s.waiting[String(ev.id)] || []).length;
  if (left === 0 || waiting) return `<span class="pill bad"><span class="dot"></span>Full, waiting list open</span>`;
  if (left <= Math.max(5, Math.ceil(ev.totalSeats * 0.1))) return `<span class="pill warn"><span class="dot"></span>${plural(left, "seat")} left</span>`;
  return `<span class="pill ok"><span class="dot"></span>Open for registration</span>`;
}
function seatBlock(ev) {
  if (ev.openAccess) return `<div class="seatline"><span>No seat limit</span><span>No registration needed</span></div>`;
  const s = S(), left = Core.availableSeats(s, ev), used = ev.totalSeats - left, waiting = (s.waiting[String(ev.id)] || []).length;
  return `<div class="seatbar" role="img" aria-label="${used} of ${ev.totalSeats} seats taken"><i style="width:${ev.totalSeats ? Math.round(used / ev.totalSeats * 100) : 0}%"></i></div>
    <div class="seatline"><span><b>${left}</b> of ${ev.totalSeats} seats available</span>${waiting ? `<span>${waiting} waiting</span>` : ""}</div>`;
}
function actionButton(ev, st, { small = false, full = false } = {}) {
  const sm = small ? "sm" : "";
  if (ev.openAccess) return `<a class="btn ${sm}" href="#event-${ev.id}">Open entry details</a>`;
  const rel = relation(ev, st);
  if (rel && rel.kind === "registered") return `<button class="btn ${sm}" data-act="cancel" data-id="${ev.id}">${icon("check")}Registered</button>`;
  if (rel && rel.kind === "waiting") return `<button class="btn ${sm}" data-act="leave" data-id="${ev.id}">Waiting, #${rel.pos}</button>`;
  if (ev.status === "closed") return `<button class="btn ${sm}" disabled>Registration closed</button>`;
  const s = S(), fullNow = Core.availableSeats(s, ev) === 0 || (s.waiting[String(ev.id)] || []).length > 0;
  return `<button class="btn primary ${sm}" data-act="register" data-id="${ev.id}">${fullNow ? "Join waiting list" : "Register now"}</button>`;
}
function eventCard(ev, { featured = false } = {}) {
  const st = meStudent(), p = Core.parentOf(S(), ev);
  return `<article class="card">
    <a class="poster" href="#event-${ev.id}" aria-label="${h(ev.name)} details">${posterOf(ev, featured)}</a>
    <div class="card-body">
      ${p ? `<a class="parent-tag" href="#event-${p.id}">${h(p.name)}</a>` : `<span class="parent-tag">${ev.openAccess ? "Festival" : h(ev.category)}</span>`}
      <h3><a href="#event-${ev.id}">${h(ev.name)}</a></h3>
      <div class="meta"><div>${icon("calendar")}<span>${h(ev.date)}${ev.startTime ? `, ${h(ev.startTime)}–${h(ev.endTime)}` : ""}</span></div><div>${icon("pin")}<span>${h(ev.venue)}</span></div>
      <div>${icon("ticket")}<span>${h(ev.category)}, ${ev.fee ? "₹" + ev.fee : "Free"}</span></div></div>
      <div>${statusPill(ev)}</div>
      ${seatBlock(ev)}
      <div class="card-foot"><a class="btn sm" href="#event-${ev.id}">View details</a>${actionButton(ev, st, { small: true })}</div>
    </div></article>`;
}
const mini = ev => `<div class="mini">${posterOf(ev)}</div>`;

// ---------- header / footer ----------
const BRAND = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2.2a1.8 1.8 0 0 0 0 3.6V16a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2.2a1.8 1.8 0 0 0 0-3.6z"/><path d="m9.5 12 1.8 1.8L15 10"/></svg>`;
function header(route) {
  const m = me();
  const cur = r => route === r || (r === "events" && route.startsWith("event-")) || (r === "admin-events" && route.startsWith("admin-event-")) ? 'aria-current="page"' : "";
  let links, right;
  if (m && m.role === "student") {
    links = `<a href="#dashboard" ${cur("dashboard")}>Dashboard</a><a href="#events" ${cur("events")}>Events</a><a href="#my-registrations" ${cur("my-registrations")}>My registrations</a><a href="#profile" ${cur("profile")}>My profile</a>`;
    right = `<span class="who"><span class="avatar">${h(initials(m.name))}</span><span class="who-name">${h(m.name ? m.name.split(" ")[0] : m.roll)}</span></span><button class="btn sm" data-act="logout">${icon("logout")}<span class="sr">Log out</span></button>`;
  } else if (m && m.role === "admin") {
    links = `<a href="#admin" ${cur("admin")}>Overview</a><a href="#admin-events" ${cur("admin-events")}>Manage events</a><a href="#events" ${cur("events")}>Public view</a>`;
    right = `<span class="who"><span class="avatar">${icon("shield")}</span><span class="who-name">Admin</span></span><button class="btn sm" data-act="logout">${icon("logout")}<span class="sr">Log out</span></button>`;
  } else {
    links = `<a href="#home" ${cur("home")}>Home</a><a href="#events" ${cur("events")}>Events</a><a href="#home-how">How it works</a><a href="#under-the-hood" ${cur("under-the-hood")}>Under the hood</a>`;
    right = `<a class="btn sm ghost" href="#login">Log in</a><a class="btn sm primary" href="#signup">Sign up</a>`;
  }
  return `<header class="hdr"><div class="wrap">
    <a class="brand" href="${m ? (m.role === "admin" ? "#admin" : "#dashboard") : "#home"}"><span class="brand-mark">${BRAND}</span><span class="brand-txt"><b>College Events</b><span>Graphic Era registration desk</span></span></a>
    <nav class="nav" id="nav" aria-label="Main">${links}</nav>
    <div class="hdr-actions">${right}<button class="btn sm icon menu-btn" data-act="menu" aria-expanded="false" aria-controls="nav">${icon("menu")}<span class="sr">Menu</span></button></div>
  </div></header>${Store.readOnly ? `<div class="banner"><div class="wrap">${icon("info")}You have view-only access, so registrations and changes can’t be saved from this account.</div></div>` : ""}`;
}
function footer() {
  const theme = document.documentElement.dataset.theme;
  return `<footer class="foot"><div class="wrap">
    <div><b style="color:var(--text)">College Event Registration Platform</b><br>Web version of a B.Tech CSE PBL project (Phase 3), originally written in C++.<br>Not an official Graphic Era website.</div>
    <div class="row" style="align-items:flex-start">
      <a href="#events">Events</a><a href="#under-the-hood">Under the hood</a>${me() ? "" : `<a href="#admin-login">Admin login</a>`}
      <span class="pill" title="Where data is saved">${icon("db")}${Store.mode === "db" ? "Shared database" : "Saved in this browser"}</span>
      <button class="btn sm ghost" data-act="theme" aria-label="Switch colour theme">${icon(theme === "light" ? "moon" : "sun")}</button>
    </div></div></footer>`;
}

// ===================== PUBLIC VIEWS =====================
function viewHome() {
  const s = S(), ev = s.events, st = Core.stats(s);
  const festivals = ev.filter(e => e.openAccess && (!e.parent || e.parent === "None")).map(f => ({ f, r: Core.parseDateRange(f.date), kids: Core.childrenOf(s, f).length })).filter(x => x.r).sort((a, b) => a.r.start - b.r.start);
  // timeline spans from the first festival month to the last
  const t0 = festivals.length ? new Date(festivals[0].r.start.getFullYear(), festivals[0].r.start.getMonth(), 1) : new Date();
  const lastEnd = festivals.length ? festivals[festivals.length - 1].r.end : new Date();
  const t1 = new Date(lastEnd.getFullYear(), lastEnd.getMonth() + 1, 1);
  const span = t1 - t0, X = d => ((d - t0) / span * 100);
  const months = []; for (let d = new Date(t0); d < t1; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(new Date(d));
  const lanes = []; // simple lane packing so blocks never overlap
  const placed = festivals.map(x => { const left = X(x.r.start), width = Math.max(X(new Date(x.r.end.getFullYear(), x.r.end.getMonth(), x.r.end.getDate() + 1)) - left, 11.5);
    let lane = 0; while ((lanes[lane] ?? -1) > left - 0.4) lane++; lanes[lane] = left + width; return { ...x, left, width, lane }; });
  const today = new Date(), todayX = X(today);
  const featured = FEATURED_IDS.map(id => Core.findEvent(s, id)).filter(Boolean);
  const trackCount = t => ev.filter(e => !e.openAccess && t.cats.includes(e.category)).length;
  const trackSample = { tech: 35, science: 28, sports: 15, culture: 51, business: 41, food: 48 };
  return `<section class="hero"><div class="wrap">
    <div class="hero-top"><div>
      <h1>Every campus event, one registration desk.</h1>
      <p class="lede">Browse all ${st.events} events in Graphic Era’s 2026–27 season, register in a couple of taps, and get a fair place in line when an event fills up.</p>
      <div class="row"><a class="btn primary" href="#events">Explore events</a><a class="btn" href="${meStudent() ? "#dashboard" : "#login"}">${meStudent() ? "Go to my dashboard" : "Student login"}</a></div>
    </div>
    <p class="hero-note"><b>Full event? You still get a place.</b> Join the waiting list and the first student in line takes the next seat that opens, automatically.</p></div>
    <div class="season"><div class="season-head"><h2>The 2026–27 season</h2><span>${festivals.length} festivals, ${st.registrable} events to register for</span></div>
      <div class="tl" style="height:${Math.max(2, lanes.length) * 62 + 56}px">
        ${months.map(m => `<div class="tl-month" style="left:${X(m)}%">${Core.MONTH_NAMES[m.getMonth()].slice(0, 3)} ${String(m.getFullYear()).slice(2)}</div>`).join("")}
        ${todayX >= 0 && todayX <= 100 ? `<div class="tl-today" style="left:${todayX}%"><span>Today</span></div>` : ""}
        ${placed.map(p => `<button class="tl-fest ${p.f.name.startsWith("GRAFEST") ? "big" : ""}" style="left:${p.left}%;width:${p.width}%;top:${34 + p.lane * 62}px" data-act="festival" data-id="${p.f.id}" title="${h(p.f.name)}, ${h(p.f.date)}"><b>${h(p.f.name)}</b><span>${p.kids ? plural(p.kids, "event") : h(p.f.date)}</span></button>`).join("")}
      </div>
      <div class="tl-list">${placed.map(p => `<button data-act="festival" data-id="${p.f.id}"><b>${h(p.f.name)}</b><span>${h(p.f.date)}</span></button>`).join("")}</div>
    </div></div></section>

  <section class="section"><div class="wrap">
    <div class="sec-head"><div><h2>Featured events</h2><p>Five picks from this season, across cybersecurity, robotics, research, athletics and dance.</p></div><a class="btn" href="#events">See all ${st.events} events</a></div>
    <div class="rail">${featured.map(e => eventCard(e, { featured: true })).join("")}</div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="sec-head"><div><h2>Browse by interest</h2><p>Each event keeps its original category. These groups just make it quicker to find your kind of event.</p></div></div>
    <div class="tracks">${TRACKS.map(t => { const sample = Core.findEvent(s, trackSample[t.key]);
      return `<button class="track" data-act="track" data-track="${t.key}"><span class="track-thumb">${sample ? posterOf(sample) : ""}</span><span><b>${h(t.name)}</b><span>${plural(trackCount(t), "event")} to register for</span></span></button>`; }).join("")}</div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="figures">
      <div><b>${st.events}</b><span>events this season</span></div>
      <div><b>${st.seatsTotal.toLocaleString("en-IN")}</b><span>seats across ${st.registrable} events</span></div>
      <div><b>${st.students}</b><span>students signed up</span></div>
      <div><b>${st.registrations}</b><span>registrations so far</span></div>
    </div></div></section>

  <section class="section" id="home-how"><div class="wrap">
    <div class="sec-head"><div><h2>How registration works</h2><p>The same rules as the original C++ program, now in your browser.</p></div></div>
    <div class="steps">
      <div class="step"><b>Log in with your roll number</b><p>New here? Sign up with your roll number, course and semester. It takes under a minute.</p></div>
      <div class="step"><b>Pick an event</b><p>Search by name or category, filter by festival, or sort by the seats that are still free.</p></div>
      <div class="step"><b>Register or join the line</b><p>If a seat is free you’re in. If not, you join a first-come, first-served waiting list.</p></div>
      <div class="step"><b>Get promoted automatically</b><p>When someone cancels, the first student waiting takes the seat and sees it on their dashboard.</p></div>
    </div></div></section>

  <section class="section"><div class="wrap"><div class="cta">
    <div><h2>Ready for this season?</h2><p>Opening events start with EMERGE on 24 November.</p></div>
    <div class="row">${meStudent() ? `<a class="btn primary" href="#dashboard">Open my dashboard</a>` : `<a class="btn primary" href="#signup">Create your account</a><a class="btn" style="background:transparent;color:inherit;border-color:var(--hero-line)" href="#login">Log in</a>`}</div>
  </div></div></section>`;
}

// ---------- events page ----------
const ui = { filters: { q: "", cat: "", fest: "", track: "", avail: "", sort: "id" } };
function viewEvents() {
  const s = S(), f = ui.filters;
  const cats = [...new Set(s.events.map(e => e.category))].sort();
  const fests = s.events.filter(e => e.openAccess && (!e.parent || e.parent === "None"));
  return `<div class="page-head wrap"><h1>All events</h1><p>Search by event name or category, then narrow by festival or availability. Open-entry events need no registration.</p></div>
  <div class="filters"><div class="wrap">
    <label class="search"><span class="sr">Search events</span>${icon("search")}<input id="f-q" type="search" placeholder="Search by name or category" value="${h(f.q)}" autocomplete="off"></label>
    <label><span class="sr">Category</span><select class="select" id="f-cat"><option value="">All categories</option>${cats.map(c => `<option ${f.cat === c ? "selected" : ""}>${h(c)}</option>`).join("")}</select></label>
    <label><span class="sr">Festival</span><select class="select" id="f-fest"><option value="">All festivals</option>${fests.map(x => `<option value="${x.id}" ${String(f.fest) === String(x.id) ? "selected" : ""}>${h(x.name)}</option>`).join("")}</select></label>
    <label><span class="sr">Availability</span><select class="select" id="f-avail"><option value="">Any availability</option><option value="seats" ${f.avail === "seats" ? "selected" : ""}>Seats available</option><option value="full" ${f.avail === "full" ? "selected" : ""}>Full, waiting list</option><option value="open" ${f.avail === "open" ? "selected" : ""}>Open entry</option></select></label>
    <label><span class="sr">Sort</span><select class="select" id="f-sort"><option value="id" ${f.sort === "id" ? "selected" : ""}>Sort: Event ID</option><option value="name" ${f.sort === "name" ? "selected" : ""}>Sort: Name A–Z</option><option value="seats" ${f.sort === "seats" ? "selected" : ""}>Sort: Most seats available</option><option value="date" ${f.sort === "date" ? "selected" : ""}>Sort: Date</option></select></label>
  </div></div>
  <div class="wrap"><div id="results">${eventResults()}</div></div>`;
}
function filteredEvents() {
  const s = S(), f = ui.filters;
  let list = Core.search(s.events, f.q);
  if (f.cat) list = list.filter(e => e.category === f.cat);
  if (f.track) { const t = TRACKS.find(t => t.key === f.track); if (t) list = list.filter(e => t.cats.includes(e.category)); }
  if (f.fest) { const fe = Core.findEvent(s, f.fest); list = list.filter(e => e.id === Number(f.fest) || (fe && (Core.parentOf(s, e) || {}).id === fe.id)); }
  if (f.avail === "seats") list = list.filter(e => !e.openAccess && e.status !== "closed" && Core.availableSeats(s, e) > 0 && !(s.waiting[String(e.id)] || []).length);
  if (f.avail === "full") list = list.filter(e => !e.openAccess && (Core.availableSeats(s, e) === 0 || (s.waiting[String(e.id)] || []).length));
  if (f.avail === "open") list = list.filter(e => e.openAccess);
  list = Core.sortEvents(s, list, f.sort);
  if (f.sort === "seats") list = [...list.filter(e => !e.openAccess), ...list.filter(e => e.openAccess)];
  return list;
}
function eventResults() {
  const f = ui.filters, list = filteredEvents(), any = f.q || f.cat || f.fest || f.avail || f.track;
  const track = f.track ? TRACKS.find(t => t.key === f.track) : null;
  return `<div class="results-bar"><span aria-live="polite">${list.length === S().events.length ? `Showing all ${list.length} events` : `${plural(list.length, "event")} found`}${track ? ` in ${h(track.name.toLowerCase())}` : ""}</span>
    ${any ? `<button class="btn sm ghost" data-act="clear-filters">${icon("x")}Clear filters</button>` : ""}</div>
    ${list.length ? `<div class="grid">${list.map(e => eventCard(e, { featured: FEATURED_IDS.includes(e.id) })).join("")}</div>`
      : `<div class="empty"><b>No events match these filters</b>Try a shorter search word, or clear the filters to see all events.<br><button class="btn" data-act="clear-filters">Clear filters</button></div>`}`;
}

// ---------- event details ----------
function viewEvent(id) {
  const s = S(), ev = Core.findEvent(s, id);
  if (!ev) return `<div class="wrap page-head"><div class="empty"><b>Event not found</b>There’s no event with ID ${h(id)}. It may have been removed by an admin.<br><a class="btn" href="#events">Back to all events</a></div></div>`;
  const st = meStudent(), p = Core.parentOf(s, ev), kids = Core.childrenOf(s, ev), rel = relation(ev, st);
  const left = Core.availableSeats(s, ev), waiting = (s.waiting[String(ev.id)] || []).length;
  let panel;
  if (ev.openAccess) panel = `<div class="panel vio"><h3>Open entry, no registration needed</h3><p>This event is open access, as in the original program. Just turn up${kids.length ? ", or register for the individual events below" : ""}.</p></div>`;
  else if (rel && rel.kind === "registered") panel = `<div class="panel vio"><h3>${icon("checkCircle")} You’re registered</h3><p>Your seat is confirmed. If you can’t make it, cancel so the next student waiting gets your seat.</p><div class="row"><button class="btn danger" data-act="cancel" data-id="${ev.id}">Cancel registration</button><a class="btn" href="#my-registrations">My registrations</a></div></div>`;
  else if (rel && rel.kind === "waiting") panel = `<div class="panel vio"><h3>You’re number ${rel.pos} on the waiting list</h3><p>${rel.pos === 1 ? "You’re next in line." : `${plural(rel.pos - 1, "student")} ahead of you.`} When a registered student cancels, the first student in line is registered automatically.</p><div class="row"><button class="btn" data-act="leave" data-id="${ev.id}">Leave waiting list</button></div></div>`;
  else if (ev.status === "closed") panel = `<div class="panel"><h3>Registration closed</h3><p>The event office has closed registration for this event.</p></div>`;
  else {
    const fullNow = left === 0 || waiting > 0;
    panel = `<div class="panel ${fullNow ? "" : "vio"}"><h3>${fullNow ? "This event is full" : `${plural(left, "seat")} available`}</h3><p>${fullNow ? `${waiting ? plural(waiting, "student") + " already waiting. " : ""}You can join the waiting list and you’ll be registered automatically if a seat opens.` : "Registration is free and takes one tap."}</p>
      <div class="row">${st ? actionButton(ev, st) : `<a class="btn primary" href="#login" data-act="return" data-to="event-${ev.id}">Log in to register</a><a class="btn" href="#signup">Create an account</a>`}</div></div>`;
  }
  return `<div class="wrap" style="padding-top:28px">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#events">Events</a>${p ? `<span>/</span><a href="#event-${p.id}">${h(p.name)}</a>` : ""}<span>/</span><span>${h(ev.name)}</span></nav>
    <div class="detail">
      <div class="poster">${posterOf(ev, FEATURED_IDS.includes(ev.id))}</div>
      <div>
        <div class="row" style="margin-bottom:12px">${statusPill(ev)}<span class="pill">${h(ev.type)}</span></div>
        <h1>${h(ev.name)}</h1>
        <p class="desc">${h(ev.description || "No description yet.")}</p>
        <dl class="facts">
          <div><dt>Date</dt><dd>${h(ev.date)}</dd></div>
          <div><dt>Time</dt><dd>${ev.startTime ? `${h(ev.startTime)}–${h(ev.endTime)}` : "To be announced"}</dd></div>
          <div><dt>Venue</dt><dd>${h(ev.venue)}</dd></div>
          <div><dt>Category</dt><dd>${h(ev.category)}</dd></div>
          <div><dt>Registration fee</dt><dd>${ev.fee ? "₹" + ev.fee : "Free"}</dd></div>
          <div><dt>Part of</dt><dd>${p ? `<a href="#event-${p.id}">${h(p.name)}</a>` : "Standalone festival"}</dd></div>
          <div><dt>Total seats</dt><dd>${ev.openAccess ? "No limit" : ev.totalSeats}</dd></div>
          <div><dt>Available seats</dt><dd>${ev.openAccess ? "Open entry" : left}</dd></div>
          <div><dt>Waiting list</dt><dd>${ev.openAccess ? "Not needed" : plural(waiting, "student")}</dd></div>
          <div><dt>Event ID</dt><dd>${ev.id}</dd></div>
        </dl>
        ${panel}
        ${kids.length ? `<div class="panel"><h3>Events in ${h(ev.name)}</h3><p>${plural(kids.length, "event")}. Register for each one separately.</p><div class="subevents">${kids.map(k => `<a class="subevent" href="#event-${k.id}">${mini(k)}<div><b>${h(k.name)}</b><span>${h(k.date)}, ${k.openAccess ? "open entry" : plural(Core.availableSeats(s, k), "seat") + " left"}</span></div>${icon("arrowLeft", "flip")}</a>`).join("")}</div></div>` : ""}
        <p class="origin">${ev.original ? "Event record from the original C++ program (loadEvents in main.cpp). Description and poster were added for the website." : "Event added through the website’s admin panel."}</p>
      </div></div></div>`;
}

// ---------- auth ----------
function viewLogin() {
  return `<div class="wrap auth"><div class="auth-side"><h1>Student login</h1><p>Log in with your college roll number to register for events, manage waiting lists and see your schedule.</p>
    <div class="demo"><b>Demo accounts for the presentation</b><p>Every demo student uses the password <code>Demo@2026</code>. Try <code>DEMO001</code> (registered in several events), <code>DEMO002</code> (first on a waiting list) or <code>DEMO008</code> (first login, must set up a profile).</p>
      <div class="row"><button class="btn sm" data-act="demo" data-roll="DEMO001">Log in as DEMO001</button><button class="btn sm" data-act="demo" data-roll="DEMO002">DEMO002</button><button class="btn sm" data-act="demo" data-roll="DEMO008">DEMO008</button></div></div></div>
    <div class="form-card"><h2>Log in</h2><p class="muted">Use your roll number and password.</p>
      <form class="form" data-form="login" novalidate>
        <div class="field"><label for="l-roll">Roll number</label><input id="l-roll" name="roll" autocomplete="username" required autocapitalize="characters" spellcheck="false"></div>
        <div class="field"><label for="l-pw">Password</label><input id="l-pw" name="password" type="password" autocomplete="current-password" required></div>
        <div class="form-err" role="alert"></div>
        <button class="btn primary" type="submit">Log in</button>
      </form>
      <p class="alt">New student? <a href="#signup">Create an account</a></p>
      <p class="alt" style="margin-top:6px"><a href="#admin-login">Admin login</a></p></div></div>`;
}
const COURSES = ["B.Tech CSE","B.Tech CSE (AI & ML)","B.Tech ECE","B.Tech ME","B.Tech CE","B.Tech Biotechnology","BCA","MCA","B.Sc Biotechnology","BBA","MBA","Other"];
function courseField(val = "", id = "s-course") {
  return `<div class="field"><label for="${id}">Course</label><select id="${id}" name="course" required><option value="">Choose your course</option>${COURSES.map(c => `<option ${c === val ? "selected" : ""}>${c}</option>`).join("")}</select></div>`;
}
function semField(val = "", id = "s-sem") {
  return `<div class="field"><label for="${id}">Semester</label><select id="${id}" name="semester" required><option value="">Semester</option>${[1,2,3,4,5,6,7,8].map(n => `<option ${String(n) === String(val) ? "selected" : ""}>${n}</option>`).join("")}</select></div>`;
}
function viewSignup() {
  const pre = ui.signupRoll || "";
  return `<div class="wrap auth"><div class="auth-side"><h1>Create your student account</h1><p>One account per roll number. Your course and semester are locked after sign-up and can only be changed by the event office.</p>
    <p class="faint" style="margin-top:18px;font-size:.88rem">The site can’t check a roll number against Graphic Era’s records, so please only sign up with your own.</p></div>
    <div class="form-card"><h2>Sign up</h2>
      <form class="form" data-form="signup" novalidate>
        <div class="field"><label for="s-roll">Roll number</label><input id="s-roll" name="roll" value="${h(pre)}" required autocapitalize="characters" spellcheck="false" maxlength="20"><span class="hint">4–20 letters or digits, as printed on your ID card.</span></div>
        <div class="field"><label for="s-name">Full name</label><input id="s-name" name="name" required maxlength="60" autocomplete="name"></div>
        <div class="two">${courseField()}${semField()}</div>
        <div class="field"><label for="s-pw">Password</label><input id="s-pw" name="password" type="password" required autocomplete="new-password"><span class="hint">At least 8 characters, with a letter and a number.</span></div>
        <div class="field"><label for="s-pw2">Confirm password</label><input id="s-pw2" name="password2" type="password" required autocomplete="new-password"></div>
        <div class="form-err" role="alert"></div>
        <button class="btn primary" type="submit">Create account</button>
      </form><p class="alt">Already have an account? <a href="#login">Log in</a></p></div></div>`;
}
function viewAdminLogin() {
  return `<div class="wrap auth"><div class="auth-side"><h1>Admin login</h1><p>For the event office. Admins can manage events, students, registrations and waiting lists.</p>
    <div class="demo"><b>Demo admin</b><p>Username <code>eventadmin</code>, password <code>Admin@Demo26</code>. These are separate from the credentials in the C++ source.</p><button class="btn sm" data-act="demo-admin">Log in as demo admin</button></div></div>
    <div class="form-card"><h2>Admin log in</h2>
      <form class="form" data-form="admin-login" novalidate>
        <div class="field"><label for="a-user">Username</label><input id="a-user" name="username" autocomplete="username" required spellcheck="false"></div>
        <div class="field"><label for="a-pw">Password</label><input id="a-pw" name="password" type="password" autocomplete="current-password" required></div>
        <div class="form-err" role="alert"></div>
        <button class="btn primary" type="submit">Log in as admin</button>
      </form><p class="alt"><a href="#login">Student login</a></p></div></div>`;
}

// ---------- under the hood ----------
function viewHood() {
  const rows = [
    ["Student login with roll number and password", "login(), Student::login", "Same, with hashed passwords and a 5-attempt lockout", "C++"],
    ["First-login profile completion", "completeStudentProfile()", "Same fields and 1–8 semester check, plus a required new password", "C++"],
    ["View all events and available events", "displayAllEvents(), displayAvailableEvents()", "Events page with posters, seat bars and status", "C++"],
    ["Search by name or category", "searchEvent()", "Same case-insensitive match on name or category", "C++"],
    ["Sort by name or available seats", "sortEvents() (admin menu)", "Available to students and admins", "C++ (admin only)"],
    ["Register, prevent duplicates, open-access check", "registerEvent()", "Same checks in the same order", "C++"],
    ["Waiting list when full (FIFO queue)", "EventQueue, registerEvent()", "Same linked-list queue; a seat is given only if one is free and nobody is waiting", "C++"],
    ["Cancel and promote first waiting student", "cancelRegistration()", "Same; ineligible (disabled) entries are skipped", "C++"],
    ["Change password", "changeStudentPassword()", "Same current/new/confirm flow", "C++"],
    ["Admin: students, registrations, waiting lists, save", "adminMenu()", "Admin pages; every change saves automatically", "C++"],
    ["Self sign-up", "Not in C++ (students loaded from file)", "Roll number must be unique", "Web"],
    ["Add, edit, delete events; open or close registration", "Not in C++", "Admin event manager", "Web"],
    ["Leave a waiting list", "Not in C++", "Removes you without changing anyone else’s order", "Web"],
    ["Same-date warning", "Not in C++", "Warns, never blocks; checks real overlap once times are set", "Web"],
    ["Dashboard, profile, charts, activity feed", "Not in C++", "Activity feed is newest-first, the idea from eventStack.h", "Web"],
  ];
  return `<div class="wrap page-head prose"><h1>Under the hood</h1><p>How this website maps to the original C++ console program, what was added, and what was fixed. Useful for the project viva.</p>
    <h2>Feature map</h2></div>
    <div class="wrap"><div class="tbl-wrap"><table><thead><tr><th>Feature</th><th>Where it is in C++</th><th>On the website</th><th>Origin</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${h(r[0])}</td><td><code style="font-size:.82rem">${h(r[1])}</code></td><td>${h(r[2])}</td><td><span class="pill ${r[3].startsWith("C++") ? "vio" : ""}">${h(r[3])}</span></td></tr>`).join("")}</tbody></table></div></div>
    <div class="wrap prose">
    <h2>Data structures</h2>
    <ul><li><b>Queue (eventQueue.h):</b> the waiting lists. The website uses a JavaScript port with the same front/rear linked nodes, duplicate check and O(1) enqueue and dequeue.</li>
    <li><b>Sorting:</b> the C++ program uses <code>std::sort</code> with lambdas. The hand-written bubble sort in <code>eventSort.cpp</code> is a standalone exercise.</li>
    <li><b>Linked list (eventList.h):</b> a standalone practice module, not used by <code>main.cpp</code>.</li>
    <li><b>Stack (eventStack.h):</b> a standalone module. Its newest-first idea is reused for the activity feed.</li></ul>
    <h2>Fixes compared with the C++ version</h2>
    <ul><li>Events 5 and 6 list their parent as “Graphathon”, but event 4 is named “Graphathon / Graph-E-Thon”. The original strings are kept and matched correctly.</li>
    <li>Passwords are stored as salted PBKDF2 hashes instead of plain text.</li>
    <li>Students can see only their own waiting-list position. Full lists are admin-only.</li>
    <li>Demo admin credentials differ from the ones hardcoded in the public repository.</li></ul>
    <h2>Limitations</h2>
    <ul><li>Login is checked in the browser. Anyone with access to the shared data could read the password hashes, so this is a working prototype, not a production-secure system. A production version would check passwords on a server.</li>
    <li>The site can’t verify that a roll number belongs to the person signing up.</li>
    <li>Event times don’t exist in the original data, so the clash check compares dates until an admin adds times.</li>
    <li>All data lives in one database document, which comfortably fits several hundred students. A full deployment would move to a real database such as PostgreSQL.</li>
    <li>Data is currently ${Store.mode === "db" ? "saved in the artifact’s shared database" : "saved only in this browser"}.</li></ul></div>`;
}
