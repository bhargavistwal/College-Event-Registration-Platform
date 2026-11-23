// ===================== ROUTER, RENDER, ACTIONS =====================
let pendingRender = false, lastRoute = null;
const route = () => { try { return decodeURIComponent(location.hash.slice(1)) || "home"; } catch { return "home"; } };
const go = r => { if (route() === r) render({ force: true }); else location.hash = r; };
const STUDENT_ROUTES = ["dashboard", "my-registrations", "profile", "setup"];
const isAdminRoute = r => r.startsWith("admin") && r !== "admin-login";
const typing = () => { const a = document.activeElement; return a && $("#app").contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); };

function render({ force = false } = {}) {
  const r = route(), app = $("#app");
  const routeChanged = r !== lastRoute;
  if (!force && !routeChanged && (modalOpen || typing())) { pendingRender = true; return; }
  pendingRender = false;
  if (Store.status === "loading") { app.innerHTML = `<div class="loading-screen"><div class="row">${icon("refresh")}Loading events…</div></div>`; return; }
  if (!Store.state) {
    app.innerHTML = header(r) + `<main id="main" class="wrap page-head"><div class="empty">${Store.status === "empty"
      ? `<b>Platform data isn’t set up yet</b>Load the 59 events and demo accounts to start.<br><button class="btn primary" data-act="setup-data">Load demo data</button>`
      : `<b>Can’t reach the event database</b>Check your connection. This page keeps trying and will update by itself.`}</div></main>`;
    return;
  }
  // session checks
  const sess = Session.get(), m = me();
  if (sess && !m) { Session.clear(); toast("You’ve been logged out because your account is no longer active.", "warn"); }
  const st = meStudent(), ad = meAdmin();
  if (st && st.firstLogin && r !== "setup") { location.replace("#setup"); return; }
  if (STUDENT_ROUTES.includes(r) && !st) { ui.returnTo = r; if (ad) toast("That page is for students. Log out of the admin account first.", "warn"); else toast("Log in to continue.", "info"); location.replace("#login"); return; }
  if (r === "setup" && st && !st.firstLogin) { location.replace("#dashboard"); return; }
  if (isAdminRoute(r) && !ad) { if (st) toast("Admin pages are for the event office only.", "bad"); location.replace(st ? "#dashboard" : "#admin-login"); return; }
  if ((r === "login" || r === "signup" || r === "admin-login") && (st || ad)) { location.replace(st ? "#dashboard" : "#admin"); return; }

  let main, title;
  if (r === "home" || r === "home-how") { main = viewHome(); title = "College Events"; }
  else if (r === "events") { main = viewEvents(); title = "All events"; }
  else if (/^event-\d+$/.test(r)) { const ev = Core.findEvent(S(), r.slice(6)); main = viewEvent(r.slice(6)); title = ev ? ev.name : "Event not found"; }
  else if (r === "login") { main = viewLogin(); title = "Student login"; }
  else if (r === "signup") { main = viewSignup(); title = "Sign up"; }
  else if (r === "admin-login") { main = viewAdminLogin(); title = "Admin login"; }
  else if (r === "dashboard") { main = viewDashboard(); title = "Dashboard"; }
  else if (r === "my-registrations") { main = viewMyRegs(); title = "My registrations"; }
  else if (r === "profile") { main = viewProfile(); title = "My profile"; }
  else if (r === "setup") { main = viewSetup(); title = "Account setup"; }
  else if (r === "admin") { main = viewAdmin(r); title = "Admin overview"; }
  else if (r === "admin-events") { main = viewAdminEvents(r); title = "Manage events"; }
  else if (/^admin-event-\d+$/.test(r)) { main = viewAdminEvent(r, r.slice(12)); title = "Event admin"; }
  else if (r === "admin-students") { main = viewAdminStudents(r); title = "Students"; }
  else if (r === "admin-registrations") { main = viewAdminRegs(r); title = "Registrations"; }
  else if (r === "admin-waiting") { main = viewAdminWaiting(r); title = "Waiting lists"; }
  else if (r === "admin-data") { main = viewAdminData(r); title = "Data and demo"; }
  else if (r === "under-the-hood") { main = ad ? adminShell(r, viewHood()) : viewHood(); title = "Under the hood"; }
  else { main = `<div class="wrap page-head"><div class="empty"><b>Page not found</b>The link may be out of date.<br><a class="btn" href="#home">Go to the homepage</a></div></div>`; title = "Not found"; }

  const y = window.scrollY;
  app.innerHTML = header(r) + `<main id="main" tabindex="-1">${main}</main>` + footer();
  document.title = `${title} | College Event Registration`;
  if (routeChanged) {
    lastRoute = r;
    if (r === "home-how") { const el = document.getElementById("home-how"); if (el) el.scrollIntoView(); }
    else window.scrollTo(0, 0);
    $("#main").focus({ preventScroll: true });
  } else window.scrollTo(0, y);
}
setInterval(() => { if (pendingRender && !modalOpen && !typing()) render(); }, 800);

