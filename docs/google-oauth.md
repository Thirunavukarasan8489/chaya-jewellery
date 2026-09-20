# Google sign-in

The app keeps its existing NextAuth **4.24.15** configuration in
`lib/authOptions.ts`, App Router handler at `app/api/auth/[...nextauth]/route.ts`,
JWT sessions, and Mongoose `User` / `Customer` models. No additional auth
library or adapter is needed. The v5 `auth.ts` / `handlers` examples do not
apply to the installed version.

## Local configuration

Set these server-only values in the ignored `.env.local`:

```dotenv
GOOGLE_CLIENT_ID=<Google Web application client ID>
GOOGLE_CLIENT_SECRET=<Google client secret>
AUTH_SECRET=<random secret of at least 32 characters>
NEXTAUTH_URL=http://localhost:3000
```

Generate a new secret, when needed, with `openssl rand -base64 32` or
`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.
Keep it stable across restarts and instances. Rotating it signs everyone out.
`AUTH_SECRET` is used explicitly by both NextAuth and `proxy.ts`;
`NEXTAUTH_SECRET` is no longer read by application auth configuration.
An existing installation can copy its current random `NEXTAUTH_SECRET` into
`AUTH_SECRET` to keep existing sessions valid. Missing OAuth variables, or a
missing/short secret, fail with a message naming the variable, never its value.

In the [Google Auth Platform console](https://console.cloud.google.com/auth/clients):

1. Select the project owning the configured client ID, or create one.
2. Configure Branding and Audience (app name, support email, consent screen).
   For an external app in Testing, add each intended Google account as a test user.
3. Create or edit an OAuth client with type **Web application**.
4. Add the exact authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google`.
5. If configuring an authorized JavaScript origin, use `http://localhost:3000`.
   This integration uses a server redirect rather than a browser Google SDK.

Restart `npm run dev` after changing environment variables. Keep port 3000
available; another port requires a matching URL and Google redirect URI.
See the official [NextAuth Google provider documentation](https://next-auth.js.org/providers/google)
and [Google web-server OAuth setup](https://developers.google.com/identity/protocols/oauth2/web-server).

## Behavior

- `/login` and `/register` offer Google alongside existing email/password login.
- Successful login defaults to `/cart`. `/dashboard` and `/account/dashboard`
  both render the existing protected customer dashboard.
- A safe local `callbackUrl` returns customers to checkout or other account pages.
  External and protocol-relative destinations are rejected.
- The dashboard is protected in the proxy and by server session checks.
  Its account sidebar displays name, email, and profile photo when available.
- Sign Out clears the NextAuth session and returns to `/login`.
- Sessions last 24 hours and survive refresh. OAuth state, PKCE, CSRF and
  encrypted session cookies are handled by NextAuth.
- Google sign-in requires a verified email. Existing customer accounts keep
  their MongoDB IDs, passwords, addresses and order relationships. Inactive
  accounts, conflicting Google identities, and profiles owned by another
  user are rejected. User/customer writes share a MongoDB transaction (the
  existing Atlas deployment supports transactions).
- Automatic email linking is limited to Gmail and Google Workspace, where
  [Google verifies current email ownership](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
  Existing password accounts using other email providers must continue using
  their password unless a Google identity was already linked.
- Google sign-in is for customers. Staff continue using `/admin/login` with
  credentials; matching a staff email does not enable Google admin access.
- Only profile fields, MongoDB user ID and role reach the session. OAuth access
  tokens, refresh tokens and environment secrets are not exposed to the browser.

## Production

Confirm the real production domain before configuring or deploying. In the
hosting environment, set the same four variable names above using production
credentials and an independent random secret. Set
`NEXTAUTH_URL=https://<actual-production-domain>` and register exactly
`https://<actual-production-domain>/api/auth/callback/google` on that Google
Web application client. Keep HTTPS enabled and finish Google's consent-screen
publishing/verification requirements if applicable. Preview deployments need
their own explicitly registered callback URLs.

## Verification

```sh
node --test tests/auth.test.cjs
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

In a browser:

1. Signed out, open `/dashboard`: expect `/login`.
2. Select Continue with Google, complete consent, and expect `/cart`.
3. Open `/dashboard`. Check name, email, photo, and that only this customer's orders appear.
4. Refresh: session and profile must remain available.
5. Sign Out: expect `/login`; revisiting `/dashboard` must require login again.
6. Visit `/checkout` signed out and sign in: expect a return to checkout.
7. Cancel Google consent: expect a safe error message on `/login` and retry.
8. Verify existing customer and admin credential logins still work.

Repeat the browser checks after deployment. Unit/HTTP checks cannot substitute
for signing into Google with a real test account or verify Cloud Console settings.
