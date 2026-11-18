-- Khuluma AAC: subscriptions per child, 14-day trial, parent accounts, therapist approval (HPCSA) and admin tools.
-- Paste into Supabase › SQL Editor › New query and press Run, after schema.sql and devices.sql. Safe to run again.
-- Prices live in the plans table (in cents): change them there.

-- ---------- plans ----------
create table if not exists public.plans (
  id text primary key, name text not null, price_cents int not null, period text not null check (period in ('month','year','lifetime')),
  months int, active boolean not null default true, sort int not null default 0);
insert into public.plans values
  ('family_month','Monthly',14900,'month',1,true,1),
  ('family_year','Yearly (2 months free)',149000,'year',12,true,2),
  ('family_life','Lifetime (once-off)',399900,'lifetime',null,true,3)
on conflict (id) do nothing;
alter table public.plans enable row level security;
drop policy if exists "anyone reads plans" on public.plans;
create policy "anyone reads plans" on public.plans for select to anon, authenticated using (active);

create table if not exists public.app_settings (key text primary key, value text);
insert into public.app_settings values ('trial_days','7'),('grace_days','7'),
  ('eft_details','Pay by EFT and use your child’s name as reference. Bank details: ask Khuluma support.')
on conflict (key) do nothing;
alter table public.app_settings enable row level security;
drop policy if exists "read settings" on public.app_settings;
create policy "read settings" on public.app_settings for select to authenticated using (true);

-- ---------- profiles: admin, therapist approval, one trial per parent ----------
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists approved boolean not null default false;
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists rejected boolean not null default false;
alter table public.profiles add column if not exists trial_used boolean not null default false;
-- therapists who already use Khuluma stay approved
update public.profiles set approved = true, approved_at = coalesce(approved_at, now())
  where role = 'therapist' and not approved and approved_at is null and not rejected
  and exists (select 1 from public.child_members m where m.user_id = profiles.id);
do $$ begin
  create unique index profiles_one_hpcsa on public.profiles (upper(replace(hpcsa,' ',''))) where role = 'therapist' and hpcsa is not null and not rejected;
exception when others then raise notice 'Two therapists share an HPCSA number: fix them in Table editor › profiles, then run this again.'; end $$;

-- profiles may only change their own name; roles, approval and admin are set here or by an admin
drop policy if exists "update own profile" on public.profiles;
create or replace function public.set_my_name(n text) returns void language sql security definer set search_path = public as
$$ update public.profiles set full_name = left(trim(n),80) where id = auth.uid() $$;
grant execute on function public.set_my_name(text) to authenticated;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

-- ---------- licences: one per child ----------
create table if not exists public.licences (
  child_id uuid primary key references public.children on delete cascade,
  status text not null default 'none' check (status in ('none','trial','active','lifetime','cancelled')),
  plan_id text references public.plans,
  trial_ends timestamptz,
  paid_until timestamptz,
  paid_by uuid references auth.users on delete set null,
  provider text, provider_ref text,
  updated_at timestamptz not null default now());
alter table public.licences enable row level security;
drop policy if exists "members see licence" on public.licences;
create policy "members see licence" on public.licences for select to authenticated using (public.is_member(child_id) or public.is_admin());

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), child_id uuid references public.children on delete set null,
  plan_id text, amount_cents int, method text, reference text, recorded_by uuid, created_at timestamptz not null default now());
alter table public.payments enable row level security;
drop policy if exists "admin sees payments" on public.payments;
create policy "admin sees payments" on public.payments for select to authenticated using (public.is_admin());

-- a family asks for a plan (EFT until card payments are switched on)
create table if not exists public.plan_requests (
  id uuid primary key default gen_random_uuid(), child_id uuid not null references public.children on delete cascade,
  plan_id text not null references public.plans, reference text, requested_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(), handled_at timestamptz);
alter table public.plan_requests enable row level security;
drop policy if exists "admin sees requests" on public.plan_requests;
create policy "admin sees requests" on public.plan_requests for select to authenticated using (public.is_admin());

