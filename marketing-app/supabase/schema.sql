create table if not exists public.brand_kit (
  id text primary key,
  product text not null,
  audience text not null,
  brand_voice text,
  do_not_say text[],
  claim_safe_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  goal text not null,
  input jsonb not null,
  output jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_generations_created_at on public.generations(created_at desc);
create index if not exists idx_generations_channel on public.generations(channel);

