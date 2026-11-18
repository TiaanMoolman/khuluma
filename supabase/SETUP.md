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

## Limiting each login to 2 devices
Run `supabase/devices.sql` in the SQL Editor, after `schema.sql`. Each login then works on at most 2 devices at a time.
- On a third device, Khuluma asks the person to sign out one of the other devices first.
- Until then, that device can't see any child data. The database blocks it, not just the app.
- Swapping devices is limited to 3 times per 30 days.
- Everyone sees their devices under **Account › Your devices**.
- To change the numbers, go to **Table editor › app_limits** (`max_devices`, `max_device_swaps_30d`).
- If someone is stuck, delete their rows in **Table editor › devices**.

## Subscriptions, free trial and therapist approval
Run `supabase/billing.sql` in the SQL Editor, after `devices.sql`.

**Plans** (change prices in **Table editor › plans**, in cents):
- Monthly: R149.
- Yearly: R1,490 (2 months free).
- Lifetime: R3,999 once-off.

**Licences:**
- Each child needs their own licence, which the family pays for.
- Families choose their plan when they sign up and get a 7-day free trial (once per parent account). The chosen plan starts after the trial; they can change it during the trial. Automatic charging at the end of the trial needs card payments (PayFast or Paystack) to be connected.
- After the subscription ends there are 7 days' grace. After that only the emergency words stay open (yes, no, help, stop, toilet, hungry, thirsty, tired, it hurts, I feel sick, Mom, more) and "Where it hurts" until the plan is renewed. A child is never left without a voice.

**Parents** can sign up on their own ("I'm a parent: start a free trial") and add their child. Without a therapist, the parent sets up the whole board and can invite a therapist later. The first therapist who joins becomes the lead.

**Therapists:**
- Accounts are free.
- A therapist gives their HPCSA number when signing up and can't add children until an admin approves them. Each HPCSA number can be used for one account only.
- Therapists use a child's board in 60-minute sessions. A banner says "Therapist session", and a new session starts with one tap.
- A child's everyday use at home always needs the family's own licence.

**Admin** (the account with `is_admin` in profiles; billing.sql sets physiotiaan@gmail.com):
- Go to **Account › Admin**.
- Approve or reject therapists. Use the iRegister link to check their HPCSA number.
- Record payments: EFT requests appear there and are switched on with **Mark paid**. You can also record any plan manually or cancel one.
- Set your bank details for EFT in **Table editor › app_settings › eft_details**.

**Card payments:** once you have a PayFast or Paystack merchant account, add `"payUrl"` to `src/config.json`. The payment provider's notification then calls `admin_record_payment` through a Supabase Edge Function. This part is still to be built.
