# Connecting Supabase (accounts + credits) — 10-minute setup

PixelProbe works out of the box in **open mode** (no login, unlimited scans). To
turn on accounts, Google login and the credit system you just need a free
Supabase project. Follow these steps in order.

> **Security in one line:** the browser only ever gets the *public* anon key and
> can only *read* its own credit balance. Credits are spent by the server using a
> secret key through a locked-down database function, so **no user can give
> themselves credits or edit anyone else's**. Details at the bottom.

---

## 1. Create a Supabase project
1. Go to <https://supabase.com> → sign in → **New project**.
2. Pick a name, a strong database password, and a region close to you.
3. Wait ~2 minutes for it to provision.

## 2. Create the database tables
1. In the project, open **SQL Editor** (left sidebar) → **New query**.
2. Open the file `supabase/schema.sql` from this project, copy **all** of it,
   paste it into the editor, and click **Run**.
3. You should see "Success. No rows returned." This creates the `profiles`
   table, the security rules, the signup trigger, and the credit functions.

## 3. Copy your API keys
1. Go to **Project Settings → API**.
2. Copy these three values:
   - **Project URL** → goes into `VITE_SUPABASE_URL`
   - **`anon` `public` key** → goes into `VITE_SUPABASE_ANON_KEY`
   - **`service_role` `secret` key** → goes into `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ This one is a secret. Never commit it or put it in `VITE_…` (those are
     visible in the browser).

## 4. Fill in your `.env`
Copy `.env.example` to `.env` and paste the values:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...   # the anon/public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # the service_role secret key

SIGNUP_CREDITS=25
SCAN_COST=5
FREE_ANON_SCANS=1
AUTH_COOKIE_SECRET=put-any-long-random-string-here
```

Then restart the app (`npm run dev`). The navbar will now show **Sign in /
Get started** and a credit counter once logged in.

## 5. Enable email login
Already on by default. In **Authentication → Providers → Email** you can decide
whether to require email confirmation. For local testing you can turn
confirmation **off** so signups log in immediately.

## 6. Enable Google login (optional)
1. In Google Cloud Console (<https://console.cloud.google.com>): **APIs &
   Services → Credentials → Create credentials → OAuth client ID** → type
   **Web application**.
2. Under **Authorized redirect URIs** add the callback Supabase shows you in the
   next step — it looks like:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. Copy the generated **Client ID** and **Client secret**.
4. In Supabase: **Authentication → Providers → Google** → toggle **Enabled**,
   paste the Client ID + secret, **Save**.
5. In Supabase: **Authentication → URL Configuration** → set **Site URL** to
   where you run the app (e.g. `http://localhost:5173` in dev, or your real
   domain in production). Add any extra URLs under **Redirect URLs**.

That's it — the **Continue with Google** button now works.

---

## How the credits stay secure (why nobody can cheat)
- The browser uses the **anon key**. Row-Level Security on `profiles` allows a
  user to **SELECT only their own row** — and there are **no** insert/update/
  delete policies, so the browser can never change `credits`.
- The server holds the **service_role key**. Before each scan it verifies the
  user's login token, then spends credits by calling the database function
  `consume_credits()`, which deducts atomically and refuses if the balance is
  too low. That function is **revoked** from browser roles — only the server can
  call it.
- Anonymous free scans are tracked with a server-signed, HttpOnly cookie. It's
  only a trial gate (clearing cookies just resets the free allowance); the real
  credit balance always lives in the database.
- If a scan fails after credits were charged, the server **refunds** them.

So even if someone inspects the page or calls the API directly, the worst they
can do is read their own balance — never increase it.