// ---------- registration flows ----------
async function registerFlow(id, btn) {
  const st = meStudent();
  if (!st) { ui.returnTo = "event-" + id; toast("Log in as a student to register.", "info"); go("login"); return; }
  const s = S(), c = Core.checkRegister(s, st.roll, id);
  if (!c.ok) { toast(c.msg, c.code === "OPEN_ACCESS" ? "info" : "bad"); return; }
  const ev = c.event, conflicts = Core.dateConflicts(s, st.roll, id);
  if (conflicts.length) {
    const okGo = await modal({ title: "You have another event that day", body: `<p>You are already registered for ${conflicts.map(e => `<b style="color:var(--text)">${h(e.name)}</b>`).join(", ")} on ${h(ev.date)}.</p><p style="margin-top:8px">You are now ${c.action === "waitlist" ? "joining the waiting list for" : "registering for"} another event on the same date${conflicts.some(e => e.startTime) && ev.startTime ? " at an overlapping time" : ""}. Do you want to continue?</p>`,
      actions: [{ label: "Cancel", value: false }, { label: c.action === "waitlist" ? "Continue to waiting list" : "Continue registration", value: true, kind: "primary" }] });
    if (!okGo) return;
  }
  let join = false;
  if (c.action === "waitlist") {
    const n = (s.waiting[String(id)] || []).length;
    join = await modal({ title: "No seat is free right now", body: `<p>${Core.availableSeats(s, ev) === 0 ? `All ${ev.totalSeats} seats for <b style="color:var(--text)">${h(ev.name)}</b> are taken.` : `Students are already waiting for <b style="color:var(--text)">${h(ev.name)}</b>, so free seats go to them first.`}</p><p style="margin-top:8px">Join the waiting list? You’d be number ${n + 1}. If a registered student cancels, the first student in line is registered automatically.</p>`,
      actions: [{ label: "Not now", value: false }, { label: "Join waiting list", value: true, kind: "primary" }] });
    if (!join) return;
  }
  await withBusy(btn, async () => {
    let r = await Store.mutate(s2 => Core.register(s2, st.roll, id, { joinWaitlist: join }));
    if (!r.ok && r.code === "NEEDS_WAITLIST") {   // the last seat went while the dialog was open
      const again = await confirmBox("That seat was just taken", `<p>Another student registered first. Join the waiting list instead?</p>`, "Join waiting list");
      if (!again) return;
      r = await Store.mutate(s2 => Core.register(s2, st.roll, id, { joinWaitlist: true }));
    }
    toast(r.ok ? (r.action === "waitlist" ? `Added to the waiting list for ${ev.name}. You’re number ${r.position}.` : `Registration successful! You’re registered for ${ev.name}.`) : r.msg, r.ok ? "ok" : "bad");
  });
}
async function cancelFlow(id, btn) {
  const st = meStudent(); if (!st) return;
  const ev = Core.findEvent(S(), id); if (!ev) return toast("Invalid event ID.", "bad");
  const waiting = (S().waiting[String(id)] || []).length;
  const ok = await confirmBox("Cancel this registration?", `<p>You’ll lose your seat for <b style="color:var(--text)">${h(ev.name)}</b>.${waiting ? ` The first of the ${plural(waiting, "student")} waiting will be registered in your place.` : " The seat will become available to other students."}</p>`, "Cancel registration", "danger");
  if (!ok) return;
  await withBusy(btn, async () => { const r = await Store.mutate(s => Core.cancel(s, st.roll, id)); toast(r.msg, r.ok ? "ok" : "bad"); });
}
async function leaveFlow(id, btn) {
  const st = meStudent(); if (!st) return;
  const ev = Core.findEvent(S(), id); if (!ev) return;
  const ok = await confirmBox("Leave the waiting list?", `<p>You’ll lose your place in line for <b style="color:var(--text)">${h(ev.name)}</b>. If you join again later, you’ll go to the back.</p>`, "Leave waiting list", "danger");
  if (!ok) return;
  await withBusy(btn, async () => { const r = await Store.mutate(s => Core.leaveWaitlist(s, st.roll, id)); toast(r.msg, r.ok ? "ok" : "bad"); });
}
function login(sess, msg) { Session.set(sess); Lockout.ok(); toast(msg, "ok"); const to = ui.returnTo; ui.returnTo = null; lastRoute = null; go(sess.role === "admin" ? "admin" : (to && !to.startsWith("admin") && to !== "login" ? to : "dashboard")); }

