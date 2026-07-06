-- Add mode_id column to public.parking_histories table
alter table public.parking_histories 
add column if not exists mode_id text not null default 'practice';
