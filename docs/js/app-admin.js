// ===================== ADMIN VIEWS =====================
function adminShell(route, inner) {
  const s = S(), st = Core.stats(s);
  const L = (r, ic, label, badge) => `<a href="#${r}" ${route === r || (r === "admin-events" && route.startsWith("admin-event-")) ? 'aria-current="page"' : ""}>${icon(ic)}${label}${badge != null ? `<span class="badge">${badge}</span>` : ""}</a>`;
  return `<div class="wrap admin-shell"><nav class="side" aria-label="Admin">
    <div class="side-label">Event office</div>
    ${L("admin", "chart", "Overview")}${L("admin-events", "calendar", "Events", st.events)}${L("admin-students", "users", "Students", st.students)}
    ${L("admin-registrations", "ticket", "Registrations", st.registrations)}${L("admin-waiting", "queue", "Waiting lists", st.waiting)}
    <div class="side-label">System</div>${L("admin-data", "db", "Data and demo")}${L("under-the-hood", "code", "Under the hood")}
  </nav><div style="min-width:0">${inner}</div></div>`;
}
const hbars = rows => `<div class="hbar">${rows.map(r => `<div class="hbar-row"><span title="${h(r.label)}">${h(r.label)}</span><div class="hbar-track"><i class="${r.warn ? "warn" : ""}" style="width:${Math.max(r.pct, r.value ? 2 : 0)}%"></i></div><b>${h(r.text ?? r.value)}</b></div>`).join("")}</div>`;
function viewAdmin(route) {
  const s = S(), st = Core.stats(s);
  const reg = s.events.filter(e => !e.openAccess);
  const byTrack = TRACKS.map(t => ({ label: t.name, value: s.registrations.filter(r => { const e = Core.findEvent(s, r.eventId); return e && t.cats.includes(e.category); }).length }));
  const maxT = Math.max(1, ...byTrack.map(x => x.value));
  const fill = reg.map(e => ({ e, used: e.totalSeats - Core.availableSeats(s, e), w: (s.waiting[String(e.id)] || []).length })).map(x => ({ ...x, pct: Math.round(x.used / x.e.totalSeats * 100) }))
    .sort((a, b) => b.pct - a.pct || b.w - a.w).slice(0, 8);
  const fests = s.events.filter(e => e.openAccess && (!e.parent || e.parent === "None")).map(f => { const kids = Core.childrenOf(s, f); return { label: f.name, value: s.registrations.filter(r => kids.some(k => k.id === r.eventId)).length }; });
  const maxF = Math.max(1, ...fests.map(x => x.value));
  const pctSeats = st.seatsTotal ? Math.round((st.seatsTotal - st.seatsLeft) / st.seatsTotal * 100) : 0;
  return adminShell(route, `<div class="page-head" style="padding-top:0"><h1>Overview</h1><p>Live numbers from the registration database.</p></div>
    <div class="tiles">
      <div class="tile"><span>${icon("calendar")}Total events</span><b>${st.events}</b><small>${st.registrable} with seats, ${st.openAccess} open entry</small></div>
      <div class="tile"><span>${icon("users")}Registered students</span><b>${st.students}</b><small>${s.students.filter(x => x.disabled).length} disabled</small></div>
      <div class="tile"><span>${icon("ticket")}Registrations</span><b>${st.registrations}</b><small>${pctSeats}% of ${st.seatsTotal.toLocaleString("en-IN")} seats filled</small></div>
      <div class="tile"><span>${icon("queue")}Waiting-list entries</span><b>${st.waiting}</b><small>across ${Object.keys(s.waiting).length} events</small></div>
    </div>
    <div class="charts">
      <div class="box"><div class="box-head"><h3>Most-filled events</h3><a href="#admin-events">All events</a></div>${hbars(fill.map(x => ({ label: x.e.name, value: x.used, pct: x.pct, warn: x.pct >= 100, text: `${x.pct}%${x.w ? " +" + x.w : ""}` })))}<p class="faint" style="font-size:.8rem;margin-top:12px">Percent of seats taken. “+N” means students waiting.</p></div>
      <div class="box"><div class="box-head"><h3>Registrations by interest</h3></div>${hbars(byTrack.map(x => ({ ...x, pct: x.value / maxT * 100 })))}</div>
      <div class="box"><div class="box-head"><h3>Registrations by festival</h3></div>${hbars(fests.map(x => ({ ...x, pct: x.value / maxF * 100 })))}</div>
      <div class="box"><div class="box-head"><h3>Recent activity</h3></div>${s.activity.length ? `<div class="feed">${s.activity.slice(0, 9).map(a => `<div><p>${a.roll ? `<b>${h(a.roll)}</b>: ` : ""}${h(a.text)}</p><span>${timeAgo(a.t)}</span></div>`).join("")}</div>` : `<p class="muted">No activity yet.</p>`}</div>
    </div>`);
}
ui.adm = { q: "", sort: "id", stuQ: "", regQ: "", regEvent: "" };
function viewAdminEvents(route) {
  const s = S(), f = ui.adm;
  let list = Core.sortEvents(s, Core.search(s.events, f.q), f.sort);
  return adminShell(route, `<div class="page-head" style="padding-top:0"><div class="sec-head" style="margin:0"><div><h1>Events</h1><p>Edit details, open or close registration, and see who’s registered or waiting.</p></div><button class="btn primary" data-act="event-add">${icon("plus")}Add event</button></div></div>
    <div class="toolbar"><label class="search"><span class="sr">Search</span>${icon("search")}<input type="search" id="ae-q" placeholder="Search by name or category" value="${h(f.q)}"></label>
      <select class="select" id="ae-sort" aria-label="Sort"><option value="id" ${f.sort === "id" ? "selected" : ""}>Sort: Event ID</option><option value="name" ${f.sort === "name" ? "selected" : ""}>Sort: Name A–Z</option><option value="seats" ${f.sort === "seats" ? "selected" : ""}>Sort: Available seats</option><option value="date" ${f.sort === "date" ? "selected" : ""}>Sort: Date</option></select></div>
    <div id="ae-table">${adminEventsTable(list)}</div>`);
}
function adminEventsTable(list) {
  const s = S();
  if (!list.length) return `<div class="empty"><b>No events match</b>Try a different search.</div>`;
  return `<div class="tbl-wrap"><table><thead><tr><th class="num">ID</th><th>Event</th><th>Date</th><th class="num">Registered</th><th class="num">Available</th><th class="num">Waiting</th><th>Status</th><th class="num">Actions</th></tr></thead><tbody>
  ${list.map(e => { const left = Core.availableSeats(s, e), w = (s.waiting[String(e.id)] || []).length;
    return `<tr><td class="num">${e.id}</td><td><a href="#admin-event-${e.id}" style="font-weight:600;text-decoration:none">${h(e.name)}</a><div class="faint" style="font-size:.8rem">${h(e.category)}${e.original ? "" : ", added on web"}</div></td><td style="white-space:nowrap">${h(e.date)}</td>
      <td class="num">${e.openAccess ? "–" : `${Core.regCount(s, e.id)}/${e.totalSeats}`}</td><td class="num">${e.openAccess ? "–" : left}</td><td class="num">${e.openAccess ? "–" : w}</td>
      <td>${e.openAccess ? `<span class="pill vio">Open entry</span>` : `<button class="btn sm ${e.status === "closed" ? "" : ""}" data-act="event-status" data-id="${e.id}" title="Click to ${e.status === "closed" ? "open" : "close"} registration">${e.status === "closed" ? "Closed" : "Open"}</button>`}</td>
      <td class="num"><div class="row"><a class="btn sm" href="#admin-event-${e.id}">View</a><button class="btn sm icon" data-act="event-edit" data-id="${e.id}" aria-label="Edit ${h(e.name)}">${icon("edit")}</button><button class="btn sm icon danger" data-act="event-delete" data-id="${e.id}" aria-label="Delete ${h(e.name)}">${icon("trash")}</button></div></td></tr>`; }).join("")}
  </tbody></table></div>`;
}
function viewAdminEvent(route, id) {
  const s = S(), e = Core.findEvent(s, id);
  if (!e) return adminShell(route, `<div class="empty"><b>Event not found</b><a class="btn" href="#admin-events">Back to events</a></div>`);
  const regs = s.registrations.filter(r => r.eventId === e.id).map(r => ({ ...r, st: Core.findStudent(s, r.roll) }));
  const q = s.waiting[String(e.id)] || [];
  return adminShell(route, `<nav class="crumbs"><a href="#admin-events">Events</a><span>/</span><span>${h(e.name)}</span></nav>
    <div class="sec-head"><div><h1 style="font-size:1.7rem">${h(e.name)}</h1><p>${h(e.date)}, ${h(e.venue)}. ${h(e.category)}, ${h(e.type)}.</p></div><div class="row"><a class="btn" href="#event-${e.id}">Public page</a><button class="btn" data-act="event-edit" data-id="${e.id}">${icon("edit")}Edit</button></div></div>
    ${e.openAccess ? `<div class="panel vio" style="margin-top:0"><h3>Open-access event</h3><p>No registrations or waiting list. Students just attend.</p></div>` : `
    <div class="tiles"><div class="tile"><span>Total seats</span><b>${e.totalSeats}</b></div><div class="tile"><span>Registered</span><b>${regs.length}</b></div><div class="tile"><span>Available</span><b>${Core.availableSeats(s, e)}</b></div><div class="tile"><span>Waiting</span><b>${q.length}</b></div></div>
    <div class="box" style="margin-top:20px"><div class="box-head"><h3>Waiting list, first in line first</h3></div>${q.length ? `<div class="queue">${q.map((r, i) => { const x = Core.findStudent(s, r); return `${i ? `<span class="qarrow">${icon("arrowLeft", "flip")}</span>` : ""}<span class="qitem"><i>${i + 1}</i>${h(r)}${x && x.name ? `, ${h(x.name)}` : ""}</span>`; }).join("")}</div><p class="faint" style="font-size:.82rem;margin-top:12px">When a registered student cancels, number 1 is registered automatically (FIFO).</p>` : `<p class="muted">Nobody is waiting.</p>`}</div>
    <div class="box"><div class="box-head"><h3>Registered students (${regs.length})</h3></div>${regs.length ? `<div class="tbl-wrap"><table><thead><tr><th>Roll number</th><th>Name</th><th>Course</th><th class="num">Sem</th><th>Registered</th><th class="num">Action</th></tr></thead><tbody>
      ${regs.map(r => `<tr><td>${h(r.roll)}</td><td>${h(r.st ? r.st.name || "Profile incomplete" : "Deleted account")}</td><td>${h(r.st ? r.st.course : "")}</td><td class="num">${h(r.st ? r.st.semester || "" : "")}</td><td>${r.at ? timeAgo(r.at) : "–"}</td><td class="num"><button class="btn sm danger" data-act="admin-cancel" data-roll="${h(r.roll)}" data-id="${e.id}">Cancel</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">No registrations yet.</p>`}</div>`}`);
}
function viewAdminStudents(route) {
  const s = S(), q = ui.adm.stuQ.trim().toLowerCase();
  const list = s.students.filter(x => !q || x.roll.toLowerCase().includes(q) || (x.name || "").toLowerCase().includes(q) || (x.course || "").toLowerCase().includes(q));
  return adminShell(route, `<div class="page-head" style="padding-top:0"><div class="sec-head" style="margin:0"><div><h1>Students</h1><p>${s.students.length} accounts. Passwords are stored as hashes and are never shown.</p></div><button class="btn primary" data-act="student-add">${icon("plus")}Add student</button></div></div>
    <div class="toolbar"><label class="search"><span class="sr">Search</span>${icon("search")}<input type="search" id="as-q" placeholder="Search by roll number, name or course" value="${h(ui.adm.stuQ)}"></label></div>
    <div id="as-table">${studentsTable(list)}</div>`);
}
function studentsTable(list) {
  const s = S();
  if (!list.length) return `<div class="empty"><b>No students match</b>Try a different search.</div>`;
  return `<div class="tbl-wrap"><table><thead><tr><th>Roll number</th><th>Name</th><th>Course</th><th class="num">Sem</th><th class="num">Registered</th><th class="num">Waiting</th><th>Status</th><th class="num">Actions</th></tr></thead><tbody>
  ${list.map(x => { const rc = s.registrations.filter(r => r.roll === x.roll).length, wc = Object.values(s.waiting).filter(a => a.includes(x.roll)).length;
    return `<tr><td>${h(x.roll)}</td><td>${h(x.name || "Profile incomplete")}</td><td>${h(x.course || "–")}</td><td class="num">${x.semester || "–"}</td><td class="num">${rc}</td><td class="num">${wc}</td>
    <td>${x.disabled ? `<span class="pill bad">Disabled</span>` : x.firstLogin ? `<span class="pill warn">Setup pending</span>` : `<span class="pill ok">Active</span>`}</td>
    <td class="num"><div class="row"><button class="btn sm" data-act="${x.disabled ? "student-enable" : "student-disable"}" data-roll="${h(x.roll)}">${x.disabled ? "Enable" : "Disable"}</button><button class="btn sm" data-act="student-reset" data-roll="${h(x.roll)}">Reset password</button><button class="btn sm icon danger" data-act="student-delete" data-roll="${h(x.roll)}" aria-label="Delete ${h(x.roll)}">${icon("trash")}</button></div></td></tr>`; }).join("")}
  </tbody></table></div>`;
}
function viewAdminRegs(route) {
  const s = S();
  return adminShell(route, `<div class="page-head" style="padding-top:0"><h1>All registrations</h1><p>${s.registrations.length} registrations. Cancelling one promotes the first student waiting for that event.</p></div>
    <div class="toolbar"><label class="search"><span class="sr">Search</span>${icon("search")}<input type="search" id="ar-q" placeholder="Search by roll number or event" value="${h(ui.adm.regQ)}"></label>
    <select class="select" id="ar-ev" aria-label="Event"><option value="">All events</option>${s.events.filter(e => !e.openAccess).map(e => `<option value="${e.id}" ${String(ui.adm.regEvent) === String(e.id) ? "selected" : ""}>${e.id}. ${h(e.name)}</option>`).join("")}</select></div>
    <div id="ar-table">${regsTable()}</div>`);
}
function regsTable() {
  const s = S(), q = ui.adm.regQ.trim().toLowerCase();
  let list = s.registrations.map(r => ({ ...r, e: Core.findEvent(s, r.eventId), st: Core.findStudent(s, r.roll) })).filter(x => x.e);
  if (ui.adm.regEvent) list = list.filter(x => String(x.e.id) === String(ui.adm.regEvent));
  if (q) list = list.filter(x => x.roll.toLowerCase().includes(q) || x.e.name.toLowerCase().includes(q) || (x.st && (x.st.name || "").toLowerCase().includes(q)));
  list.sort((a, b) => (b.at || 0) - (a.at || 0));
  const shown = list.slice(0, 200);
  if (!list.length) return `<div class="empty"><b>No registrations match</b>Try a different search or event.</div>`;
  return `<div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Event</th><th>Event date</th><th>Registered</th><th class="num">Action</th></tr></thead><tbody>
    ${shown.map(x => `<tr><td><b>${h(x.roll)}</b><div class="faint" style="font-size:.8rem">${h(x.st ? x.st.name || "Profile incomplete" : "Deleted account")}</div></td><td><a href="#admin-event-${x.e.id}" style="text-decoration:none">${h(x.e.name)}</a></td><td style="white-space:nowrap">${h(x.e.date)}</td><td>${x.at ? timeAgo(x.at) : "–"}</td><td class="num"><button class="btn sm danger" data-act="admin-cancel" data-roll="${h(x.roll)}" data-id="${x.e.id}">Cancel</button></td></tr>`).join("")}
  </tbody></table></div>${list.length > shown.length ? `<p class="faint" style="margin-top:10px;font-size:.85rem">Showing the newest 200 of ${list.length}. Search or pick an event to narrow the list.</p>` : ""}`;
}
function viewAdminWaiting(route) {
  const s = S(), entries = Object.entries(s.waiting).map(([id, a]) => ({ e: Core.findEvent(s, id), a })).filter(x => x.e && x.a.length).sort((x, y) => y.a.length - x.a.length);
  return adminShell(route, `<div class="page-head" style="padding-top:0"><h1>Waiting lists</h1><p>Every queue is first in, first out. Raising an event’s seat count promotes students from the front of its queue.</p></div>
    ${entries.length ? entries.map(({ e, a }) => `<div class="box"><div class="box-head"><h3><a href="#admin-event-${e.id}" style="text-decoration:none">${h(e.name)}</a></h3><span class="muted" style="font-size:.86rem">${Core.availableSeats(s, e)} of ${e.totalSeats} seats free, ${plural(a.length, "student")} waiting</span></div>
      <div class="queue">${a.map((r, i) => { const x = Core.findStudent(s, r); return `${i ? `<span class="qarrow">${icon("arrowLeft", "flip")}</span>` : ""}<span class="qitem"><i>${i + 1}</i>${h(r)}${x && x.name ? `, ${h(x.name)}` : ""}</span>`; }).join("")}</div></div>`).join("")
      : `<div class="empty"><b>No waiting lists right now</b>Queues appear here when students join a full event.</div>`}`);
}
function viewAdminData(route) {
  const s = S(), size = JSON.stringify(s).length;
  return adminShell(route, `<div class="page-head" style="padding-top:0"><h1>Data and demo</h1><p>Where the platform’s data is saved, and tools for the presentation.</p></div>
    <div class="box"><h3>Storage</h3><dl class="kv" style="max-width:520px;margin-top:12px"><dt>Mode</dt><dd>${Store.mode === "db" ? "Shared database (all devices)" : "This browser only"}</dd><dt>Saving</dt><dd>Automatic after every change</dd><dt>Data size</dt><dd>${Math.round(size / 1024)} KB of about 244 KB</dd><dt>Events</dt><dd>${s.events.length} (${s.events.filter(e => e.original).length} original)</dd></dl>
      <p class="muted" style="margin-top:14px;font-size:.9rem">The C++ admin menu had a “Save All Data” option. Here every change is saved the moment it’s made, so there’s nothing to save by hand.</p></div>
    <div class="box"><h3>Demo accounts</h3><p class="muted" style="margin-top:6px">60 demo students, <code>DEMO001</code> to <code>DEMO060</code>, all with password <code>Demo@2026</code>. Admin: <code>eventadmin</code> / <code>Admin@Demo26</code>.</p></div>
    <div class="box" style="border-color:color-mix(in srgb,var(--bad) 40%,transparent)"><h3>Reset demo data</h3><p class="muted" style="margin-top:6px">Restores all 59 original events, the demo students and the starting registrations and waiting lists. Accounts created through sign-up are removed.</p><div class="row" style="margin-top:14px"><button class="btn danger" data-act="reset-data">${icon("refresh")}Reset demo data</button></div></div>`);
}

// ---------- admin forms ----------
function eventFormHtml(e) {
  const s = S(), r = e ? Core.parseDateRange(e.date) : null;
  const fests = s.events.filter(x => x.openAccess && (!x.parent || x.parent === "None") && (!e || x.id !== e.id));
  const cats = [...new Set(s.events.map(x => x.category))].sort(), types = [...new Set(s.events.map(x => x.type))].sort(), venues = [...new Set(s.events.map(x => x.venue))].sort();
  const parentVal = e ? e.parent : "None";
  const parentInList = parentVal === "None" || fests.some(f => f.name === parentVal);
  return `${e && e.original ? `<p style="margin-bottom:10px">This is an original C++ record (ID ${e.id}). Changes are saved in the website’s data only.</p>` : ""}
  <form class="form" id="event-form" data-form="event" data-id="${e ? e.id : ""}" novalidate>
    <div class="field"><label for="ef-name">Event name</label><input id="ef-name" name="name" required maxlength="80" value="${h(e ? e.name : "")}"></div>
    <div class="two"><div class="field"><label for="ef-cat">Category</label><input id="ef-cat" name="category" list="ef-cats" required value="${h(e ? e.category : "")}"><datalist id="ef-cats">${cats.map(c => `<option value="${h(c)}">`).join("")}</datalist></div>
      <div class="field"><label for="ef-type">Event type</label><input id="ef-type" name="type" list="ef-types" value="${h(e ? e.type : "Competition")}"><datalist id="ef-types">${types.map(c => `<option value="${h(c)}">`).join("")}</datalist></div></div>
    <div class="two"><div class="field"><label for="ef-d1">Date</label><input id="ef-d1" name="d1" type="date" required value="${r ? Core.toISO(r.start) : ""}"></div>
      <div class="field"><label for="ef-d2">End date (multi-day only)</label><input id="ef-d2" name="d2" type="date" value="${r && +r.end !== +r.start ? Core.toISO(r.end) : ""}"></div></div>
    <div class="two"><div class="field"><label for="ef-t1">Start time (optional)</label><input id="ef-t1" name="startTime" type="time" value="${h(e ? e.startTime : "")}"></div>
      <div class="field"><label for="ef-t2">End time (optional)</label><input id="ef-t2" name="endTime" type="time" value="${h(e ? e.endTime : "")}"></div></div>
    <div class="field"><label for="ef-venue">Venue</label><input id="ef-venue" name="venue" list="ef-venues" required value="${h(e ? e.venue : "")}"><datalist id="ef-venues">${venues.map(c => `<option value="${h(c)}">`).join("")}</datalist></div>
    <div class="two"><div class="field"><label for="ef-fee">Registration fee (₹)</label><input id="ef-fee" name="fee" type="number" min="0" step="1" required value="${e ? e.fee : 0}"></div>
      <div class="field"><label for="ef-seats">Total seats</label><input id="ef-seats" name="totalSeats" type="number" min="0" step="1" required value="${e ? e.totalSeats : 50}" ${e && e.openAccess ? "disabled" : ""}></div></div>
    <div class="field check"><input id="ef-open" name="openAccess" type="checkbox" ${e && e.openAccess ? "checked" : ""}><label for="ef-open">Open access (no registration and no seat limit)</label></div>
    <div class="two"><div class="field"><label for="ef-parent">Part of festival</label><select id="ef-parent" name="parent"><option value="None">None</option>${fests.map(f => `<option ${f.name === parentVal ? "selected" : ""}>${h(f.name)}</option>`).join("")}${parentInList ? "" : `<option selected value="${h(parentVal)}">${h(parentVal)} (original value)</option>`}</select></div>
      <div class="field"><label for="ef-status">Registration</label><select id="ef-status" name="status"><option value="open">Open</option><option value="closed" ${e && e.status === "closed" ? "selected" : ""}>Closed</option></select></div></div>
    <div class="field"><label for="ef-desc">Description</label><textarea id="ef-desc" name="description" maxlength="600">${h(e ? e.description : "")}</textarea></div>
    <div class="form-err" role="alert"></div>
  </form>`;
}