// ---------- clicks ----------
document.addEventListener("click", async e => {
  const a = e.target.closest("[data-act]"); if (!a) { const nav = $("#nav"); if (nav && nav.classList.contains("open") && !e.target.closest(".hdr")) nav.classList.remove("open"); return; }
  const act = a.dataset.act, id = a.dataset.id;
  if (a.tagName === "BUTTON") e.preventDefault();
  switch (act) {
    case "register": return registerFlow(+id, a);
    case "cancel": return cancelFlow(+id, a);
    case "leave": return leaveFlow(+id, a);
    case "logout": e.preventDefault(); Session.clear(); ui.returnTo = null; toast("You’ve logged out.", "info"); lastRoute = null; return go("home");
    case "menu": { const n = $("#nav"); const open = n.classList.toggle("open"); a.setAttribute("aria-expanded", open); return; }
    case "theme": { const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); const next = cur === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = next; LS.set("cerp.theme", next); return render({ force: true }); }
    case "festival": ui.filters = { q: "", cat: "", fest: id, track: "", avail: "", sort: "date" }; return go("events");
    case "track": ui.filters = { q: "", cat: "", fest: "", track: a.dataset.track, avail: "", sort: "date" }; return go("events");
    case "clear-filters": ui.filters = { q: "", cat: "", fest: "", track: "", avail: "", sort: "id" }; return render({ force: true });
    case "tab": ui.regTab = a.dataset.tab; return render({ force: true });
    case "tab-link": ui.regTab = a.dataset.tab; return;
    case "return": ui.returnTo = a.dataset.to; return;
    case "seen": { const st = meStudent(); if (st) LS.set("cerp.seen." + st.roll, Date.now()); return render({ force: true }); }
    case "demo": { if (route() !== "login") return; $("#l-roll").value = a.dataset.roll; $("#l-pw").value = "Demo@2026"; return $('[data-form="login"]').requestSubmit(); }
    case "demo-admin": $("#a-user").value = "eventadmin"; $("#a-pw").value = "Admin@Demo26"; return $('[data-form="admin-login"]').requestSubmit();
    case "setup-data": return withBusy(a, async () => { const r = await Store.reset(); toast(r.ok ? "Demo data loaded." : r.msg, r.ok ? "ok" : "bad"); });
  }
  if (!meAdmin()) return;
  switch (act) {
    case "event-add": return eventModal(null);
    case "event-edit": return eventModal(Core.findEvent(S(), id));
    case "event-status": return withBusy(a, async () => { const ev = Core.findEvent(S(), id); const r = await Store.mutate(s => Core.setStatus(s, id, ev.status === "closed" ? "open" : "closed")); toast(r.ok ? `Registration ${ev.status === "closed" ? "opened" : "closed"} for ${ev.name}.` : r.msg, r.ok ? "ok" : "bad"); });
    case "event-delete": { const s = S(), ev = Core.findEvent(s, id); if (!ev) return;
      const kids = Core.childrenOf(s, ev); if (kids.length) return toast(`${ev.name} has ${plural(kids.length, "sub-event")}. Delete or reassign them first.`, "bad");
      const ok = await confirmBox(`Delete ${ev.name}?`, `<p>This removes the event, its ${plural(Core.regCount(s, ev.id), "registration")} and its waiting list of ${plural((s.waiting[String(ev.id)] || []).length, "student")}. This can’t be undone.</p>${ev.original ? `<p style="margin-top:8px">It’s one of the 59 original events. Resetting the demo data brings it back.</p>` : ""}`, "Delete event", "danger");
      if (!ok) return; const r = await Store.mutate(s2 => Core.deleteEvent(s2, id)); toast(r.ok ? `${ev.name} deleted.` : r.msg, r.ok ? "ok" : "bad"); if (r.ok && route().startsWith("admin-event-")) go("admin-events"); return; }
    case "admin-cancel": { const ev = Core.findEvent(S(), id), roll = a.dataset.roll;
      const ok = await confirmBox("Cancel this registration?", `<p>Remove <b style="color:var(--text)">${h(roll)}</b> from <b style="color:var(--text)">${h(ev.name)}</b>. If students are waiting, the first one gets the seat.</p>`, "Cancel registration", "danger");
      if (!ok) return; return withBusy(a, async () => { const r = await Store.mutate(s => Core.cancel(s, roll, id, "admin")); toast(r.ok ? (r.promoted ? `Cancelled. ${r.promoted} was promoted from the waiting list.` : "Cancelled. One seat is now available.") : r.msg, r.ok ? "ok" : "bad"); }); }
    case "student-add": return studentModal();
    case "student-disable": case "student-enable": { const roll = a.dataset.roll, dis = act === "student-disable";
      if (dis && !(await confirmBox(`Disable ${roll}?`, `<p>They won’t be able to log in and will be removed from every waiting list. Their registrations stay.</p>`, "Disable account", "danger"))) return;
      return withBusy(a, async () => { const r = await Store.mutate(s => Core.setDisabled(s, roll, dis)); toast(r.ok ? `${roll} ${dis ? "disabled" : "enabled"}.` : r.msg, r.ok ? "ok" : "bad"); }); }
    case "student-reset": return resetModal(a.dataset.roll);
    case "student-delete": { const roll = a.dataset.roll, s = S(), n = s.registrations.filter(r => r.roll === roll).length;
      const ok = await confirmBox(`Delete ${roll}?`, `<p>This deletes the account and cancels its ${plural(n, "registration")}, promoting waiting students where possible. This can’t be undone.</p>`, "Delete account", "danger");
      if (!ok) return; const r = await Store.mutate(s2 => Core.deleteStudent(s2, roll)); return toast(r.ok ? `${roll} deleted.` : r.msg, r.ok ? "ok" : "bad"); }
    case "reset-data": { const ok = await confirmBox("Reset all demo data?", `<p>All events, students, registrations and waiting lists go back to the starting demo state. Sign-ups and changes made since are lost.</p>`, "Reset demo data", "danger");
      if (!ok) return; return withBusy(a, async () => { const r = await Store.reset(); toast(r.ok ? "Demo data reset." : r.msg, r.ok ? "ok" : "bad"); }); }
  }
});

