-- Create voice_entries table
create table public.voice_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  project_id uuid references public.projects on delete set null,
  created_at timestamptz default now(),
  language text check (language in ('de','en')) not null,
  transcript_raw text not null,
  diary_markdown text not null,
  defect_markdown text not null,
  defect_json jsonb,
  meta jsonb
);

-- Enable RLS
alter table public.voice_entries enable row level security;

-- Policy: Users can CRUD their own entries
create policy "Users can CRUD own entries"
  on public.voice_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create indexes for faster queries
create index voice_entries_user_id_idx on public.voice_entries(user_id);
create index voice_entries_project_id_idx on public.voice_entries(project_id);
create index voice_entries_created_at_idx on public.voice_entries(created_at desc);
