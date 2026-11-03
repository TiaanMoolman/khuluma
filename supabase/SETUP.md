# Switching on therapist and parent logins

Khuluma uses Supabase for accounts, child profiles, synced boards, and the photos and recordings stored for each child. Setup takes about 10 minutes and the free plan is enough to start.

## 1. Create the Supabase project
1. Go to https://supabase.com and sign up. Signing in with GitHub is easiest.
2. Click **New project** and give it these settings:
   - **Name:** khuluma
   - **Database password:** generate one and store it safely.
   - **Region:** the closest available to South Africa. Supabase has no African region; *West EU (Ireland)* or *Central EU (Frankfurt)* are usual choices.
3. Wait until the project says it is ready.

## 2. Create the tables and access rules
1. In the project, open **SQL Editor** and click **New query**.
2. Paste the whole of `supabase/schema.sql` from this repository.
3. Click **Run**. It should finish with "Success. No rows returned".

## 3. Point sign-in emails at the website
1. Open **Authentication › URL Configuration**.
2. Set **Site URL** to `https://khuluma-phi.vercel.app`.
3. Under **Redirect URLs**, add `https://khuluma-phi.vercel.app/**`.
4. Optional: open **Authentication › Email Templates** and change the wording to Khuluma.
5. Leave **Confirm email** switched on, in Authentication › Providers › Email. New accounts then have to confirm their email address.

## 4. Send the keys
1. Open **Project Settings › API**.
2. Copy the **Project URL**, which looks like `https://abcdefgh.supabase.co`.
3. Copy the **anon / public** key. It is safe to put in the website: the access rules in `schema.sql` are what protect the data.
4. Never share the `service_role` key.

Put both into `src/config.json`:

```json
{ "supabaseUrl": "https://abcdefgh.supabase.co", "supabaseAnonKey": "eyJ…", "siteUrl": "https://khuluma-phi.vercel.app/" }
```

Then run `python3 src/build.py`, commit the change and push. Vercel redeploys automatically.

## How it works
- **Therapists** create an account on the sign-in screen. Use **Account › Add a child** to add a child (first name or nickname only). Whoever adds the child becomes the *lead therapist*.
- **Invites:** under **Team & invites**, enter the parent's email and create an invite link. Send the link by WhatsApp or email. Other therapists (OT, speech) are invited the same way, with the role *Therapist*. Each link works once and expires after 14 days.
- **Parents** open the link on the child's iPad, create a password, tick the consent box and accept. The iPad then stays signed in, works offline and syncs when it is online again.
- **What each role can do:**
  - Therapists set up everything: access, vision and CVI, vocabulary, buttons, scenes and voice.
  - Parents can add personal words, photos and recordings, and see Insights.
  - The database enforces this, not only the app.
- **Board usage:** the board records how it is used on the child's own device, and the therapy team sees this in **Insights**.

## POPIA notes
- Store as little as possible: Khuluma asks only for a child's first name or nickname. It stores no date of birth, diagnosis or ID number.
- Parents give consent when they accept the invite. Supabase records when they consented (`child_members.consented_at`).
- Data is hosted outside South Africa (the EU). Tell families this in your practice's privacy notice.
- When a family leaves therapy, the lead therapist can remove the parent from the team, or delete the child in Supabase › Table editor › children. Deleting a child removes the board and the team. Remove the photos and recordings under Storage › media › (child id).
- For many sign-ups, set up your own email sender under Authentication › SMTP Settings. The built-in sender only allows a few emails per hour.