// ---------- live filters ----------
let fTimer;
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "f-q") { ui.filters.q = t.value; clearTimeout(fTimer); fTimer = setTimeout(() => { $("#results").innerHTML = eventResults(); }, 120); }
  if (t.id === "ae-q") { ui.adm.q = t.value; $("#ae-table").innerHTML = adminEventsTable(Core.sortEvents(S(), Core.search(S().events, ui.adm.q), ui.adm.sort)); }
  if (t.id === "as-q") { ui.adm.stuQ = t.value; const q = t.value.trim().toLowerCase(); $("#as-table").innerHTML = studentsTable(S().students.filter(x => !q || x.roll.toLowerCase().includes(q) || (x.name || "").toLowerCase().includes(q) || (x.course || "").toLowerCase().includes(q))); }
  if (t.id === "ar-q") { ui.adm.regQ = t.value; $("#ar-table").innerHTML = regsTable(); }
});
document.addEventListener("change", e => {
  const t = e.target, map = { "f-cat": "cat", "f-fest": "fest", "f-avail": "avail", "f-sort": "sort" };
  if (map[t.id]) { ui.filters[map[t.id]] = t.value; if (t.id === "f-cat") ui.filters.track = ""; $("#results").innerHTML = eventResults(); }
  if (t.id === "ae-sort") { ui.adm.sort = t.value; $("#ae-table").innerHTML = adminEventsTable(Core.sortEvents(S(), Core.search(S().events, ui.adm.q), ui.adm.sort)); }
  if (t.id === "ar-ev") { ui.adm.regEvent = t.value; $("#ar-table").innerHTML = regsTable(); }
  if (t.id === "ef-open") { const seats = $("#ef-seats"); seats.disabled = t.checked; if (t.checked) seats.value = 0; else if (+seats.value === 0) seats.value = 50; }
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.id === "dash-q") { ui.filters = { q: e.target.value, cat: "", fest: "", track: "", avail: "", sort: "id" }; go("events"); }
});

