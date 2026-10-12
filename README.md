<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# ExamNova

ExamNova uses Firebase Authentication and Cloud Firestore for user identity and
institutional examination data.

View the app in AI Studio: https://ai.studio/apps/4c1eaf0d-fe38-416e-8a3e-5a721b0145ef

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Configure [firebase-applet-config.json](./firebase-applet-config.json) with
   your Firebase web app settings. Set `firestoreDatabaseId` to the Firestore
   database ID when using a named database; omit it to use `(default)`.
3. In the Firebase console, enable the sign-in providers used by the app
   (Email/Password and Google), create the Firestore database, and deploy
   [firestore.rules](./firestore.rules). Under Authentication → Settings →
   Authorized domains, add each hostname you use, including `localhost` for
   local development and the exact preview and production hostnames. Enter only
   the hostname (no `https://`, port, or path); reloading and retrying sign-in
   after adding it is required.
4. Create Email/Password accounts in Firebase Authentication and assign their
   roles in `profiles/{uid}` in Firestore.
5. Set `GEMINI_API_KEY` in `.env.local` if using the AI features.
6. Run the app:
   `npm run dev`

The database client is initialized once and shared by authentication and data
services. The app reads and writes live Firestore collections; it does not seed
demo data at startup. An administrator can explicitly load the sample dataset
from the dashboard when needed.
# Smart-Examination-Management
