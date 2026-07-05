-- Create parking_histories table
create table if not exists public.parking_histories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  car_type text not null,
  map_id text not null,
  elapsed_time_seconds integer not null,
  collision_count integer not null,
  line_violation_seconds numeric not null,
  final_angle_offset numeric not null,
  score integer not null,
  ai_feedback text not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.parking_histories enable row level security;

-- Policies
create policy "Allow anonymous and users to insert parking history"
  on public.parking_histories
  for insert
  with check (true);

create policy "Allow anyone to read history matching user_id or anonymous"
  on public.parking_histories
  for select
  using (user_id is null or auth.uid() = user_id);

create policy "Allow users to update anonymous records or their own"
  on public.parking_histories
  for update
  using (user_id is null or auth.uid() = user_id);