// ---------- forms ----------
const formData = f => Object.fromEntries(new FormData(f).entries());
const setErr = (f, msg) => { const el = $(".form-err", f); if (el) el.textContent = msg || ""; if (msg) toast(msg, "bad", 3500); };
document.addEventListener("submit", async e => {
  const f = e.target.closest("form[data-form]"); if (!f) return; e.preventDefault();
  const btn = $('button[type="submit"]', f) || $(`button[form="${f.id}"]`);
  if (btn && btn.classList.contains("loading")) return;
  setErr(f, ""); const d = formData(f); const kind = f.dataset.form;
  await withBusy(btn, async () => {
    if (kind === "login") {
      const wait = Lockout.check(); if (wait) return setErr(f, `Too many failed attempts. Try again in ${wait} seconds.`);
      const roll = Core.normRoll(d.roll);
      if (!roll || !d.password) return setErr(f, "Enter your roll number and password.");
      const st = Core.findStudent(S(), roll);
      if (!st) { Lockout.fail(); $(".form-err", f).innerHTML = `No account found for roll number ${h(roll)}. <a href="#signup" data-act="prefill" style="color:inherit;font-weight:700">Sign up with this roll number</a>`; ui.signupRoll = roll; return; }
      if (st.disabled) return setErr(f, "This account is disabled. Contact the event office.");
      if (!(await Crypto.verify(d.password, st))) { Lockout.fail(); return setErr(f, "Invalid roll number or password."); }
      return login({ role: "student", roll }, st.firstLogin ? "Login successful! Finish setting up your account." : "Login successful!");
    }
    if (kind === "admin-login") {
      const wait = Lockout.check(); if (wait) return setErr(f, `Too many failed attempts. Try again in ${wait} seconds.`);
      const ad = S().admins.find(a => a.username === String(d.username || "").trim());
      if (!ad || !(await Crypto.verify(d.password || "", ad))) { Lockout.fail(); return setErr(f, "Invalid admin username or password."); }
      return login({ role: "admin", username: ad.username }, "Admin login successful!");
    }
    if (kind === "signup") {
      const roll = Core.normRoll(d.roll);
      if (!Core.ROLL_RE.test(roll)) return setErr(f, "Roll number must be 4–20 letters or digits.");
      const pErr = Core.validateProfile(d); if (pErr) return setErr(f, pErr);
      const pwErr = Core.validatePassword(d.password); if (pwErr) return setErr(f, pwErr);
      if (d.password !== d.password2) return setErr(f, "Passwords do not match.");
      if (Core.findStudent(S(), roll)) return setErr(f, "An account with this roll number already exists. Log in instead.");
      const cred = await Crypto.make(d.password);
      const r = await Store.mutate(s => Core.addStudent(s, { ...d, roll }, cred, "signup"));
      if (!r.ok) return setErr(f, r.msg);
      ui.signupRoll = ""; return login({ role: "student", roll }, "Account created. Welcome!");
    }
    if (kind === "setup") {
      const st = meStudent(); if (!st) return;
      const needs = !st.name || !st.course || !(st.semester > 0);
      if (needs) { const pErr = Core.validateProfile(d); if (pErr) return setErr(f, pErr); }
      const pwErr = Core.validatePassword(d.password); if (pwErr) return setErr(f, pwErr);
      if (d.password !== d.password2) return setErr(f, "Passwords do not match.");
      if (await Crypto.verify(d.password, st)) return setErr(f, "Choose a password that’s different from your temporary one.");
      const cred = await Crypto.make(d.password);
      const r = await Store.mutate(s => Core.completeSetup(s, st.roll, d, cred));
      if (!r.ok) return setErr(f, r.msg);
      toast("Profile completed successfully!", "ok"); lastRoute = null; return go("dashboard");
    }
    if (kind === "change-password") {
      const st = meStudent(); if (!st) return;
      if (!(await Crypto.verify(d.current || "", st))) return setErr(f, "Incorrect current password.");
      const pwErr = Core.validatePassword(d.password); if (pwErr) return setErr(f, pwErr);
      if (d.password !== d.password2) return setErr(f, "Passwords do not match.");
      if (d.password === d.current) return setErr(f, "Your new password must be different from the current one.");
      const cred = await Crypto.make(d.password);
      const r = await Store.mutate(s => Core.setPassword(s, st.roll, cred, st.hash));
      if (!r.ok) return setErr(f, r.msg);
      f.reset(); return toast("Password changed successfully.", "ok");
    }
    if (!meAdmin()) return;
    if (kind === "event") {
      const date = Core.formatDate(d.d1, d.d2);
      if (!date) return setErr(f, d.d1 ? "End date must be later in the same month as the start date." : "Choose a date.");
      const open = !!$("#ef-open", f).checked;
      const data = { name: d.name, category: d.category, type: d.type, date, venue: d.venue, fee: d.fee === "" ? NaN : Number(d.fee), totalSeats: open ? 0 : (d.totalSeats === "" ? NaN : Number(d.totalSeats)),
        openAccess: open, parent: d.parent, status: d.status, startTime: d.startTime, endTime: d.endTime, description: d.description };
      const err = Core.validateEventInput(data); if (err) return setErr(f, err);
      const id = f.dataset.id;
      const r = await Store.mutate(s => id ? Core.updateEvent(s, id, data) : Core.addEvent(s, data));
      if (!r.ok) return setErr(f, r.msg);
      ui.modalApi && ui.modalApi.close(true);
      return toast(id ? `Event updated.${r.promoted && r.promoted.length ? ` ${plural(r.promoted.length, "student")} promoted from the waiting list.` : ""}` : `Event added with ID ${r.id}.`, "ok");
    }
    if (kind === "student") {
      const roll = Core.normRoll(d.roll);
      if (!Core.ROLL_RE.test(roll)) return setErr(f, "Roll number must be 4–20 letters or digits.");
      const pErr = Core.validateProfile(d); if (pErr) return setErr(f, pErr);
      const pwErr = Core.validatePassword(d.password); if (pwErr) return setErr(f, "Temporary password: " + pwErr.toLowerCase());
      if (Core.findStudent(S(), roll)) return setErr(f, "An account with this roll number already exists.");
      const cred = await Crypto.make(d.password);
      const r = await Store.mutate(s => Core.addStudent(s, { ...d, roll }, cred, "admin"));
      if (!r.ok) return setErr(f, r.msg);
      ui.modalApi && ui.modalApi.close(true); return toast(`Account created for ${roll}. They must set a new password at first login.`, "ok");
    }
    if (kind === "reset") {
      const pwErr = Core.validatePassword(d.password); if (pwErr) return setErr(f, pwErr);
      const cred = await Crypto.make(d.password);
      const r = await Store.mutate(s => Core.adminResetPassword(s, f.dataset.roll, cred));
      if (!r.ok) return setErr(f, r.msg);
      ui.modalApi && ui.modalApi.close(true); return toast(`Temporary password set for ${f.dataset.roll}.`, "ok");
    }
  });
});

