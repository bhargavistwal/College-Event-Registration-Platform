# How to edit the website

After editing any file on GitHub, click **Commit changes**, wait about a minute, then press **Ctrl + Shift + R** in Chrome to reload without the cache.

| I want to change… | Edit this file | Where |
|---|---|---|
| An event's name, date, venue, seats, category | `js/data.js` | `ORIGINAL_EVENTS` list (same order as `loadEvents()` in main.cpp) |
| Event descriptions | `js/data.js` | `DESCRIPTIONS` |
| The 5 featured events | `js/data.js` | `FEATURED_IDS` (use event IDs) |
| Colours and fonts | `css/styles.css` | the `:root` blocks at the top (light, then dark) |
| Homepage text | `js/app-views.js` | function `viewHome` |
| Registration rules | `js/core.js` | functions `register`, `cancel`, `promote` |
| Poster artwork | `js/posters.js` | object `M` (one drawing per motif) and `MOTIF_BY_ID` |

**Important:** the site saves its data in each visitor's browser. After you change `js/data.js`, open the admin panel and choose **Data and demo → Reset demo data** so your browser loads the new event list.

You can also add, edit, close and delete events from the admin panel without touching any code. Those changes are saved in your browser only.

## Direct links
- Website: `index.html`
- Admin login: `admin.html` (or `index.html#admin-login`)
- Student login: `index.html#login`
- All events: `index.html#events`
- One event: `index.html#event-35` (any event ID)

## Demo accounts
- Students `DEMO001` to `DEMO060`, password `Demo@2026`
- Admin `eventadmin`, password `Admin@Demo26`
