create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('course', 'package', 'question_bank', 'pyq', 'test_series')),
  description text not null default '',
  price_paise integer not null default 0 check (price_paise >= 0),
  published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_inclusions (
  package_id uuid not null references public.products(id) on delete cascade,
  included_product_id uuid not null references public.products(id) on delete cascade,
  primary key (package_id, included_product_id),
  check (package_id <> included_product_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'revoked')),
  source text not null default 'purchase' check (source in ('purchase', 'admin_grant')),
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, product_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  provider_order_id text unique,
  provider_payment_id text unique,
  amount_paise integer not null check (amount_paise >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'created' check (status in ('created', 'pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  introduction text not null default '',
  revision_notes text not null default '',
  position integer not null default 0,
  published boolean not null default false,
  unique (subject_id, title)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  published boolean not null default false,
  unique (chapter_id, title)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('pyq', 'mcq')),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  chapter_id uuid references public.chapters(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  examination_name text,
  examination_year integer,
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.question_answers (
  question_id uuid primary key references public.questions(id) on delete cascade,
  answer_key text not null,
  explanation text not null default '',
  conceptual_notes text not null default '',
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  chapter_id uuid references public.chapters(id) on delete set null,
  title text not null,
  description text not null default '',
  storage_path text not null unique,
  content_type text not null default 'application/pdf',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  duration_seconds integer not null check (duration_seconds > 0),
  maximum_attempts integer check (maximum_attempts is null or maximum_attempts > 0),
  available_from timestamptz,
  available_until timestamptz,
  explanations_enabled boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check (available_until is null or available_from is null or available_until > available_from)
);

create table public.mock_test_questions (
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  position integer not null,
  marks numeric(7,2) not null default 1 check (marks >= 0),
  negative_marks numeric(7,2) not null default 0 check (negative_marks >= 0),
  primary key (test_id, question_id),
  unique (test_id, position)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(9,2),
  correct_count integer,
  incorrect_count integer,
  unattempted_count integer,
  time_taken_seconds integer,
  created_at timestamptz not null default now()
);

create table public.test_responses (
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option text,
  marked_for_review boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create table public.bookmarks (
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, question_id)
);

create or replace function public.is_academy_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and suspended_at is null
  );
$$;

create or replace function public.has_product_access(product_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_academy_admin() or exists (
    select 1
    from public.enrollments e
    left join public.product_inclusions i on i.package_id = e.product_id
    where e.student_id = (select auth.uid())
      and e.status = 'active'
      and (e.product_id = product_uuid or i.included_product_id = product_uuid)
  );
$$;

create or replace function public.reveal_question_answer(question_uuid uuid)
returns table (answer_key text, explanation text, conceptual_notes text)
language sql
stable
security definer
set search_path = public
as $$
  select a.answer_key, a.explanation, a.conceptual_notes
  from public.questions q
  join public.question_answers a on a.question_id = q.id
  where q.id = question_uuid
    and q.published
    and (q.product_id is null or public.has_product_access(q.product_id))
    and (select auth.uid()) is not null;
$$;

grant execute on function public.is_academy_admin() to authenticated;
grant execute on function public.has_product_access(uuid) to authenticated;
revoke all on function public.reveal_question_answer(uuid) from public, anon;
grant execute on function public.reveal_question_answer(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_inclusions enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.documents enable row level security;
alter table public.mock_tests enable row level security;
alter table public.mock_test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_responses enable row level security;
alter table public.bookmarks enable row level security;

create policy "Profiles are visible to their owner and admins" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_academy_admin());
create policy "Admins manage profiles" on public.profiles
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy "Published product catalog is visible" on public.products
  for select to anon, authenticated using (published or public.is_academy_admin());
create policy "Admins manage products" on public.products
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Published package inclusions are visible" on public.product_inclusions
  for select to anon, authenticated using (exists (select 1 from public.products p where p.id = package_id and p.published));
create policy "Admins manage package inclusions" on public.product_inclusions
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());

create policy "Students view own enrollments" on public.enrollments
  for select to authenticated using (student_id = (select auth.uid()) or public.is_academy_admin());
create policy "Admins manage enrollments" on public.enrollments
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Students view own payments" on public.payments
  for select to authenticated using (student_id = (select auth.uid()) or public.is_academy_admin());
create policy "Admins manage payments" on public.payments
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());

create policy "Published subjects are visible" on public.subjects
  for select to anon, authenticated using (published or public.is_academy_admin());
create policy "Admins manage subjects" on public.subjects
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Published chapters are visible" on public.chapters
  for select to anon, authenticated using (published or public.is_academy_admin());
create policy "Admins manage chapters" on public.chapters
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Published topics are visible" on public.topics
  for select to anon, authenticated using (published or public.is_academy_admin());
create policy "Admins manage topics" on public.topics
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());

