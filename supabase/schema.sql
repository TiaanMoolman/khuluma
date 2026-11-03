-- Khuluma AAC: accounts, child profiles, therapist/parent access and synced boards.
-- Paste this whole file into Supabase › SQL Editor › New query, then press Run. It is safe to run again.

-- ---------- tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role text not null default 'parent' check (role in ('therapist','parent')),
  profession text,
  hpcsa text,
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_by uuid not null default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- who may open a child's board: lead therapist, other therapists, parents/guardians
create table if not exists public.child_members (
  child_id uuid not null references public.children on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('lead','therapist','parent')),
  consented_at timestamptz,
  added_at timestamptz not null default now(),
  primary key (child_id, user_id)
);

create table if not exists public.invites (
  token uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children on delete cascade,
  email text not null,
  role text not null check (role in ('therapist','parent')),
  created_by uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_by uuid references auth.users on delete set null,
  accepted_at timestamptz
);

-- one board per child. settings/ov/scenes are the therapist's setup; custom (personal words) and log are shared with parents
create table if not exists public.boards (
  child_id uuid primary key references public.children on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  ov jsonb not null default '{}'::jsonb,
  scenes jsonb not null default '[]'::jsonb,
  custom jsonb not null default '[]'::jsonb,
  log jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- ---------- helpers (security definer so policies can use them without recursion) ----------
create or replace function public.member_role(cid uuid) returns text
language sql stable security definer set search_path = public as
$$ select role from public.child_members where child_id = cid and user_id = auth.uid() $$;

create or replace function public.is_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.child_members where child_id = cid and user_id = auth.uid()) $$;

create or replace function public.is_therapist(cid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.child_members where child_id = cid and user_id = auth.uid() and role in ('lead','therapist')) $$;

create or replace function public.is_lead(cid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.child_members where child_id = cid and user_id = auth.uid() and role = 'lead') $$;

create or replace function public.shares_child(other uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.child_members a join public.child_members b using (child_id)
                 where a.user_id = auth.uid() and b.user_id = other) $$;

