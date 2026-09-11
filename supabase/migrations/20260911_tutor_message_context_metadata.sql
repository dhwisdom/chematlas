-- Preserve ChemAtlas course-source, web-citation, learner-context, and response metadata
-- with each synchronized Tutor message.
alter table public.tutor_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;
