# Back office → app data flow + push notifications

## The core architecture change this requires

Your back office already exists on the website and is the system of record for fights, fighters, and affiliate activity. **The app must read from the same backend/database the back office writes to — not a separate copy.** There is one database. The website's admin panel writes to it; the app (and any website SEO pages) read from it. Nothing gets "uploaded to the website" and then separately pushed to the app — it's one write, visible everywhere instantly, because everything is querying the same source.

This is different from copying data between two systems. If the app has its own database that only refreshes periodically, admin changes will lag or drift — exactly the kind of mismatch that's been the recurring problem here. One shared backend, multiple front ends (back office, app, website SEO pages) reading and writing to it.

## What triggers a notification

Two kinds of events, both already partially speced in the "Automation / Admin-facing rules" section of `README.md`:

| Event | Trigger | Who gets notified |
|---|---|---|
| **New fight posted** | Admin creates a fight record in the back office | All users, or users who follow that sport/fighter |
| **Fight week** | A fight's date crosses into "within 7 days" (computed automatically, not manually flagged) | Users entered in that fight + users who follow either fighter |
| **Affiliate promotes a Shadow Fight** | Affiliate publishes a Shadow Fight through their portal | That affiliate's followers + users who play Shadow Fights regularly |
| **Fight going live** | Admin flips a fight to "live" for scoring | Users entered in that fight |
| **Results posted** | Admin finalizes scoring | Users entered in that fight |

## How to build it (no new infrastructure required beyond what's listed)

1. **The back office write is the trigger.** When an admin or affiliate saves a fight/Shadow Fight record, that save fires a server-side event — a webhook or a simple "after save" hook in the back office's own code. This is the `hub.onOfficial()` listener pattern already described in `DEVELOPER-HANDOFF.md`: adding a new automated behavior means adding a listener, never editing the save logic itself.
2. **The listener sends a push notification** via whatever push service you choose (Firebase Cloud Messaging covers iOS/Android/web in one integration — recommended over building separate APNs/FCM paths). It composes the message from the fight record (fighters, sport, date) — never hardcoded text.
3. **The app needs to register for push** — on first login/signup, request notification permission and store the device token against the user's account. This is a standard mobile/PWA step your developer will recognize; it's not built yet in the prototype and needs to be added.
4. **In-app, the same event also updates the live UI** — the notification bell badge (already in the prototype's top bar) increments, and Upcoming Events / MY ENTRIES refresh from the same backend without a manual app update. Since it's the same database, this happens automatically once the read side is wired to live data instead of the prototype's static arrays.

## What changes about "uploading to the website"

Nothing changes about how the admin works — they still use the back office they already have. What changes is what happens underneath: instead of that save being website-only, it writes to the shared backend, and the notification listener does the rest. The admin doesn't need a second step to "also send it to the app."

## Immediate build order

1. Confirm (or migrate to) one shared backend/database for fights, fighters, and affiliate content — the back office and app both read/write it. This is the prerequisite for everything else here.
2. Add the save-triggered listener pattern for the five events above.
3. Add push notification sending (Firebase Cloud Messaging) wired to that listener.
4. Add push permission request + device token storage to the app's signup/login flow.
5. Wire the app's Upcoming Events, MY ENTRIES, and notification bell to live backend reads instead of the prototype's static data.

See `DEVELOPER-HANDOFF.md` for the listener pattern in more detail, and `BACK-OFFICE-FIGHT-PLACEMENT.md` for how a fight record should be structured so it carries everything a notification needs.
