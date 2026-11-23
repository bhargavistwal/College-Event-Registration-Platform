// ===================== STUDENT VIEWS =====================
function myData(st) {
  const s = S();
  const regs = s.registrations.filter(r => r.roll === st.roll).map(r => ({ ...r, ev: Core.findEvent(s, r.eventId) })).filter(x => x.ev);
  const waits = Object.entries(s.waiting).map(([id, arr]) => ({ ev: Core.findEvent(s, id), pos: arr.indexOf(st.roll) + 1, total: arr.length })).filter(x => x.ev && x.pos > 0);
  const byDate = (a, b) => (Core.parseDateRange(a.ev.date)?.start || 0) - (Core.parseDateRange(b.ev.date)?.start || 0);
  regs.sort(byDate); waits.sort(byDate);
  const up = regs.filter(x => upcoming(x.ev));
  const feed = s.activity.filter(a => a.roll === st.roll).slice(0, 8);
  return { regs, waits, up, feed };
}
function greeting() { const hr = new Date().getHours(); return hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening"; }
function promotionNotices(st) {
  const seen = LS.get("cerp.seen." + st.roll, 0);
  return S().activity.filter(a => a.roll === st.roll && a.kind === "promoted" && a.t > seen);
}
function viewDashboard() {
  const st = meStudent(), s = S(), d = myData(st), notices = promotionNotices(st);
  const suggestions = s.events.filter(e => !e.openAccess && e.status !== "closed" && upcoming(e) && !Core.isRegistered(s, st.roll, e.id) && !Core.waitingPosition(s, st.roll, e.id) && Core.availableSeats(s, e) > 0 && !(s.waiting[String(e.id)] || []).length)
    .sort((a, b) => (FEATURED_IDS.includes(b.id) - FEATURED_IDS.includes(a.id)) || ((Core.parseDateRange(a.date)?.start || 0) - (Core.parseDateRange(b.date)?.start || 0))).slice(0, 4);
  const next = d.up[0];
  const days = next ? Math.round((Core.parseDateRange(next.ev.date).start - Core.startOfToday()) / 86400000) : null;
  return `<div class="wrap page-head"><h1>${greeting()}, ${h(st.name.split(" ")[0])}</h1><p>${next ? `Your next event is <b style="color:var(--text)">${h(next.ev.name)}</b> ${days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}.` : "You haven’t registered for any upcoming events yet."}</p></div>
  <div class="wrap">
    ${notices.length ? `<div class="notice" role="status">${icon("checkCircle")}<div><b>You got a seat from the waiting list</b><br>${notices.map(n => h(n.text.replace("Promoted from the waiting list and registered for ", ""))).join(", ")}. You’re now registered.</div><button class="btn sm ghost" data-act="seen">Dismiss</button></div>` : ""}
    <div class="tiles">
      <div class="tile"><span>${icon("ticket")}Registered events</span><b>${d.regs.length}</b><small>${d.regs.length - d.up.length ? `${d.regs.length - d.up.length} already past` : "all upcoming"}</small></div>
      <div class="tile"><span>${icon("calendar")}Upcoming</span><b>${d.up.length}</b><small>${next ? "next: " + h(next.ev.date) : "nothing scheduled"}</small></div>
      <div class="tile"><span>${icon("queue")}Waiting lists</span><b>${d.waits.length}</b><small>${d.waits.length ? "best position #" + Math.min(...d.waits.map(w => w.pos)) : "not waiting anywhere"}</small></div>
      <div class="tile"><span>${icon("layers")}Open for you</span><b>${s.events.filter(e => !e.openAccess && e.status !== "closed" && upcoming(e) && !Core.isRegistered(s, st.roll, e.id)).length}</b><small>events you can still join</small></div>
    </div>
    <div class="dash-grid" style="margin-top:24px">
      <div>
        <div class="box"><div class="box-head"><h3>Upcoming registered events</h3><a href="#my-registrations">View all</a></div>
          ${d.up.length ? `<div class="list">${d.up.slice(0, 5).map(x => `<div class="li">${mini(x.ev)}<div class="li-main"><b><a href="#event-${x.ev.id}">${h(x.ev.name)}</a></b><span>${h(x.ev.date)}, ${h(x.ev.venue)}</span></div><div class="li-side"><span class="pill ok">Registered</span></div></div>`).join("")}</div>`
            : `<div class="empty"><b>No upcoming events yet</b>Browse this season’s events and register for the ones you like.<br><a class="btn primary" href="#events">Browse events</a></div>`}
        </div>
        ${d.waits.length ? `<div class="box"><div class="box-head"><h3>Your waiting lists</h3><a href="#my-registrations" data-act="tab-link" data-tab="waiting">Manage</a></div><div class="list">${d.waits.map(w => `<div class="li">${mini(w.ev)}<div class="li-main"><b><a href="#event-${w.ev.id}">${h(w.ev.name)}</a></b><span>Position ${w.pos} of ${w.total}, ${h(w.ev.date)}</span></div><div class="li-side"><span class="pill warn">#${w.pos}</span></div></div>`).join("")}</div></div>` : ""}
        <div class="box"><div class="box-head"><h3>Open for registration</h3><a href="#events">All events</a></div>
          <label class="search" style="display:block;margin-bottom:14px"><span class="sr">Search events</span>${icon("search")}<input type="search" id="dash-q" placeholder="Search all events by name or category"></label>
          ${suggestions.length ? `<div class="list">${suggestions.map(e => `<div class="li">${mini(e)}<div class="li-main"><b><a href="#event-${e.id}">${h(e.name)}</a></b><span>${h(e.date)}, ${plural(Core.availableSeats(s, e), "seat")} left</span></div><div class="li-side">${actionButton(e, st, { small: true })}</div></div>`).join("")}</div>` : `<p class="muted">You’re registered or waiting for everything that’s open. Nice.</p>`}
        </div>
      </div>
      <div>
        <div class="box profile-card"><div class="profile-top"><span class="avatar">${h(initials(st.name))}</span><div><b>${h(st.name)}</b><div class="muted" style="font-size:.86rem">Student</div></div></div>
          <dl class="kv"><dt>Roll number</dt><dd>${h(st.roll)}</dd><dt>Course</dt><dd>${h(st.course)}</dd><dt>Semester</dt><dd>${h(st.semester)}</dd></dl></div>
        <div class="box"><h3 style="margin-bottom:12px">Quick actions</h3><div class="quick"><a class="btn" href="#events">${icon("search")}Browse events</a><a class="btn" href="#my-registrations">${icon("ticket")}My registrations</a><a class="btn" href="#profile">${icon("user")}My profile</a></div></div>
        <div class="box"><h3 style="margin-bottom:12px">Recent activity</h3>${d.feed.length ? `<div class="feed">${d.feed.map(a => `<div><p>${h(a.text)}</p><span>${timeAgo(a.t)}</span></div>`).join("")}</div>` : `<p class="muted" style="font-size:.9rem">Your registrations and changes will show here.</p>`}</div>
      </div>
    </div></div>`;
}
function viewMyRegs() {
  const st = meStudent(), d = myData(st), tab = ui.regTab || "registered";
  const regRow = x => `<div class="li">${mini(x.ev)}<div class="li-main"><b><a href="#event-${x.ev.id}">${h(x.ev.name)}</a></b><span>${h(x.ev.date)}, ${h(x.ev.venue)}${upcoming(x.ev) ? "" : ", already past"}</span></div><div class="li-side"><button class="btn sm danger" data-act="cancel" data-id="${x.ev.id}">Cancel</button></div></div>`;
  const waitRow = w => `<div class="li">${mini(w.ev)}<div class="li-main"><b><a href="#event-${w.ev.id}">${h(w.ev.name)}</a></b><span>Position ${w.pos} of ${w.total}. ${w.pos === 1 ? "You’re next in line." : plural(w.pos - 1, "student") + " ahead of you."}</span></div><div class="li-side"><button class="btn sm" data-act="leave" data-id="${w.ev.id}">Leave list</button></div></div>`;
  return `<div class="wrap page-head"><h1>My registrations</h1><p>Cancel a registration and the first student on that event’s waiting list gets your seat automatically.</p></div>
  <div class="wrap"><div class="tabs" role="tablist"><button role="tab" aria-selected="${tab === "registered"}" data-act="tab" data-tab="registered">Registered (${d.regs.length})</button><button role="tab" aria-selected="${tab === "waiting"}" data-act="tab" data-tab="waiting">Waiting lists (${d.waits.length})</button></div>
  <div class="box">${tab === "registered"
    ? (d.regs.length ? `<div class="list">${d.regs.map(regRow).join("")}</div>` : `<div class="empty"><b>You haven’t registered for anything yet</b>Find an event and register in one tap.<br><a class="btn primary" href="#events">Browse events</a></div>`)
    : (d.waits.length ? `<div class="list">${d.waits.map(waitRow).join("")}</div>` : `<div class="empty"><b>You’re not on any waiting list</b>When an event is full, you can join its waiting list from the event page.</div>`)}</div></div>`;
}
function viewProfile() {
  const st = meStudent(), d = myData(st);
  return `<div class="wrap page-head"><h1>My profile</h1><p>Your academic details are managed by the event office. You can change your password here.</p></div>
  <div class="wrap dash-grid"><div>
    <div class="box"><div class="box-head"><h3>Student details</h3><span class="locked">${icon("lock")}Locked, contact the event office to change</span></div>
      <dl class="facts" style="margin-top:0"><div><dt>Full name</dt><dd>${h(st.name)}</dd></div><div><dt>Roll number</dt><dd>${h(st.roll)}</dd></div><div><dt>Course</dt><dd>${h(st.course)}</dd></div><div><dt>Semester</dt><dd>${h(st.semester)}</dd></div></dl></div>
    <div class="box"><h3>Change password</h3>
      <form class="form" data-form="change-password" novalidate style="max-width:420px">
        <div class="field"><label for="p-cur">Current password</label><input id="p-cur" name="current" type="password" autocomplete="current-password" required></div>
        <div class="field"><label for="p-new">New password</label><input id="p-new" name="password" type="password" autocomplete="new-password" required><span class="hint">At least 8 characters, with a letter and a number.</span></div>
        <div class="field"><label for="p-new2">Confirm new password</label><input id="p-new2" name="password2" type="password" autocomplete="new-password" required></div>
        <div class="form-err" role="alert"></div><button class="btn primary" type="submit" style="justify-self:start">Change password</button></form></div>
  </div><div>
    <div class="box"><h3 style="margin-bottom:12px">Account</h3><dl class="kv"><dt>Account type</dt><dd>Student</dd><dt>Created</dt><dd>${new Date(st.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd><dt>Registrations</dt><dd>${d.regs.length}</dd><dt>Waiting lists</dt><dd>${d.waits.length}</dd><dt>Password</dt><dd>Hashed (PBKDF2)</dd></dl></div>
  </div></div>`;
}
function viewSetup() {
  const st = meStudent(); const needsProfile = !st.name || !st.course || !(st.semester > 0);
  return `<div class="wrap auth"><div class="auth-side"><h1>Finish setting up your account</h1><p>${needsProfile ? "Your record is missing some details. Fill them in once, then choose a new password." : "Your account has a temporary password. Choose a new one to continue."}</p>
    <p class="faint" style="margin-top:14px;font-size:.88rem">Roll number ${h(st.roll)}. After this step your academic details are locked, as in the original program.</p></div>
    <div class="form-card"><h2>Account setup</h2><form class="form" data-form="setup" novalidate>
      ${needsProfile ? `<div class="field"><label for="u-name">Full name</label><input id="u-name" name="name" required maxlength="60" value="${h(st.name)}"></div><div class="two">${courseField(st.course, "u-course")}${semField(st.semester || "", "u-sem")}</div>` : ""}
      <div class="field"><label for="u-pw">New password</label><input id="u-pw" name="password" type="password" required autocomplete="new-password"><span class="hint">At least 8 characters, with a letter and a number.</span></div>
      <div class="field"><label for="u-pw2">Confirm new password</label><input id="u-pw2" name="password2" type="password" required autocomplete="new-password"></div>
      <div class="form-err" role="alert"></div><button class="btn primary" type="submit">Save and continue</button></form>
      <p class="alt"><a href="#home" data-act="logout">Log out</a></p></div></div>`;
}
