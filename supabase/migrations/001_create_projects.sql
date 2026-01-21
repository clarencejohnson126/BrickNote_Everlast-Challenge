-- Create projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.projects enable row level security;

-- Policy: Users can CRUD their own projects
create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create index for faster queries
create index projects_user_id_idx on public.projects(user_id);
