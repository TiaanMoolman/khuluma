-- Khuluma AAC: Paystack card payments. Run after billing_update.sql. Safe to run again.
alter table public.licences add column if not exists paystack_customer text;
alter table public.licences add column if not exists paystack_sub text;
alter table public.licences add column if not exists paystack_token text;
alter table public.licences add column if not exists card_on_file boolean not null default false;
do $$ begin
  create unique index payments_one_reference on public.payments (reference) where method = 'paystack';
exception when others then null; end $$;

-- the app also needs to know whether a card is on file
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
      'plan', l.plan_id,
      'card', l.card_on_file,
      'renews', l.status in ('trial','active') and l.paystack_sub is not null,
      'cancelled', l.status = 'cancelled') from l) end $$;
