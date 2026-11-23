// ===================== CORE LOGIC =====================
// Pure functions over a plain state object. Every rule from src/main.cpp is
// marked [C++]; additions made for the website are marked [WEB].
const Core = (() => {
  const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const MONTH_NAMES = MONTHS.map(m => m[0].toUpperCase() + m.slice(1));

  // ---------- Dates ("24-26 November 2026" or "15 April 2027") ----------
  function parseDateRange(str) {
    const m = /^\s*(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([A-Za-z]+)\s+(\d{4})\s*$/.exec(String(str || ""));
    if (!m) return null;
    const mi = MONTHS.indexOf(m[3].toLowerCase());
    if (mi < 0) return null;
    const y = +m[4], d1 = +m[1], d2 = m[2] ? +m[2] : d1;
    const start = new Date(y, mi, d1), end = new Date(y, mi, d2);
    if (start.getMonth() !== mi || end.getMonth() !== mi || end < start) return null;
    return { start, end };
  }
  function formatDate(isoStart, isoEnd) { // "2027-04-16" -> "16 April 2027"
    const a = isoStart ? new Date(isoStart + "T00:00:00") : null;
    if (!a || isNaN(a)) return null;
    const b = isoEnd ? new Date(isoEnd + "T00:00:00") : null;
    if (b && !isNaN(b) && +b !== +a) {
      if (b < a || b.getMonth() !== a.getMonth() || b.getFullYear() !== a.getFullYear()) return null;
      return `${a.getDate()}-${b.getDate()} ${MONTH_NAMES[a.getMonth()]} ${a.getFullYear()}`;
    }
    return `${a.getDate()} ${MONTH_NAMES[a.getMonth()]} ${a.getFullYear()}`;
  }
  function toISO(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function startOfToday() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }

  // ---------- [C++] EventQueue: linked-list FIFO, mirrors dsa/eventQueue.h ----------
  class EventQueue {
    constructor(items = []) { this.front = null; this.rear = null; for (const r of items) this.enqueue(r); }
    isEmpty() { return this.front === null; }
    contains(roll) { for (let n = this.front; n; n = n.next) if (n.roll === roll) return true; return false; }
    enqueue(roll) {                      // rejects duplicates, like the C++ version
      if (this.contains(roll)) return false;
      const node = { roll, next: null };
      if (this.rear === null) this.front = this.rear = node; else { this.rear.next = node; this.rear = node; }
      return true;
    }
    dequeue() {                          // returns the front roll or null
      if (this.isEmpty()) return null;
      const roll = this.front.roll; this.front = this.front.next;
      if (this.front === null) this.rear = null;
      return roll;
    }
    remove(roll) {                       // [WEB] leave the waiting list; keeps everyone else's order
      let prev = null;
      for (let n = this.front; n; prev = n, n = n.next) {
        if (n.roll === roll) {
          if (prev) prev.next = n.next; else this.front = n.next;
          if (this.rear === n) this.rear = prev;
          return true;
        }
      }
      return false;
    }
    toArray() { const out = []; for (let n = this.front; n; n = n.next) out.push(n.roll); return out; }
  }

  // ---------- State helpers ----------
  const normRoll = r => String(r || "").trim().toUpperCase();
  const findEvent = (s, id) => s.events.find(e => e.id === Number(id)) || null;
  const findStudent = (s, roll) => s.students.find(st => st.roll === normRoll(roll)) || null;
  const isRegistered = (s, roll, id) => s.registrations.some(r => r.roll === roll && r.eventId === Number(id));  // [C++] isRegistered
  const regCount = (s, id) => s.registrations.reduce((n, r) => n + (r.eventId === Number(id) ? 1 : 0), 0);
  const queueOf = (s, id) => new EventQueue(s.waiting[String(id)] || []);
  function saveQueue(s, id, q) { const a = q.toArray(); if (a.length) s.waiting[String(id)] = a; else delete s.waiting[String(id)]; }
  function availableSeats(s, ev) {       // [C++] seats are total minus registrations (as rebuilt in loadEvents)
    if (ev.openAccess) return 0;
    return Math.max(0, ev.totalSeats - regCount(s, ev.id));
  }
  function waitingPosition(s, roll, id) { const a = s.waiting[String(id)] || []; const i = a.indexOf(roll); return i < 0 ? 0 : i + 1; }
  function log(s, entry) {               // [WEB] activity feed, newest first (idea from dsa/eventStack.h)
    s.activity.unshift({ t: Date.now(), ...entry });
    if (s.activity.length > 300) s.activity.length = 300;
  }

  // [WEB] parentEvent strings in main.cpp don’t always equal the parent's name
  // (events 5 and 6 say "Graphathon"; event 4 is "Graphathon / Graph-E-Thon").
  function parentOf(s, ev) {
    if (!ev.parent || ev.parent === "None") return null;
    const p = ev.parent.trim().toLowerCase();
    return s.events.find(e => e.id !== ev.id && e.name.toLowerCase() === p)
      || s.events.find(e => e.id !== ev.id && e.name.toLowerCase().split("/").map(x => x.trim()).includes(p))
      || s.events.find(e => e.id !== ev.id && e.name.toLowerCase().startsWith(p + " "))
      || null;
  }
  const childrenOf = (s, ev) => s.events.filter(e => { const p = parentOf(s, e); return p && p.id === ev.id; });

  function timesOverlap(a, b) {
    if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return true; // no times -> date match is enough
    return a.startTime < b.endTime && b.startTime < a.endTime;
  }
  // [WEB] same-date warning: confirmed registrations whose dates overlap the target event
  function dateConflicts(s, roll, id) {
    const target = findEvent(s, id); if (!target) return [];
    const tr = parseDateRange(target.date); if (!tr) return [];
    return s.registrations.filter(r => r.roll === roll && r.eventId !== target.id)
      .map(r => findEvent(s, r.eventId)).filter(Boolean)
      .filter(e => { const er = parseDateRange(e.date); return er && er.start <= tr.end && tr.start <= er.end && timesOverlap(e, target); });
  }

  // ---------- Registration [C++ registerEvent] ----------
  // Returns {ok:false, code, msg} or {ok:true, action:"register"|"waitlist"}
  function checkRegister(s, roll, id) {
    const st = findStudent(s, roll);
    if (!st) return { ok: false, code: "NOT_LOGGED_IN", msg: "Log in as a student to register." };
    if (st.disabled) return { ok: false, code: "DISABLED", msg: "This account is disabled. Contact the event office." };
    const ev = findEvent(s, id);
    if (!ev) return { ok: false, code: "INVALID_EVENT", msg: "Invalid event ID." };
    if (ev.openAccess) return { ok: false, code: "OPEN_ACCESS", msg: "This event is open access. Registration is not required." };
    if (ev.status === "closed") return { ok: false, code: "CLOSED", msg: "Registration for this event is closed." };
    if (isRegistered(s, st.roll, ev.id)) return { ok: false, code: "DUPLICATE", msg: "You are already registered for this event." };
    const q = queueOf(s, ev.id);
    if (q.contains(st.roll)) return { ok: false, code: "ALREADY_WAITING", msg: "You are already in this event’s waiting list." };
    // [C++] a seat is given only when one is free AND nobody is already waiting
    if (availableSeats(s, ev) > 0 && q.isEmpty()) return { ok: true, action: "register", event: ev };
    return { ok: true, action: "waitlist", event: ev };
  }

  function register(s, roll, id, opts = {}) {
    roll = normRoll(roll);
    const c = checkRegister(s, roll, id);
    if (!c.ok) return c;
    const ev = c.event;
    if (c.action === "register") {
      s.registrations.push({ roll, eventId: ev.id, at: Date.now() });
      log(s, { kind: "registered", roll, eventId: ev.id, text: `Registered for ${ev.name}` });
      return { ok: true, action: "register", msg: `Registration successful! Event: ${ev.name}` };
    }
    if (!opts.joinWaitlist) return { ok: false, code: "NEEDS_WAITLIST", msg: "No seat is currently available, or students are already waiting." };
    const q = queueOf(s, ev.id);
    if (!q.enqueue(roll)) return { ok: false, code: "ALREADY_WAITING", msg: "You are already in this event’s waiting list." };
    saveQueue(s, ev.id, q);
    const pos = waitingPosition(s, roll, ev.id);
    log(s, { kind: "waitlisted", roll, eventId: ev.id, text: `Joined the waiting list for ${ev.name} at position ${pos}` });
    return { ok: true, action: "waitlist", position: pos, msg: `You have been added to the waiting list. Position ${pos}.` };
  }

  // Promote the next eligible students (FIFO) into free seats.
  function promote(s, ev, maxCount, actor) {
    const q = queueOf(s, ev.id); const promoted = [];
    while (promoted.length < maxCount && !q.isEmpty()) {
      const next = q.dequeue();
      const st = findStudent(s, next);
      if (!st || st.disabled || isRegistered(s, next, ev.id)) {     // [WEB] skip ineligible entries
        log(s, { kind: "skipped", roll: next, eventId: ev.id, text: `${next} was removed from the ${ev.name} waiting list (no longer eligible)` });
        continue;
      }
      s.registrations.push({ roll: next, eventId: ev.id, at: Date.now() });
      log(s, { kind: "promoted", roll: next, eventId: ev.id, text: `Promoted from the waiting list and registered for ${ev.name}`, by: actor });
      promoted.push(next);
    }
    saveQueue(s, ev.id, q);
    return promoted;
  }

  // ---------- Cancellation [C++ cancelRegistration] ----------
  function cancel(s, roll, id, actor = "student") {
    roll = normRoll(roll);
    const idx = s.registrations.findIndex(r => r.roll === roll && r.eventId === Number(id));
    if (idx < 0) return { ok: false, code: "NOT_REGISTERED", msg: "You are not registered for this event." };
    const ev = findEvent(s, id);
    if (!ev) return { ok: false, code: "INVALID_EVENT", msg: "Event not found." };
    s.registrations.splice(idx, 1);
    log(s, { kind: "cancelled", roll, eventId: ev.id, text: actor === "admin" ? `Registration for ${ev.name} was cancelled by an admin` : `Cancelled registration for ${ev.name}` });
    // [C++] the first student in the queue takes the freed seat
    const promoted = availableSeats(s, ev) > 0 ? promote(s, ev, 1, actor) : [];
    if (promoted.length) return { ok: true, promoted: promoted[0], msg: "Registration cancelled successfully. The next student on the waiting list has been registered." };
    return { ok: true, promoted: null, msg: "Registration cancelled successfully. One seat is now available." };
  }

  function leaveWaitlist(s, roll, id) {   // [WEB]
    roll = normRoll(roll);
    const ev = findEvent(s, id); if (!ev) return { ok: false, code: "INVALID_EVENT", msg: "Event not found." };
    const q = queueOf(s, ev.id);
    if (!q.remove(roll)) return { ok: false, code: "NOT_WAITING", msg: "You are not on this event’s waiting list." };
    saveQueue(s, ev.id, q);
    log(s, { kind: "left-waitlist", roll, eventId: ev.id, text: `Left the waiting list for ${ev.name}` });
    return { ok: true, msg: `You have left the waiting list for ${ev.name}.` };
  }

  // ---------- Accounts ----------
  const ROLL_RE = /^[A-Z0-9]{4,20}$/;
  function validatePassword(p) {
    if (typeof p !== "string" || p.length < 8) return "Password must be at least 8 characters.";
    if (/\s/.test(p)) return "Password cannot contain spaces.";
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "Password must contain at least one letter and one number.";
    return null;
  }
  function validateProfile(p) {
    if (!p.name || p.name.trim().length < 2) return "Enter your full name.";
    if (p.name.trim().length > 60) return "Name is too long.";
    if (!p.course || !p.course.trim()) return "Choose your course.";
    const sem = Number(p.semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 8) return "Enter a valid semester (1-8).";  // [C++] same range
    return null;
  }
  function addStudent(s, data, cred, by = "signup") {
    const roll = normRoll(data.roll);
    if (!ROLL_RE.test(roll)) return { ok: false, code: "BAD_ROLL", msg: "Roll number must be 4-20 letters or digits." };
    if (findStudent(s, roll)) return { ok: false, code: "ROLL_TAKEN", msg: "An account with this roll number already exists. Log in instead." };
    const err = validateProfile(data); if (err) return { ok: false, code: "BAD_PROFILE", msg: err };
    s.students.push({ roll, name: data.name.trim(), course: data.course.trim(), semester: Number(data.semester),
      salt: cred.salt, hash: cred.hash, firstLogin: by === "admin", disabled: false, createdAt: Date.now(), source: by });
    log(s, { kind: "account", roll, text: by === "admin" ? `Account created by an admin for ${roll}` : `New account created for ${roll}` });
    return { ok: true, roll };
  }
  function completeSetup(s, roll, profile, cred) {
    const st = findStudent(s, roll); if (!st) return { ok: false, msg: "Account not found." };
    if (!st.firstLogin) return { ok: false, msg: "Your profile is already set up." };
    const needsProfile = !st.name || !st.course || !(st.semester > 0);
    if (needsProfile) {
      const err = validateProfile(profile); if (err) return { ok: false, msg: err };
      st.name = profile.name.trim(); st.course = profile.course.trim(); st.semester = Number(profile.semester);
    }
    st.salt = cred.salt; st.hash = cred.hash; st.firstLogin = false;
    log(s, { kind: "account", roll: st.roll, text: "Completed first-login setup" });
    return { ok: true };
  }
  function setPassword(s, roll, cred, expectHash) {
    const st = findStudent(s, roll); if (!st) return { ok: false, msg: "Account not found." };
    if (expectHash && st.hash !== expectHash) return { ok: false, msg: "Your password was changed elsewhere. Log in again." };
    st.salt = cred.salt; st.hash = cred.hash;
    log(s, { kind: "account", roll: st.roll, text: "Changed password" });
    return { ok: true };
  }

  // ---------- Admin: events [WEB] ----------
  function validateEventInput(d) {
    const name = String(d.name || "").trim();
    if (name.length < 3 || name.length > 80) return "Event name must be 3-80 characters.";
    if (!String(d.category || "").trim()) return "Enter a category.";
    if (!parseDateRange(d.date)) return "Enter a valid date.";
    if (!String(d.venue || "").trim()) return "Enter a venue.";
    const fee = Number(d.fee); if (!Number.isInteger(fee) || fee < 0 || fee > 100000) return "Fee must be a whole number of rupees, 0 or more.";
    const seats = Number(d.totalSeats);
    if (d.openAccess) { if (seats !== 0) return "Open-access events have no seat limit. Set seats to 0."; }
    else if (!Number.isInteger(seats) || seats < 1 || seats > 5000) return "Seats must be a whole number from 1 to 5000.";
    if ((d.startTime && !d.endTime) || (!d.startTime && d.endTime)) return "Enter both a start and an end time, or neither.";
    if (d.startTime && d.endTime && d.startTime >= d.endTime) return "End time must be after the start time.";
    return null;
  }
  function cleanEvent(d) {
    return { name: String(d.name).trim(), category: String(d.category).trim(), date: String(d.date).trim(), venue: String(d.venue).trim(),
      fee: Number(d.fee), totalSeats: d.openAccess ? 0 : Number(d.totalSeats), parent: (d.parent || "None").trim() || "None",
      type: (d.type || "Individual").trim() || "Individual", openAccess: !!d.openAccess,
      description: String(d.description || "").trim(), status: d.status === "closed" ? "closed" : "open",
      startTime: d.startTime || "", endTime: d.endTime || "" };
  }
  function addEvent(s, d) {
    const err = validateEventInput(d); if (err) return { ok: false, msg: err };
    const id = s.events.reduce((m, e) => Math.max(m, e.id), 0) + 1;
    const ev = { id, ...cleanEvent(d), original: false };
    s.events.push(ev);
    log(s, { kind: "admin", eventId: id, text: `Event added: ${ev.name}` });
    return { ok: true, id };
  }
  function updateEvent(s, id, d) {
    const ev = findEvent(s, id); if (!ev) return { ok: false, msg: "Invalid event ID." };
    const err = validateEventInput(d); if (err) return { ok: false, msg: err };
    const c = cleanEvent(d); const regs = regCount(s, ev.id);
    if (c.openAccess && (regs > 0 || (s.waiting[String(ev.id)] || []).length))
      return { ok: false, msg: `This event has ${regs} registration(s) or a waiting list. Clear them before making it open access.` };
    if (!c.openAccess && c.totalSeats < regs) return { ok: false, msg: `Seats can’t be lower than the ${regs} students already registered.` };
    Object.assign(ev, c);
    let promoted = [];
    if (!ev.openAccess) { const free = availableSeats(s, ev); if (free > 0) promoted = promote(s, ev, free, "admin"); }
    log(s, { kind: "admin", eventId: ev.id, text: `Event updated: ${ev.name}` });
    return { ok: true, promoted };
  }
  function deleteEvent(s, id) {
    const ev = findEvent(s, id); if (!ev) return { ok: false, msg: "Invalid event ID." };
    const kids = childrenOf(s, ev);
    if (kids.length) return { ok: false, msg: `${ev.name} has ${kids.length} sub-event(s). Delete or reassign them first.` };
    const regs = regCount(s, ev.id), waiting = (s.waiting[String(ev.id)] || []).length;
    s.events = s.events.filter(e => e.id !== ev.id);
    s.registrations = s.registrations.filter(r => r.eventId !== ev.id);
    delete s.waiting[String(ev.id)];
    log(s, { kind: "admin", text: `Event deleted: ${ev.name} (${regs} registrations and ${waiting} waiting removed)` });
    return { ok: true };
  }
  function setStatus(s, id, status) {
    const ev = findEvent(s, id); if (!ev) return { ok: false, msg: "Invalid event ID." };
    if (ev.openAccess) return { ok: false, msg: "Open-access events don’t take registrations." };
    ev.status = status === "closed" ? "closed" : "open";
    log(s, { kind: "admin", eventId: ev.id, text: `Registration ${ev.status === "open" ? "opened" : "closed"} for ${ev.name}` });
    return { ok: true };
  }

  // ---------- Admin: students [WEB] ----------
  function setDisabled(s, roll, disabled) {
    const st = findStudent(s, roll); if (!st) return { ok: false, msg: "Student not found." };
    st.disabled = !!disabled;
    if (disabled) {   // a disabled student leaves every waiting list
      for (const k of Object.keys(s.waiting)) { const q = new EventQueue(s.waiting[k]); if (q.remove(st.roll)) saveQueue(s, Number(k), q); }
    }
    log(s, { kind: "admin", roll: st.roll, text: `Account ${disabled ? "disabled" : "enabled"}: ${st.roll}` });
    return { ok: true };
  }
  function adminResetPassword(s, roll, cred) {
    const st = findStudent(s, roll); if (!st) return { ok: false, msg: "Student not found." };
    st.salt = cred.salt; st.hash = cred.hash; st.firstLogin = true;
    log(s, { kind: "admin", roll: st.roll, text: `Temporary password set for ${st.roll}` });
    return { ok: true };
  }
  function deleteStudent(s, roll) {
    const st = findStudent(s, roll); if (!st) return { ok: false, msg: "Student not found." };
    const mine = s.registrations.filter(r => r.roll === st.roll).map(r => r.eventId);
    for (const id of mine) cancel(s, st.roll, id, "admin");     // frees seats and promotes waiting students
    for (const k of Object.keys(s.waiting)) { const q = new EventQueue(s.waiting[k]); if (q.remove(st.roll)) saveQueue(s, Number(k), q); }
    s.students = s.students.filter(x => x.roll !== st.roll);
    log(s, { kind: "admin", text: `Account deleted: ${st.roll}` });
    return { ok: true };
  }

  // ---------- Queries ----------
  // [C++ searchEvent] name OR category, case-insensitive
  function search(events, keyword) {
    const k = String(keyword || "").trim().toLowerCase();
    if (!k) return events.slice();
    return events.filter(e => e.name.toLowerCase().includes(k) || e.category.toLowerCase().includes(k));
  }
  // [C++ sortEvents] 1 = by name, 2 = by available seats (highest first)
  function sortEvents(s, events, mode) {
    const a = events.slice();
    if (mode === "name") a.sort((x, y) => x.name.localeCompare(y.name, "en", { sensitivity: "base" }) || x.id - y.id);
    else if (mode === "seats") a.sort((x, y) => availableSeats(s, y) - availableSeats(s, x) || x.id - y.id);
    else if (mode === "date") a.sort((x, y) => (parseDateRange(x.date)?.start || 0) - (parseDateRange(y.date)?.start || 0) || x.id - y.id);
    else a.sort((x, y) => x.id - y.id);
    return a;
  }
  function stats(s) {
    const reg = s.events.filter(e => !e.openAccess);
    const seatsTotal = reg.reduce((n, e) => n + e.totalSeats, 0);
    const waiting = Object.values(s.waiting).reduce((n, a) => n + a.length, 0);
    return { events: s.events.length, registrable: reg.length, openAccess: s.events.length - reg.length,
      students: s.students.length, registrations: s.registrations.length, waiting, seatsTotal,
      seatsLeft: reg.reduce((n, e) => n + availableSeats(s, e), 0) };
  }

  // ---------- Initial state ----------
  function buildEvents(original, descriptions) {
    return original.map(([id, name, category, date, venue, fee, seats, parent, type, open]) => ({
      id, name, category, date, venue, fee, totalSeats: seats, parent, type, openAccess: open,
      description: descriptions[id] || "", status: "open", startTime: "", endTime: "", original: true }));
  }

  return { parseDateRange, formatDate, toISO, startOfToday, EventQueue, normRoll, findEvent, findStudent, isRegistered, regCount,
    availableSeats, waitingPosition, parentOf, childrenOf, dateConflicts, checkRegister, register, cancel, leaveWaitlist,
    ROLL_RE, validatePassword, validateProfile, addStudent, completeSetup, setPassword,
    validateEventInput, addEvent, updateEvent, deleteEvent, setStatus, setDisabled, adminResetPassword, deleteStudent,
    search, sortEvents, stats, buildEvents, log, MONTH_NAMES };
})();
if (typeof module !== "undefined") module.exports = Core;
