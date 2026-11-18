-- Khuluma AAC: each login may be used on at most 2 devices at a time.
-- Paste this whole file into Supabase › SQL Editor › New query and press Run (after schema.sql). Safe to run again.
-- A device is tied to the login session on it. A third device cannot see any child data until one of the
-- other devices is signed out from Account › Your devices. Swapping devices is limited to 3 times per 30 days.
-- To change the numbers: Table editor › app_limits (max_devices, max_device_swaps_30d).

create table if not exists public.app_limits (key text primary key, value int not null);
insert into public.app_limits values ('max_devices',2),('max_device_swaps_30d',3) on conflict (key) do nothing;

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  device_key text not null,
  name text not null default 'Device',
  session_id uuid,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique (user_id, device_key)
);
create table if not exists public.device_swaps (
  user_id uuid not null references auth.users on delete cascade,
  swapped_at timestamptz not null default now()
);

alter table public.app_limits enable row level security;
alter table public.devices enable row level security;
alter table public.device_swaps enable row level security;
drop policy if exists "own devices" on public.devices;
create policy "own devices" on public.devices for select to authenticated using (user_id = auth.uid());
drop policy if exists "read limits" on public.app_limits;
create policy "read limits" on public.app_limits for select to authenticated using (true);
revoke insert, update, delete on public.devices, public.device_swaps, public.app_limits from authenticated, anon;

create or replace function public.limit_of(k text) returns int
language sql stable security definer set search_path = public as
$$ select coalesce((select value from public.app_limits where key = k), case k when 'max_devices' then 2 else 3 end) $$;

-- true when the session making this request belongs to one of the user's registered devices
create or replace function public.this_device_ok() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.devices where user_id = auth.uid()
                 and session_id = nullif(auth.jwt()->>'session_id','')::uuid) $$;

create or replace function public.my_devices() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'max', public.limit_of('max_devices'),
    'swaps_left', greatest(0, public.limit_of('max_device_swaps_30d') -
        (select count(*) from public.device_swaps where user_id = auth.uid() and swapped_at > now() - interval '30 days')),
    'devices', coalesce((select json_agg(json_build_object('id',d.id,'name',d.name,'last_seen',d.last_seen,
        'this', d.session_id = nullif(auth.jwt()->>'session_id','')::uuid) order by d.created_at)
      from public.devices d where d.user_id = auth.uid()), '[]'::json)) $$;

-- called by the app right after signing in
create or replace function public.register_device(k text, n text) returns json
language plpgsql security definer set search_path = public as $$
declare sid uuid := nullif(auth.jwt()->>'session_id','')::uuid; cnt int;
begin
  if auth.uid() is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  update public.devices set session_id = sid, name = left(coalesce(nullif(n,''),'Device'),60), last_seen = now()
    where user_id = auth.uid() and device_key = k;
  if found then return json_build_object('ok', true); end if;
  select count(*) into cnt from public.devices where user_id = auth.uid();
  if cnt >= public.limit_of('max_devices') then
    return (jsonb_build_object('ok', false, 'reason', 'limit') || public.my_devices()::jsonb)::json;
  end if;
  insert into public.devices (user_id, device_key, name, session_id) values (auth.uid(), k, left(coalesce(nullif(n,''),'Device'),60), sid);
  return json_build_object('ok', true);
end $$;

-- sign another device out (counts as a swap) or this device (does not)
create or replace function public.remove_device(d uuid) returns json
language plpgsql security definer set search_path = public, auth as $$
declare r public.devices; mine boolean; used int;
begin
  select * into r from public.devices where id = d and user_id = auth.uid();
  if not found then raise exception 'Device not found'; end if;
  mine := r.session_id = nullif(auth.jwt()->>'session_id','')::uuid;
  if not mine then
    select count(*) into used from public.device_swaps where user_id = auth.uid() and swapped_at > now() - interval '30 days';
    if used >= public.limit_of('max_device_swaps_30d') then
      raise exception 'You have already swapped devices % times in the last 30 days. Please contact Khuluma support.', used;
    end if;
    insert into public.device_swaps (user_id) values (auth.uid());
  end if;
  delete from public.devices where id = d;
  begin delete from auth.sessions where id = r.session_id; exception when others then null; end;
  return json_build_object('ok', true);
end $$;

grant execute on function public.my_devices(), public.register_device(text, text), public.remove_device(uuid), public.this_device_ok() to authenticated;

-- children's data is only visible from a registered device
create or replace function public.is_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select public.this_device_ok() and exists(select 1 from public.child_members where child_id = cid and user_id = auth.uid()) $$;
create or replace function public.is_therapist(cid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select public.this_device_ok() and exists(select 1 from public.child_members where child_id = cid and user_id = auth.uid() and role in ('lead','therapist')) $$;
create or replace function public.is_lead(cid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select public.this_device_ok() and exists(select 1 from public.child_members where child_id = cid and user_id = auth.uid() and role = 'lead') $$;

drop policy if exists "therapists add children" on public.children;
create policy "therapists add children" on public.children for insert to authenticated
  with check (created_by = auth.uid() and public.this_device_ok() and exists(select 1 from public.profiles where id = auth.uid() and role = 'therapist'));
drop policy if exists "members see child" on public.children;
create policy "members see child" on public.children for select to authenticated
  using (public.is_member(id) or (created_by = auth.uid() and public.this_device_ok()));

-- invites can only be accepted from a registered device
create or replace function public.accept_invite_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.this_device_ok() then raise exception 'Register this device first' using errcode = '42501'; end if;
  return new;
end $$;
drop trigger if exists accept_invite_guard on public.child_members;
create trigger accept_invite_guard before insert on public.child_members
  for each row execute function public.accept_invite_guard();