-- ---------- triggers ----------
-- a profile is made from the sign-up form
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, profession, hpcsa)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name',''),
          case when new.raw_user_meta_data->>'role' = 'therapist' then 'therapist' else 'parent' end,
          nullif(new.raw_user_meta_data->>'profession',''),
          nullif(new.raw_user_meta_data->>'hpcsa',''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- the therapist who adds a child becomes the lead therapist, and the child gets an empty board
create or replace function public.handle_new_child() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.child_members (child_id, user_id, role) values (new.id, new.created_by, 'lead');
  insert into public.boards (child_id, updated_by) values (new.id, new.created_by);
  return new;
end $$;
drop trigger if exists on_child_created on public.children;
create trigger on_child_created after insert on public.children
  for each row execute function public.handle_new_child();

-- parents may change personal words and the usage log only; the therapist's setup is protected
create or replace function public.guard_board() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_therapist(new.child_id) then
    if new.settings is distinct from old.settings or new.ov is distinct from old.ov or new.scenes is distinct from old.scenes then
      raise exception 'Only the child''s therapist can change the board setup' using errcode = '42501';
    end if;
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
drop trigger if exists guard_board on public.boards;
create trigger guard_board before update on public.boards
  for each row execute function public.guard_board();

-- a child always keeps a lead therapist
create or replace function public.guard_members() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'lead' and not exists(select 1 from public.child_members
       where child_id = old.child_id and role = 'lead' and user_id <> old.user_id) then
    if tg_op = 'DELETE' and not exists(select 1 from public.children where id = old.child_id) then return old; end if;
    if tg_op = 'DELETE' or new.role <> 'lead' then
      raise exception 'Make another therapist the lead first' using errcode = '42501';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
drop trigger if exists guard_members on public.child_members;
create trigger guard_members before update or delete on public.child_members
  for each row execute function public.guard_members();

-- ---------- invites ----------
-- what an invite link is for, shown before the person signs in
create or replace function public.peek_invite(t uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'child', c.display_name, 'role', i.role, 'email', i.email,
    'from', coalesce(nullif(p.full_name,''),'Your therapist'),
    'valid', i.accepted_at is null and i.expires_at > now())
  from public.invites i join public.children c on c.id = i.child_id
  left join public.profiles p on p.id = i.created_by
  where i.token = t $$;

create or replace function public.accept_invite(t uuid, consent boolean default false) returns uuid
language plpgsql security definer set search_path = public as $$
declare i public.invites; em text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if auth.uid() is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into i from public.invites where token = t for update;
  if not found then raise exception 'This invite link is not valid'; end if;
  if i.accepted_at is not null then
    if i.accepted_by = auth.uid() then return i.child_id; end if;
    raise exception 'This invite has already been used';
  end if;
  if i.expires_at < now() then raise exception 'This invite has expired. Ask the therapist for a new link.'; end if;
  if lower(i.email) <> em then raise exception 'This invite was sent to %. Sign in with that email address.', i.email; end if;
  if i.role = 'parent' and not consent then raise exception 'Please give consent first'; end if;
  insert into public.child_members (child_id, user_id, role, consented_at)
    values (i.child_id, auth.uid(), i.role, case when consent then now() end)
    on conflict (child_id, user_id) do update set consented_at = coalesce(public.child_members.consented_at, excluded.consented_at);
  update public.invites set accepted_by = auth.uid(), accepted_at = now() where token = t;
  return i.child_id;
end $$;

-- people on a child's team (names and roles only)
create or replace function public.child_team(cid uuid) returns table(user_id uuid, full_name text, role text, profession text, added_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, coalesce(nullif(p.full_name,''),'(no name)'), m.role, p.profession, m.added_at
  from public.child_members m left join public.profiles p on p.id = m.user_id
  where m.child_id = cid and public.is_member(cid)
  order by case m.role when 'lead' then 0 when 'therapist' then 1 else 2 end, p.full_name $$;

-- the lead therapist hands over the lead role
create or replace function public.make_lead(cid uuid, uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_lead(cid) then raise exception 'Only the lead therapist can do this' using errcode = '42501'; end if;
  if not exists(select 1 from public.child_members m join public.profiles p on p.id = m.user_id
                where m.child_id = cid and m.user_id = uid and p.role = 'therapist') then
    raise exception 'Only a therapist on this child''s team can be the lead'; end if;
  update public.child_members set role = 'lead' where child_id = cid and user_id = uid;
  update public.child_members set role = 'therapist' where child_id = cid and user_id = auth.uid();
end $$;

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.child_members enable row level security;
alter table public.invites enable row level security;
alter table public.boards enable row level security;

drop policy if exists "own or team profile" on public.profiles;
create policy "own or team profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_child(id));
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "members see child" on public.children;
create policy "members see child" on public.children for select to authenticated
  using (public.is_member(id) or created_by = auth.uid());
drop policy if exists "therapists add children" on public.children;
create policy "therapists add children" on public.children for insert to authenticated
  with check (created_by = auth.uid() and exists(select 1 from public.profiles where id = auth.uid() and role = 'therapist'));
drop policy if exists "therapists rename child" on public.children;
create policy "therapists rename child" on public.children for update to authenticated
  using (public.is_therapist(id)) with check (public.is_therapist(id));
drop policy if exists "lead removes child" on public.children;
create policy "lead removes child" on public.children for delete to authenticated
  using (public.is_lead(id));

drop policy if exists "members see team" on public.child_members;
create policy "members see team" on public.child_members for select to authenticated
  using (public.is_member(child_id));
drop policy if exists "lead removes, anyone leaves" on public.child_members;
create policy "lead removes, anyone leaves" on public.child_members for delete to authenticated
  using (public.is_lead(child_id) or user_id = auth.uid());

drop policy if exists "therapists see invites" on public.invites;
create policy "therapists see invites" on public.invites for select to authenticated
  using (public.is_therapist(child_id));
drop policy if exists "therapists invite" on public.invites;
create policy "therapists invite" on public.invites for insert to authenticated
  with check (created_by = auth.uid() and public.is_therapist(child_id));
drop policy if exists "therapists cancel invites" on public.invites;
create policy "therapists cancel invites" on public.invites for delete to authenticated
  using (public.is_therapist(child_id));

drop policy if exists "members read board" on public.boards;
create policy "members read board" on public.boards for select to authenticated
  using (public.is_member(child_id));
drop policy if exists "members update board" on public.boards;
create policy "members update board" on public.boards for update to authenticated
  using (public.is_member(child_id)) with check (public.is_member(child_id));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.peek_invite(uuid) to anon, authenticated;
grant execute on function public.accept_invite(uuid, boolean), public.child_team(uuid), public.make_lead(uuid, uuid) to authenticated;

-- ---------- photos and recordings ----------
-- private bucket; files live under <child id>/<file key>
insert into storage.buckets (id, name, public) values ('media','media',false) on conflict (id) do nothing;

drop policy if exists "members read media" on storage.objects;
create policy "members read media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "members add media" on storage.objects;
create policy "members add media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "members replace media" on storage.objects;
create policy "members replace media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "therapists delete media" on storage.objects;
create policy "therapists delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_therapist(((storage.foldername(name))[1])::uuid));
