-- Create login_histories table
create table if not exists public.login_histories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  login_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.login_histories enable row level security;

-- Drop policies if they exist to prevent errors on re-runs
drop policy if exists "Allow anyone to insert login history" on public.login_histories;
drop policy if exists "Allow users to read their own login history" on public.login_histories;

-- Create policy to allow inserting login histories for anyone
create policy "Allow anyone to insert login history"
  on public.login_histories
  for insert
  with check (true);

-- Create policy to allow users to read their own login history
create policy "Allow users to read their own login history"
  on public.login_histories
  for select
  using (auth.uid() = user_id);