create policy "Students see published questions they can access" on public.questions
  for select to authenticated using (
    public.is_academy_admin() or (published and (product_id is null or public.has_product_access(product_id)))
  );
create policy "Public can see published sample questions" on public.questions
  for select to anon using (published and product_id is null);
create policy "Admins manage questions" on public.questions
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Only admins read answer keys" on public.question_answers
  for select to authenticated using (public.is_academy_admin());
create policy "Admins manage answer keys" on public.question_answers
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());

create policy "Students see documents with granted access" on public.documents
  for select to authenticated using (public.is_academy_admin() or product_id is null or public.has_product_access(product_id));
create policy "Admins manage documents" on public.documents
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());

create policy "Students see available mock tests" on public.mock_tests
  for select to authenticated using (
    public.is_academy_admin() or (
      published
      and (available_from is null or available_from <= now())
      and (available_until is null or available_until > now())
      and (product_id is null or public.has_product_access(product_id))
    )
  );
create policy "Admins manage mock tests" on public.mock_tests
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Students see questions in available tests" on public.mock_test_questions
  for select to authenticated using (
    public.is_academy_admin() or exists (
      select 1 from public.mock_tests t
      where t.id = test_id and t.published
        and (t.available_from is null or t.available_from <= now())
        and (t.available_until is null or t.available_until > now())
        and (t.product_id is null or public.has_product_access(t.product_id))
    )
  );
create policy "Admins manage test questions" on public.mock_test_questions
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());

create policy "Students read own attempts" on public.test_attempts
  for select to authenticated using (student_id = (select auth.uid()) or public.is_academy_admin());
create policy "Students start available tests" on public.test_attempts
  for insert to authenticated with check (
    student_id = (select auth.uid()) and submitted_at is null and score is null
    and exists (select 1 from public.mock_tests t where t.id = test_id and t.published
      and (t.product_id is null or public.has_product_access(t.product_id)))
  );
create policy "Admins manage attempts" on public.test_attempts
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Students read own responses" on public.test_responses
  for select to authenticated using (exists (select 1 from public.test_attempts a where a.id = attempt_id and a.student_id = (select auth.uid())) or public.is_academy_admin());
create policy "Students save responses before submission" on public.test_responses
  for all to authenticated using (exists (
    select 1 from public.test_attempts a
    join public.mock_test_questions tq on tq.test_id = a.test_id and tq.question_id = test_responses.question_id
    where a.id = test_responses.attempt_id and a.student_id = (select auth.uid()) and a.submitted_at is null
  )) with check (exists (
    select 1 from public.test_attempts a
    join public.mock_test_questions tq on tq.test_id = a.test_id and tq.question_id = test_responses.question_id
    where a.id = test_responses.attempt_id and a.student_id = (select auth.uid()) and a.submitted_at is null
  ));
create policy "Admins manage test responses" on public.test_responses
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Students manage own bookmarks" on public.bookmarks
  for all to authenticated using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy "Admins manage bookmarks" on public.bookmarks
  for all to authenticated using (public.is_academy_admin()) with check (public.is_academy_admin());

insert into public.subjects (name, slug) values
  ('Dairy Microbiology', 'dairy-microbiology'),
  ('Dairy Chemistry', 'dairy-chemistry'),
  ('Dairy Engineering', 'dairy-engineering'),
  ('Dairy Technology', 'dairy-technology'),
  ('Dairy Processing', 'dairy-processing')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-materials', 'study-materials', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = false;

create policy "Students read entitled private study files" on storage.objects
  for select to authenticated using (
    bucket_id = 'study-materials' and exists (
      select 1 from public.documents d
      where d.storage_path = name
        and (public.is_academy_admin() or d.product_id is null or public.has_product_access(d.product_id))
    )
  );
create policy "Admins manage private study files" on storage.objects
  for all to authenticated using (bucket_id = 'study-materials' and public.is_academy_admin())
  with check (bucket_id = 'study-materials' and public.is_academy_admin());