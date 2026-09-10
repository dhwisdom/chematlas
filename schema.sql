-- ChemAtlas database architecture (PostgreSQL / Supabase-ready)
-- Content graph + learner state + practice analytics + AI tutoring

create table institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  catalog_year text,
  source_url text
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(id),
  name text not null,
  degree_type text,
  concentration text,
  total_credits int
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  discipline text not null,
  description text,
  credit_hours numeric(3,1)
);

create table program_courses (
  program_id uuid references programs(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  recommended_year int,
  recommended_term text,
  requirement_type text default 'required',
  primary key (program_id, course_id)
);

create table course_prerequisites (
  course_id uuid references courses(id) on delete cascade,
  prerequisite_course_id uuid references courses(id) on delete cascade,
  primary key (course_id, prerequisite_course_id)
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  slug text unique,
  title text not null,
  sequence_no int not null,
  summary text
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  slug text,
  title text not null,
  sequence_no int not null,
  estimated_minutes int,
  content_md text,
  unique(module_id, slug)
);

create table concepts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  domain text not null
);

create table lesson_concepts (
  lesson_id uuid references lessons(id) on delete cascade,
  concept_id uuid references concepts(id) on delete cascade,
  importance text default 'core',
  primary key (lesson_id, concept_id)
);

create table concept_dependencies (
  concept_id uuid references concepts(id) on delete cascade,
  prerequisite_concept_id uuid references concepts(id) on delete cascade,
  strength text default 'required',
  primary key (concept_id, prerequisite_concept_id)
);

create table visualizations (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid references concepts(id) on delete cascade,
  type text not null,
  title text not null,
  config jsonb not null default '{}'::jsonb
);

create table assessments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  type text not null,
  prompt text not null,
  config jsonb not null default '{}'::jsonb
);

-- Authenticated learner profile. auth.users is managed by Supabase Auth.
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  learning_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Portable key/value state allows guest localStorage state to sync without
-- coupling the browser to every future analytics table.
create table learner_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_key text not null,
  state_value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, state_key)
);

create table learner_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','mastered','review')),
  mastery numeric(5,2) not null default 0 check (mastery >= 0 and mastery <= 100),
  attempts int not null default 0,
  last_opened_at timestamptz,
  last_practiced_at timestamptz,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

create table practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_key text not null,
  concept_slug text,
  activity_type text not null default 'practice',
  correct boolean,
  score numeric,
  max_score numeric,
  duration_seconds int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table tutor_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  course_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tutor_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references tutor_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  model_name text,
  used_web boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_modules_course_sequence on modules(course_id, sequence_no);
create index idx_lessons_module_sequence on lessons(module_id, sequence_no);
create index idx_concepts_domain on concepts(domain);
create index idx_practice_attempts_user_created on practice_attempts(user_id, created_at desc);
create index idx_tutor_threads_user_updated on tutor_threads(user_id, updated_at desc);

alter table profiles enable row level security;
alter table learner_state enable row level security;
alter table learner_progress enable row level security;
alter table practice_attempts enable row level security;
alter table tutor_threads enable row level security;
alter table tutor_messages enable row level security;

create policy "profiles_self" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learner_state_self" on learner_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learner_progress_self" on learner_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "practice_attempts_self" on practice_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tutor_threads_self" on tutor_threads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tutor_messages_self" on tutor_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
