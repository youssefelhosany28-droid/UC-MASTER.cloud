# Prize Master — starter website

A bilingual (Arabic/English), dark purple/black PWA starter with Firebase email/password authentication and PUBG ID-only redemption request submission.

## Important limitations
- This is a **starter project**, not a published or production-ready service.
- No ad network is connected and no coins are credited. Do not promise UC rewards until you have an ad/reward provider that explicitly permits this exact external-reward model, plus a legitimate authorized PUBG UC supply and enough funds.
- The reward list is placeholder UI. Verify current PUBG packages, region eligibility, prices, and authorized fulfillment before enabling it.
- The admin panel is hidden unless Firebase Authentication returns the trusted custom claim `admin: true`. Never make a user admin based only on an email address in browser code.
- Admin review/fulfillment actions are intentionally not implemented in the browser. Implement them in a trusted backend (Cloud Functions/Admin SDK) after setting up secure role assignment and audit logging.

## Setup
1. Create a Firebase project at https://console.firebase.google.com/.
2. Add a Web App and copy its Firebase config.
3. In `app.js`, replace `YOUR_API_KEY`, `YOUR_PROJECT`, `YOUR_PROJECT_ID`, and `YOUR_APP_ID` with your real project values.
4. In Firebase Authentication, enable **Email/Password**. Optionally configure your authorized email templates and domain.
5. Create a Firestore database and publish `firestore.rules`.
6. Deploy the folder to Firebase Hosting or another HTTPS static host.
7. Test sign-up, email verification, login, logout, and redemption request submission with test accounts.
8. For admin access, use a trusted server-side Firebase Admin SDK process to set the custom claim `{ admin: true }` on the verified account UID for `Youssefelhosany28@gmail.com`. First verify ownership of that email and obtain the UID from Firebase Authentication. Never put a service-account key in this website.

## Deploy to Firebase Hosting
Install Firebase CLI, run `firebase login`, then from this folder:
- `firebase init hosting` (choose this folder as public directory; configure as single-page app if prompted)
- `firebase deploy`

## Before launch checklist
- Choose a compliant monetization provider and get written confirmation that the exact rewards and redemption flow are permitted.
- Secure an authorized PUBG UC fulfillment route and document costs/regions/terms.
- Build backend-only coin ledger, earning verification, redemption pricing, rate limits, fraud checks, admin approval/fulfillment, and immutable audit logs.
- Add privacy policy, terms, support contact, age/data handling review, and abuse reporting.
- Do not collect Gmail passwords, PUBG passwords, or unnecessary personal data.