function eventModal(ev) {
  return modal({ title: ev ? `Edit ${ev.name}` : "Add event", body: eventFormHtml(ev), wide: true,
    actions: [{ label: "Cancel", value: null }, { label: ev ? "Save changes" : "Add event", kind: "primary", submit: "event-form" }], onMount: api => { ui.modalApi = api; } });
}
function studentModal() {
  return modal({ title: "Add student", body: `<form class="form" id="student-form" data-form="student" novalidate>
    <div class="field"><label for="sf-roll">Roll number</label><input id="sf-roll" name="roll" required maxlength="20" autocapitalize="characters"></div>
    <div class="field"><label for="sf-name">Full name</label><input id="sf-name" name="name" required maxlength="60"></div>
    <div class="two">${courseField("", "sf-course")}${semField("", "sf-sem")}</div>
    <div class="field"><label for="sf-pw">Temporary password</label><input id="sf-pw" name="password" required autocomplete="off"><span class="hint">The student must change it at first login.</span></div>
    <div class="form-err" role="alert"></div></form>`,
    actions: [{ label: "Cancel", value: null }, { label: "Add student", kind: "primary", submit: "student-form" }], onMount: api => { ui.modalApi = api; } });
}
function resetModal(roll) {
  return modal({ title: `Reset password for ${roll}`, body: `<p>Set a temporary password and share it with the student in person. They’ll have to choose a new one when they log in.</p>
    <form class="form" id="reset-form" data-form="reset" data-roll="${h(roll)}" novalidate><div class="field"><label for="rp-pw">Temporary password</label><input id="rp-pw" name="password" required autocomplete="off"></div><div class="form-err" role="alert"></div></form>`,
    actions: [{ label: "Cancel", value: null }, { label: "Set temporary password", kind: "primary", submit: "reset-form" }], onMount: api => { ui.modalApi = api; } });
}

// ---------- boot ----------
(function boot() {
  const t = LS.get("cerp.theme"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  Store.on(() => render());
  window.addEventListener("hashchange", () => { const n = $("#nav"); if (n) n.classList.remove("open"); render({ force: true }); });
  render();
  Store.init();
})();
