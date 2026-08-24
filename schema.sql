-- ChemAtlas database architecture (PostgreSQL / Supabase-ready)
-- Degree → Course → Module → Lesson → Concept → Visualization / Assessment

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
  title text not null,
  sequence_no int not null,
  summary text
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  title text not null,
  sequence_no int not null,
  estimated_minutes int,
  content_md text
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

create table learner_progress (
  user_id uuid not null,
  lesson_id uuid references lessons(id) on delete cascade,
  status text not null default 'not_started',
  mastery numeric(5,2) default 0,
  last_opened_at timestamptz,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

create index idx_modules_course_sequence on modules(course_id, sequence_no);
create index idx_lessons_module_sequence on lessons(module_id, sequence_no);
create index idx_concepts_domain on concepts(domain);