-- status a child's board is in right now: trial | active | lifetime | grace | expired | none
create or replace function public.licence_state(cid uuid) returns json language sql stable security definer set search_path = public as $$
  with l as (select * from public.licences where child_id = cid),
       g as (select coalesce((select value::int from public.app_settings where key='grace_days'),7) d)
  select case
    when not exists(select 1 from l) then json_build_object('state','none')
    else (select json_build_object(
      'state', case
         when l.status = 'lifetime' then 'lifetime'
         when l.paid_until > now() then 'active'
         when l.status = 'trial' and l.trial_ends > now() then 'trial'
         when greatest(coalesce(l.paid_until,'-infinity'), coalesce(l.trial_ends,'-infinity')) + make_interval(days => (select d from g)) > now() then 'grace'
         when l.status = 'none' then 'none'
         else 'expired' end,
      'ends', case when l.status='lifetime' then null when l.paid_until > coalesce(l.trial_ends,'-infinity') then l.paid_until else l.trial_ends end,
      'plan', l.plan_id) from l) end $$;

-- ---------- children: parents may add their own child; therapists must be approved ----------
create or replace function public.can_setup(cid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_therapist(cid) or (public.is_member(cid)
    and not exists(select 1 from public.child_members where child_id = cid and role in ('lead','therapist'))) $$;

drop policy if exists "therapists add children" on public.children;
drop policy if exists "approved therapists and parents add children" on public.children;
create policy "approved therapists and parents add children" on public.children for insert to authenticated
  with check (created_by = auth.uid() and public.this_device_ok() and exists(select 1 from public.profiles p where p.id = auth.uid()
    and ((p.role = 'therapist' and p.approved) or p.role = 'parent')));
drop policy if exists "therapists rename child" on public.children;
drop policy if exists "set-up team renames child" on public.children;
create policy "set-up team renames child" on public.children for update to authenticated using (public.can_setup(id)) with check (public.can_setup(id));

create or replace function public.handle_new_child() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := (select role from public.profiles where id = new.created_by);
begin
  insert into public.child_members (child_id, user_id, role, consented_at)
    values (new.id, new.created_by, case when r = 'therapist' then 'lead' else 'parent' end, case when r = 'therapist' then null else now() end);
  insert into public.boards (child_id, updated_by) values (new.id, new.created_by);
  insert into public.licences (child_id) values (new.id) on conflict do nothing;
  return new;
end $$;
insert into public.licences (child_id) select id from public.children on conflict do nothing;

-- the board's setup is changed by the therapist, or by the parent when the child has no therapist
create or replace function public.guard_board() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.can_setup(new.child_id) then
    if new.settings is distinct from old.settings or new.ov is distinct from old.ov or new.scenes is distinct from old.scenes then
      raise exception 'Only the child''s therapist can change the board setup' using errcode = '42501';
    end if;
  end if;
  new.version := old.version + 1; new.updated_at := now(); new.updated_by := auth.uid();
  return new;
end $$;

-- parents of a child without a therapist may invite one; the first therapist to join becomes the lead
drop policy if exists "therapists invite" on public.invites;
drop policy if exists "set-up team invites" on public.invites;
create policy "set-up team invites" on public.invites for insert to authenticated
  with check (created_by = auth.uid() and public.can_setup(child_id));
drop policy if exists "therapists see invites" on public.invites;
drop policy if exists "set-up team sees invites" on public.invites;
create policy "set-up team sees invites" on public.invites for select to authenticated using (public.can_setup(child_id));
drop policy if exists "therapists cancel invites" on public.invites;
drop policy if exists "set-up team cancels invites" on public.invites;
create policy "set-up team cancels invites" on public.invites for delete to authenticated using (public.can_setup(child_id));

create or replace function public.accept_invite(t uuid, consent boolean default false) returns uuid
language plpgsql security definer set search_path = public as $$
declare i public.invites; em text := lower(coalesce(auth.jwt()->>'email','')); r text;
begin
  if auth.uid() is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into i from public.invites where token = t for update;
  if not found then raise exception 'This invite link is not valid'; end if;
  if i.accepted_at is not null then
    if i.accepted_by = auth.uid() then return i.child_id; end if;
    raise exception 'This invite has already been used';
  end if;
  if i.expires_at < now() then raise exception 'This invite has expired. Ask for a new link.'; end if;
  if lower(i.email) <> em then raise exception 'This invite was sent to %. Sign in with that email address.', i.email; end if;
  if i.role = 'parent' and not consent then raise exception 'Please give consent first'; end if;
  if i.role = 'therapist' and not exists(select 1 from public.profiles where id = auth.uid() and role = 'therapist' and approved) then
    raise exception 'Your therapist account must be approved first (HPCSA check). You will get access as soon as it is approved.';
  end if;
  r := case when i.role = 'therapist' then
         case when exists(select 1 from public.child_members where child_id = i.child_id and role = 'lead') then 'therapist' else 'lead' end
       else 'parent' end;
  insert into public.child_members (child_id, user_id, role, consented_at)
    values (i.child_id, auth.uid(), r, case when consent then now() end)
    on conflict (child_id, user_id) do update set consented_at = coalesce(public.child_members.consented_at, excluded.consented_at);
  update public.invites set accepted_by = auth.uid(), accepted_at = now() where token = t;
  return i.child_id;
end $$;

-- ---------- what the app needs about the signed-in person ----------
create or replace function public.my_account() returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'profile', (select json_build_object('full_name',p.full_name,'role',p.role,'profession',p.profession,'hpcsa',p.hpcsa,
       'approved',p.approved,'rejected',p.rejected,'is_admin',p.is_admin,'trial_used',p.trial_used) from public.profiles p where p.id = auth.uid()),
    'trial_days', (select value::int from public.app_settings where key='trial_days'),
    'eft', (select value from public.app_settings where key='eft_details'),
    'plans', (select json_agg(json_build_object('id',id,'name',name,'price_cents',price_cents,'period',period) order by sort) from public.plans where active),
    'children', coalesce((select json_agg(json_build_object('id',c.id,'name',c.display_name,'role',m.role,
        'has_therapist', exists(select 1 from public.child_members x where x.child_id=c.id and x.role in ('lead','therapist')),
        'licence', public.licence_state(c.id)) order by c.display_name)
      from public.child_members m join public.children c on c.id = m.child_id
      where m.user_id = auth.uid() and public.this_device_ok()), '[]'::json)) $$;

