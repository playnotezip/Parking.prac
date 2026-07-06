-- Drop the existing SELECT policies on parking_histories
drop policy if exists "Allow anyone to read history matching user_id or anonymous" on public.parking_histories;
drop policy if exists "Allow anyone to read all parking history" on public.parking_histories;

-- Create a new SELECT policy allowing anyone (authenticated or anonymous) to read all history
create policy "Allow anyone to read all parking history"
  on public.parking_histories
  for select
  using (true);
