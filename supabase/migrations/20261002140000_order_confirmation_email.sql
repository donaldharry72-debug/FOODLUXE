-- Track Mailgun confirmation delivery and prevent duplicate emails when
-- Paystack retries a successful-payment webhook.
alter table public.orders
  add column if not exists confirmation_email_status text not null default 'pending',
  add column if not exists confirmation_email_claimed_at timestamptz,
  add column if not exists confirmation_email_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_confirmation_email_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_confirmation_email_status_check
      check (confirmation_email_status in ('pending', 'sending', 'sent', 'skipped'));
  end if;
end
$$;

-- Existing paid orders predate the Mailgun integration. Don't send them a
-- new confirmation if Paystack later replays an old webhook.
update public.orders
set confirmation_email_status = 'skipped'
where payment_status = 'paid'
  and confirmation_email_status = 'pending';