-- a parent starts the free trial for a child (one trial per parent account)
drop function if exists public.start_trial(uuid);
create or replace function public.start_trial(cid uuid, plan text default 'family_month') returns json language plpgsql security definer set search_path = public as $$
declare d int := coalesce((select value::int from public.app_settings where key='trial_days'),7);
begin
  if not exists(select 1 from public.child_members where child_id = cid and user_id = auth.uid() and role = 'parent') or not public.this_device_ok() then
    raise exception 'Only the child''s parent can start the free trial' using errcode = '42501'; end if;
  if (select trial_used from public.profiles where id = auth.uid()) then
    raise exception 'The free trial has already been used on this account. Choose a plan to continue.'; end if;
  if exists(select 1 from public.licences where child_id = cid and (trial_ends is not null or status in ('active','lifetime'))) then
    raise exception 'This child already had a trial or has a plan.'; end if;
  if not exists(select 1 from public.plans where id = plan and active) then raise exception 'Unknown plan'; end if;
  insert into public.licences (child_id, status, trial_ends, plan_id) values (cid, 'trial', now() + make_interval(days => d), plan)
    on conflict (child_id) do update set status = 'trial', trial_ends = now() + make_interval(days => d), plan_id = plan, updated_at = now();
  update public.profiles set trial_used = true where id = auth.uid();
  return public.licence_state(cid);
end $$;

create or replace function public.request_plan(cid uuid, plan text, ref text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member(cid) then raise exception 'Not your child''s board' using errcode = '42501'; end if;
  if not exists(select 1 from public.plans where id = plan and active) then raise exception 'Unknown plan'; end if;
  delete from public.plan_requests where child_id = cid and handled_at is null;
  insert into public.plan_requests (child_id, plan_id, reference, requested_by) values (cid, plan, left(ref,40), auth.uid());
end $$;
grant execute on function public.request_plan(uuid, text, text) to authenticated;

-- the family picks or changes the plan that starts after the trial (charged automatically once card payments are connected)
create or replace function public.choose_plan(cid uuid, plan text) returns json language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from public.child_members where child_id = cid and user_id = auth.uid() and role = 'parent') then
    raise exception 'Only the child''s parent can choose the plan' using errcode = '42501'; end if;
  if not exists(select 1 from public.plans where id = plan and active) then raise exception 'Unknown plan'; end if;
  update public.licences set plan_id = plan, updated_at = now() where child_id = cid and status in ('none','trial');
  return public.licence_state(cid);
