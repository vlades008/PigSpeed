# Team accounts and live runs (Firebase)

The app works fully without this. With a Firebase project connected, employees can sign in and share runs:
- **Engineer**: creates and runs runs, logs valve passages. Sees all team runs.
- **Manager**: read-only live view of every team run. Can still keep private runs on the device.
- **Admin**: everything, plus manages the team (invites, roles) and can change or delete any run.

New runs created while signed in as engineer or admin are shared with the team automatically.
Runs made before signing in stay on the device; use the cloud button on a run card to share it.

## One-time setup (about 10 minutes)
1. console.firebase.google.com > Add project (name `pigspeed`, Analytics off).
2. Build > Authentication > Get started > enable **Email/Password** (and **Google** if wanted).
   Authentication > Settings > Authorized domains: add `vlades008.github.io`.
3. Build > Firestore Database > Create database (production mode, nearest region).
4. Firestore > Rules: paste the content of `firestore.rules`, replace `REPLACE_WITH_ADMIN_EMAIL` with the
   administrator's address (lower case) and Publish.
5. Project settings > Your apps > Web (`</>`) > register app > copy the `firebaseConfig` object.
6. Put it into `tools/config.json`:
   ```json
   { "siteUrl": "https://vlades008.github.io/PigSpeed/", "teamId": "main",
     "firebase": { "apiKey": "...", "authDomain": "...", "projectId": "...", "appId": "..." } }
   ```
7. `npm run release -- --bump=minor --notes="Accounts and live runs"`, then commit and push (see PUBLISH.md).

## First use
The administrator (the email from step 4) opens the app, Runs > Sign in > Create account, confirms the email link, and the team is
created automatically. Then Runs > Team > invite colleagues by email with a role. Invited people create an account with that
email (or use Google) and join the team on first sign-in.

## Notes
- Runs work offline in the field and sync when the connection returns.
- Google sign-in needs the website or installed web app; in the exe and APK use email and password.
- Try it without a server: open `index.html?mock=u1:Ivan:engineer` and, in another tab, `?mock=u2:Anna:manager`.
- The Firebase web config is not secret; the rules in `firestore.rules` are what protect the data.
