NEXT GEN GAME - FIREBASE EDITION

Files included:
- index.html          (main public site)
- admin.html          (hidden login page for admins)
- dashboard.html      (admin CRUD dashboard)
- style.css           (shared styles)
- app.js              (main site javascript - imports firebaseConfig.js)
- firebaseConfig.js   (PLACEHOLDER - paste your Firebase config here)
- firestore.rules     (Firestore security rules - paste into Firebase console)

Quick steps to get live:

1) In Firebase Console:
   - Create project and Web App
   - Enable Firestore (create in test mode initially)
   - Enable Authentication -> Email/Password
   - Add an admin user (Authentication -> Add user)
   - In Firestore -> Rules, replace with the contents of firestore.rules and Publish

2) Paste your firebaseConfig into firebaseConfig.js (replace the placeholder object).
   Example export format:
   export const firebaseConfig = { apiKey: \"...\", authDomain: \"...\", projectId: \"...\", storageBucket: \"...\", messagingSenderId: \"...\", appId: \"...\" };

3) Upload all files to GitHub repo or Netlify. (index.html must be at root)
   - GitHub Pages or Netlify will serve the static site.
   - Admin pages are not linked from the site. Use admin.html directly to login.

4) After login, go to dashboard.html to create posts (choose category -> publish).
   - Posts are saved to collections: latest_gaming, latest_tech, top_10, gta6
   - Homepage loads posts and shows latest items.

Notes & security:
- Firestore rules allow only authenticated users to write. Make sure to add admin user(s) in Firebase Auth.
- Keep firebaseConfig.js private (don't share publicly). You can store it outside public repo if preferred.