end $$;
grant execute on function public.choose_plan(uuid, text) to authenticated;

-- ---------- admin ----------
create or replace function public.admin_overview() returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return json_build_object(
    'pending', coalesce((select json_agg(json_build_object('id',p.id,'name',p.full_name,'profession',p.profession,'hpcsa',p.hpcsa,
         'email',u.email,'created_at',p.created_at) order by p.created_at)
       from public.profiles p join auth.users u on u.id = p.id where p.role='therapist' and not p.approved and not p.rejected), '[]'::json),
    'requests', coalesce((select json_agg(json_build_object('child_id',q.child_id,'child',c.display_name,'plan_id',q.plan_id,'plan_name',p.name,
         'price_cents',p.price_cents,'reference',q.reference,'email',u.email,'created_at',q.created_at) order by q.created_at)
       from public.plan_requests q join public.children c on c.id=q.child_id join public.plans p on p.id=q.plan_id
       left join auth.users u on u.id=q.requested_by where q.handled_at is null), '[]'::json),
    'children', coalesce((select json_agg(json_build_object('id',c.id,'name',c.display_name,'created_at',c.created_at,
         'licence', public.licence_state(c.id),
         'parents', (select string_agg(u.email, ', ') from public.child_members m join auth.users u on u.id=m.user_id where m.child_id=c.id and m.role='parent'),
         'therapist', (select string_agg(coalesce(nullif(p.full_name,''),u.email), ', ') from public.child_members m join auth.users u on u.id=m.user_id
                        left join public.profiles p on p.id=m.user_id where m.child_id=c.id and m.role in ('lead','therapist')))
       order by c.created_at desc) from public.children c), '[]'::json));
end $$;

create or replace function public.admin_review_therapist(uid uuid, approve boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  update public.profiles set approved = approve, rejected = not approve, approved_at = case when approve then now() end where id = uid and role = 'therapist';
end $$;

-- record a payment (EFT, card, or later the payment provider) and extend the child's plan
create or replace function public.admin_record_payment(cid uuid, plan text, method text default 'EFT', ref text default null) returns json
language plpgsql security definer set search_path = public as $$
declare p public.plans; l public.licences; base timestamptz;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  select * into p from public.plans where id = plan; if not found then raise exception 'Unknown plan'; end if;
  select * into l from public.licences where child_id = cid;
  base := greatest(now(), coalesce(l.paid_until, now()));
  insert into public.licences (child_id) values (cid) on conflict do nothing;
  update public.licences set plan_id = plan, provider = method, provider_ref = ref, updated_at = now(),
    status = case when p.period = 'lifetime' then 'lifetime' else 'active' end,
    paid_until = case when p.period = 'lifetime' then null else base + make_interval(months => p.months) end
    where child_id = cid;
  insert into public.payments (child_id, plan_id, amount_cents, method, reference, recorded_by) values (cid, plan, p.price_cents, method, ref, auth.uid());
  update public.plan_requests set handled_at = now() where child_id = cid and handled_at is null;
  return public.licence_state(cid);
end $$;

create or replace function public.admin_cancel(cid uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  update public.licences set status = 'cancelled', paid_until = least(paid_until, now()), updated_at = now() where child_id = cid;
end $$;

grant execute on function public.my_account(), public.start_trial(uuid, text), public.licence_state(uuid), public.can_setup(uuid), public.is_admin(),
  public.admin_overview(), public.admin_review_therapist(uuid, boolean), public.admin_record_payment(uuid, text, text, text), public.admin_cancel(uuid)
  to authenticated;
revoke insert, update, delete on public.licences, public.payments, public.plans, public.app_settings from authenticated, anon;

-- ---------- make yourself the admin (change the email if needed) ----------
update public.profiles set is_admin = true, approved = true, approved_at = coalesce(approved_at, now())
  where id in (select id from auth.users where lower(email) = 'physiotiaan@gmail.com');
