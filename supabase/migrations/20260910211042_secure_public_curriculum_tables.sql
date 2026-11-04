-- Recovered by read-only inspection; do not replay against an existing hosted database.
alter table institutions enable row level security;
alter table programs enable row level security;
alter table courses enable row level security;
alter table program_courses enable row level security;
alter table course_prerequisites enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table concepts enable row level security;
alter table lesson_concepts enable row level security;
alter table concept_dependencies enable row level security;
alter table visualizations enable row level security;
alter table assessments enable row level security;

create policy "public_read_institutions" on institutions for select using (true);
create policy "public_read_programs" on programs for select using (true);
create policy "public_read_courses" on courses for select using (true);
create policy "public_read_program_courses" on program_courses for select using (true);
create policy "public_read_course_prerequisites" on course_prerequisites for select using (true);
create policy "public_read_modules" on modules for select using (true);
create policy "public_read_lessons" on lessons for select using (true);
create policy "public_read_concepts" on concepts for select using (true);
create policy "public_read_lesson_concepts" on lesson_concepts for select using (true);
create policy "public_read_concept_dependencies" on concept_dependencies for select using (true);
create policy "public_read_visualizations" on visualizations for select using (true);
create policy "public_read_assessments" on assessments for select using (true);

