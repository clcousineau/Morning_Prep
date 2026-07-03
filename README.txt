Morning Prep PWA
================

This folder contains the complete Morning Prep app.

Files included:
- index.html
- styles.css
- app.js
- data.js
- manifest.json
- service-worker.js
- icons/icon.svg

How to share it
---------------
For the app to install on phones and work offline, upload this whole folder to a secure web host.

Good simple hosting options:
- Netlify
- Vercel
- GitHub Pages
- Any HTTPS website host

After it is hosted:
1. Open the web link on the phone.
2. Use the browser menu.
3. Choose "Add to Home Screen" or "Install app".
4. Open Morning Prep once while online.
5. After that, it will keep working offline.

Important
---------
Opening index.html directly from a file may show the checklist, but install/offline mode usually will not work that way. PWAs need localhost or an HTTPS web address.

Editing prep quantities later
-----------------------------
Edit data.js to change quantities.

After changing data.js, also update the first line of service-worker.js to a new cache name, for example:

const CACHE_NAME = "morning-prep-v3";

That tells phones to download the newest version.
