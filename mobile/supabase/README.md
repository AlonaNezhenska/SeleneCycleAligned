# Turning on online backup

Selena works fully without this. These steps switch on the optional
sign-in and backup.

1. Create a free project at https://supabase.com (choose an EU region if
   your users are in Europe).
2. In the dashboard, open **SQL Editor → New query**, paste
   `migrations/0001_selena_backups.sql` and press **Run**.
3. Open **Authentication → Email Templates → Magic Link** and make sure the
   email shows the one-time code: include `{{ .Token }}` in the message.
4. Open **Project Settings → API** and copy the project URL and the
   publishable (anon) key into `mobile/.env.local`, using `.env.example`
   as the template.
5. Restart the app: `npx expo start --clear`.

The app never receives a database password or service-role key, and the
baseline photo is never uploaded.
