-- Unify Learn · initial schema
-- Runs on Supabase (Postgres 15+). No extensions needed: HMAC is built on the core sha256().
-- Access model:
--   * Students read/write only their own rows.
--   * A class list is visible only to that class's HOCs, the lecturers of that class's courses, and admins.
--   * Anything that crosses those lines (claiming a name, scanning a pass, settling a clash) goes through
--     SECURITY DEFINER functions below, which check the caller's role themselves.

-- ============================================================ schemas
create schema if not exists private;
revoke all on schema private from public;

-- ============================================================ reference data
create table public.departments (
  code text primary key,                 -- ECE, MEE, ...
  name text not null,
  faculty text not null default 'Engineering'
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  department_code text not null references public.departments(code),
  level int not null check (level in (100,200,300,400,500)),
  session text not null,                 -- '2026/2027'
  created_at timestamptz not null default now(),
  unique (department_code, level, session)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,             -- 'MEE 352'
  title text not null,
  units int not null default 3,
  department_code text references public.departments(code),
  level int
);

-- which courses each class takes this session
create table public.class_courses (
  class_id uuid not null references public.classes(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key (class_id, course_id)
);

-- ============================================================ people
create type public.user_role as enum ('student', 'lecturer', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role public.user_role not null default 'student',
  class_id uuid references public.classes(id),
  persona text,                          -- go-getter | comeback | curious | team-player | on-the-move
  goal text,
  study_time text,                       -- when they read best (S10)
  focus_minutes int check (focus_minutes between 5 and 180),
  reminders boolean,                     -- said yes to reminders (S12)
  is_school_identity boolean not null default false, -- helper account created only to prove a student email
  created_at timestamptz not null default now()
);

create table public.class_hocs (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table public.hoc_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  phone text,
  confirmer text,                        -- 'Level adviser', 'HOD', ...
  status text not null default 'open' check (status in ('open','approved','declined')),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.course_lecturers (
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  confirmed boolean not null default false, -- an HOC of a class taking the course confirms the lecturer
  primary key (course_id, user_id)
);

-- ============================================================ class lists and claims
create table public.class_list_entries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  surname text not null,
  first_name text not null,
  middle_name text,
  matric text not null check (matric ~ '^[0-9]{6,12}$'),
  reason text,                           -- null for the uploaded list; 'Direct entry' etc. when added later
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, matric)
);

create table public.claims (
  entry_id uuid primary key references public.class_list_entries(id) on delete cascade,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  method text not null check (method in ('student_email','id_check')),
  student_email text,
  claimed_at timestamptz not null default now()
);

create table private.claim_nonces (
  nonce text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null
);

create table public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  kind text not null check (kind in ('clash','not_on_list','id_check','priority')),
  status text not null default 'open' check (status in ('open','approved','declined','resolved')),
  from_user uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  message text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.list_events (
  id bigint generated always as identity primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  actor uuid references public.profiles(id) on delete set null,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create table public.priority_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade, -- the class whose register they join
  status text not null default 'requested' check (status in ('requested','approved','declined')),
  created_at timestamptz not null default now(),
  unique (user_id, course_id, class_id)
);

-- ============================================================ attendance
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  venue text,
  opened_by uuid references public.profiles(id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

-- One row per person on the register who was present. Keyed on the class list entry, so an HOC can
-- type in a student who has no phone, and a student who claims their name later still sees it.
create table public.attendance_records (
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  entry_id uuid not null references public.class_list_entries(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,   -- the account holding this name, if claimed
  method text not null check (method in ('scan','typed')),
  scanned_by uuid references public.profiles(id) on delete set null,
  scanned_at timestamptz not null default now(),
  primary key (session_id, entry_id)
);

-- ============================================================ learning progress
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_code text not null,
  week int not null,
  score int not null,
  total int not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.streak_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

-- the current semester: set by the Unify admin, drives "Week 3 of 12" on home
create table public.semester (
  id int primary key default 1 check (id = 1),
  label text not null default 'First semester 2026/2027',
  starts_on date,
  weeks int not null default 12 check (weeks between 1 and 30)
);
insert into public.semester(id) values (1);

create table public.cgpa_plans (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cgpa numeric(3,2) not null check (cgpa between 0 and 5),
  units_done int not null check (units_done >= 0),
  units_left int not null check (units_left >= 0),
  target numeric(3,2) check (target between 0 and 5),
  courses jsonb not null default '[]'::jsonb,   -- [{code, units, status: 'done'|'priority'|'later'}]
  updated_at timestamptz not null default now()
);

create table private.settings (key text primary key, value bytea not null);

-- ============================================================ helpers
create or replace function private.hmac_sha256(key bytea, msg bytea) returns bytea
language plpgsql immutable strict as $$
declare k bytea := key; ipad bytea; opad bytea; i int;
begin
  if length(k) > 64 then k := sha256(k); end if;
  if length(k) < 64 then k := k || decode(repeat('00', 64 - length(k)), 'hex'); end if;
  ipad := k; opad := k;
  for i in 0..63 loop
    ipad := set_byte(ipad, i, get_byte(k, i) # 54);
    opad := set_byte(opad, i, get_byte(k, i) # 92);
  end loop;
  return sha256(opad || sha256(ipad || msg));
end $$;

insert into private.settings(key, value)
values ('pass_secret', sha256(convert_to(gen_random_uuid()::text || clock_timestamp()::text || gen_random_uuid()::text, 'UTF8')))
on conflict (key) do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_hoc(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_hocs where class_id = p_class and user_id = auth.uid());
$$;

create or replace function public.teaches_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from course_lecturers cl join class_courses cc on cc.course_id = cl.course_id
    where cc.class_id = p_class and cl.user_id = auth.uid() and cl.confirmed);
$$;

create or replace function public.can_see_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_hoc(p_class) or public.teaches_class(p_class) or public.is_admin();
$$;

create or replace function private.log(p_class uuid, p_action text, p_detail text) returns void
language sql security definer set search_path = public as $$
  insert into list_events(class_id, actor, action, detail) values (p_class, auth.uid(), p_action, p_detail);
$$;

-- new auth user → profile
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- sign-up may ask to be a lecturer; nothing else (admin is only ever set by an admin)
  insert into profiles(id, email, display_name, role, is_school_identity)
  values (new.id, lower(new.email),
          coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          case when new.raw_user_meta_data->>'role' = 'lecturer' then 'lecturer'::public.user_role else 'student'::public.user_role end,
          lower(coalesce(new.email,'')) like '%@st.lasu.edu.ng')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

-- at most 3 HOCs per class
create or replace function private.max_three_hocs() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.class_hocs where class_id = new.class_id) >= 3 then
    raise exception 'A class can have at most 3 HOCs';
  end if;
  return new;
end $$;
create trigger class_hocs_limit before insert on public.class_hocs
for each row execute function private.max_three_hocs();

-- ============================================================ row-level security
alter table public.departments enable row level security;
alter table public.classes enable row level security;
alter table public.courses enable row level security;
alter table public.class_courses enable row level security;
alter table public.profiles enable row level security;
alter table public.class_hocs enable row level security;
alter table public.hoc_requests enable row level security;
alter table public.course_lecturers enable row level security;
alter table public.class_list_entries enable row level security;
alter table public.claims enable row level security;
alter table public.inbox_items enable row level security;
alter table public.list_events enable row level security;
alter table public.priority_registrations enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.streak_days enable row level security;
alter table public.cgpa_plans enable row level security;
alter table public.semester enable row level security;

-- reference data: readable by any signed-in user
create policy "read departments" on public.departments for select to authenticated using (true);
create policy "read classes" on public.classes for select to authenticated using (true);
create policy "read courses" on public.courses for select to authenticated using (true);
create policy "read class courses" on public.class_courses for select to authenticated using (true);
create policy "admin writes classes" on public.classes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin writes courses" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin writes class courses" on public.class_courses for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles: your own row; admins see all. Role cannot be changed by the user (see trigger below).
create policy "own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function private.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- the SQL editor / service role runs without a signed-in user: no restriction there
  if auth.uid() is null then return new; end if;
  if new.role is distinct from old.role and not public.is_admin() then
    -- a user may switch themselves between student and lecturer at sign-up, never to admin
    if new.role = 'admin' or old.role = 'admin' then
      raise exception 'Only an admin can change this role';
    end if;
  end if;
  if new.is_school_identity is distinct from old.is_school_identity and not public.is_admin() then
    new.is_school_identity := old.is_school_identity;
  end if;
  -- the email on the profile always mirrors the sign-in email
  if new.email is distinct from old.email and not public.is_admin() then
    new.email := old.email;
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
for each row execute function private.protect_role();

-- HOCs
create policy "see HOCs of your class" on public.class_hocs for select to authenticated
  using (user_id = auth.uid() or public.can_see_class(class_id)
         or class_id = (select class_id from public.profiles where id = auth.uid()));
create policy "admin manages HOCs" on public.class_hocs for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "own HOC requests" on public.hoc_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "make HOC request" on public.hoc_requests for insert to authenticated with check (user_id = auth.uid() and status = 'open');
create policy "admin decides HOC requests" on public.hoc_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- lecturers
create policy "see lecturers" on public.course_lecturers for select to authenticated using (true);
create policy "lecturer adds own course" on public.course_lecturers for insert to authenticated
  with check (user_id = auth.uid() and confirmed = false
              and exists (select 1 from public.profiles where id = auth.uid() and role = 'lecturer'));
create policy "lecturer removes own course" on public.course_lecturers for delete to authenticated using (user_id = auth.uid());

-- class lists: only the class's HOCs, its lecturers and admins
create policy "see class list" on public.class_list_entries for select to authenticated using (public.can_see_class(class_id));
create policy "HOC edits class list" on public.class_list_entries for update to authenticated using (public.is_hoc(class_id)) with check (public.is_hoc(class_id));
create policy "HOC removes from class list" on public.class_list_entries for delete to authenticated using (public.is_hoc(class_id));
-- inserts go through import_class_list / add_student so every change is logged

create policy "see claims" on public.claims for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.class_list_entries e where e.id = entry_id and public.can_see_class(e.class_id)));

create policy "HOC inbox" on public.inbox_items for select to authenticated using (public.is_hoc(class_id) or public.is_admin() or from_user = auth.uid());
create policy "list history" on public.list_events for select to authenticated using (public.can_see_class(class_id));

create policy "own priority registrations" on public.priority_registrations for select to authenticated
  using (user_id = auth.uid() or public.can_see_class(class_id));

-- attendance
create policy "see attendance sessions" on public.attendance_sessions for select to authenticated
  using (public.can_see_class(class_id)
         or class_id = (select class_id from public.profiles where id = auth.uid())
         or exists (select 1 from public.priority_registrations pr where pr.user_id = auth.uid() and pr.class_id = attendance_sessions.class_id and pr.course_id = attendance_sessions.course_id and pr.status = 'approved'));
create policy "see attendance records" on public.attendance_records for select to authenticated
  using (entry_id in (select c.entry_id from public.claims c where c.user_id = auth.uid())
         or exists (select 1 from public.attendance_sessions s where s.id = session_id and public.can_see_class(s.class_id)));

-- learning progress: own rows only
create policy "own quiz attempts" on public.quiz_attempts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own streak" on public.streak_days for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read semester" on public.semester for select to authenticated using (true);
create policy "admin sets semester" on public.semester for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "own cgpa plan" on public.cgpa_plans for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================ functions (RPC)

-- --- onboarding: put me in a class (creates the class row for this session if it doesn't exist yet)
create or replace function public.join_class(p_department text, p_level int, p_session text default '2026/2027')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_class uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into classes(department_code, level, session) values (p_department, p_level, p_session)
  on conflict (department_code, level, session) do nothing;
  select id into v_class from classes where department_code = p_department and level = p_level and session = p_session;
  update profiles set class_id = v_class where id = auth.uid();
  return v_class;
end $$;

-- --- HOC requests
create or replace function public.request_hoc(p_phone text, p_confirmer text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_class uuid; v_id uuid;
begin
  select class_id into v_class from profiles where id = auth.uid();
  if v_class is null then raise exception 'Choose your department and level first'; end if;
  if exists (select 1 from class_hocs where class_id = v_class and user_id = auth.uid()) then raise exception 'You are already an HOC of this class'; end if;
  select id into v_id from hoc_requests where user_id = auth.uid() and class_id = v_class and status = 'open';
  if v_id is not null then return v_id; end if;
  insert into hoc_requests(user_id, class_id, phone, confirmer) values (auth.uid(), v_class, p_phone, p_confirmer) returning id into v_id;
  return v_id;
end $$;

create or replace function public.decide_hoc_request(p_request uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r hoc_requests;
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  select * into r from hoc_requests where id = p_request for update;
  if r.id is null or r.status <> 'open' then raise exception 'Request is not open'; end if;
  if p_approve then
    insert into class_hocs(class_id, user_id) values (r.class_id, r.user_id) on conflict do nothing;
  end if;
  update hoc_requests set status = case when p_approve then 'approved' else 'declined' end, decided_by = auth.uid(), decided_at = now() where id = p_request;
end $$;

-- --- class list import: rows = [{surname, first_name, middle_name, matric}]
create or replace function public.import_class_list(p_class uuid, p_rows jsonb, p_source text default 'document')
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if not is_hoc(p_class) then raise exception 'Only an HOC of this class can upload its list'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then raise exception 'The list is empty'; end if;
  insert into class_list_entries(class_id, surname, first_name, middle_name, matric, added_by)
  select p_class, upper(trim(r->>'surname')), initcap(trim(r->>'first_name')), nullif(initcap(trim(coalesce(r->>'middle_name',''))), ''), trim(r->>'matric'), auth.uid()
  from jsonb_array_elements(p_rows) r
  on conflict (class_id, matric) do update
    set surname = excluded.surname, first_name = excluded.first_name, middle_name = excluded.middle_name;
  get diagnostics v_n = row_count;
  perform private.log(p_class, 'uploaded', v_n || ' students · ' || p_source);
  return v_n;
end $$;

create or replace function public.add_student(p_class uuid, p_surname text, p_first text, p_middle text, p_matric text, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not is_hoc(p_class) then raise exception 'Only an HOC of this class can add students'; end if;
  insert into class_list_entries(class_id, surname, first_name, middle_name, matric, reason, added_by)
  values (p_class, upper(trim(p_surname)), initcap(trim(p_first)), nullif(initcap(trim(coalesce(p_middle,''))),''), trim(p_matric), p_reason, auth.uid())
  returning id into v_id;
  perform private.log(p_class, 'added', upper(trim(p_surname)) || ' ' || initcap(trim(p_first)) || ' · ' || coalesce(p_reason, 'added'));
  return v_id;
end $$;

-- Fix a row after the list is saved. A claimed matric is locked: the student proved it.
create or replace function public.edit_student(p_entry uuid, p_surname text, p_first text, p_middle text, p_matric text)
returns void language plpgsql security definer set search_path = public as $$
declare e class_list_entries; v_matric text := regexp_replace(coalesce(p_matric, ''), '\D', '', 'g');
begin
  select * into e from class_list_entries where id = p_entry;
  if e.id is null or not is_hoc(e.class_id) then raise exception 'Only an HOC of this class can edit it'; end if;
  if coalesce(trim(p_surname), '') = '' or coalesce(trim(p_first), '') = '' then raise exception 'Surname and first name are needed'; end if;
  if v_matric <> e.matric and exists (select 1 from claims where entry_id = e.id) then
    raise exception 'This student has claimed their name, so their matric number is locked';
  end if;
  update class_list_entries
    set surname = upper(trim(p_surname)), first_name = initcap(trim(p_first)),
        middle_name = nullif(initcap(trim(coalesce(p_middle, ''))), ''), matric = v_matric
    where id = e.id;
  perform private.log(e.class_id, 'edited',
    concat_ws(' ', e.surname, e.first_name, e.middle_name) || ' → '
    || concat_ws(' ', upper(trim(p_surname)), initcap(trim(p_first)), nullif(initcap(trim(coalesce(p_middle, ''))), ''))
    || case when v_matric <> e.matric then ' · matric ' || e.matric || ' → ' || v_matric else '' end);
end $$;

-- Remove a row added by mistake. Never once someone holds it or it is on a register.
create or replace function public.remove_student(p_entry uuid) returns void
language plpgsql security definer set search_path = public as $$
declare e class_list_entries; v_regs int;
begin
  select * into e from class_list_entries where id = p_entry;
  if e.id is null or not is_hoc(e.class_id) then raise exception 'Only an HOC of this class can remove it'; end if;
  if exists (select 1 from claims where entry_id = e.id) then
    raise exception 'This student has claimed their name, so they can''t be removed. Fix their name instead';
  end if;
  select count(*) into v_regs from attendance_records where entry_id = e.id;
  if v_regs > 0 then
    raise exception 'This student is on % past register%, so they can''t be removed. Fix their name instead', v_regs, case when v_regs = 1 then '' else 's' end;
  end if;
  delete from class_list_entries where id = e.id;
  perform private.log(e.class_id, 'removed', e.surname || ' ' || e.first_name || ' · ' || e.matric);
end $$;

-- --- claiming your name
-- Step 1 (main account): get a one-time nonce.
create or replace function public.begin_claim() returns text
language plpgsql security definer set search_path = public, private as $$
declare v_nonce text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  delete from private.claim_nonces where user_id = auth.uid() or expires_at < now();
  insert into private.claim_nonces(nonce, user_id, expires_at) values (v_nonce, auth.uid(), now() + interval '15 minutes');
  return v_nonce;
end $$;

-- Core claim logic for target user + verified school email.
create or replace function private.do_claim(p_user uuid, p_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(p_email); v_matric text; v_class uuid; e class_list_entries; v_holder uuid; v_existing uuid;
begin
  if v_email is null or v_email !~ '@st\.lasu\.edu\.ng$' then
    return jsonb_build_object('status', 'not_school_email');
  end if;
  v_matric := substring(split_part(v_email, '@', 1) from '([0-9]{6,12})$');
  if v_matric is null then return jsonb_build_object('status', 'no_matric_in_email'); end if;
  select class_id into v_class from profiles where id = p_user;
  if v_class is null then return jsonb_build_object('status', 'no_class'); end if;
  if not exists (select 1 from class_list_entries where class_id = v_class) then
    return jsonb_build_object('status', 'list_not_up', 'matric', v_matric);
  end if;
  select * into e from class_list_entries where class_id = v_class and matric = v_matric;
  if e.id is null then
    if not exists (select 1 from inbox_items where class_id = v_class and kind = 'not_on_list' and status = 'open' and from_user = p_user) then
      insert into inbox_items(class_id, kind, from_user, payload) values (v_class, 'not_on_list', p_user, jsonb_build_object('matric', v_matric, 'email', v_email));
    end if;
    return jsonb_build_object('status', 'not_on_list', 'matric', v_matric);
  end if;
  select user_id into v_holder from claims where entry_id = e.id;
  if v_holder = p_user then
    return jsonb_build_object('status', 'claimed', 'entry_id', e.id, 'surname', e.surname, 'first_name', e.first_name, 'middle_name', e.middle_name, 'matric', e.matric);
  end if;
  if v_holder is not null then
    if not exists (select 1 from inbox_items where class_id = v_class and kind = 'clash' and status = 'open' and from_user = p_user) then
      insert into inbox_items(class_id, kind, from_user, payload)
      values (v_class, 'clash', p_user, jsonb_build_object('matric', v_matric, 'entry_id', e.id, 'holder', v_holder, 'email', v_email, 'method', 'student_email'));
    end if;
    return jsonb_build_object('status', 'clash', 'matric', v_matric);
  end if;
  select entry_id into v_existing from claims where user_id = p_user;
  if v_existing is not null then return jsonb_build_object('status', 'already_claimed_other'); end if;
  insert into claims(entry_id, user_id, method, student_email) values (e.id, p_user, 'student_email', v_email);
  return jsonb_build_object('status', 'claimed', 'entry_id', e.id, 'surname', e.surname, 'first_name', e.first_name, 'middle_name', e.middle_name, 'matric', e.matric);
end $$;

-- Step 2: called by the helper session signed in AS the student email (Google or email code).
create or replace function public.complete_claim(p_nonce text) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare n private.claim_nonces; v_res jsonb;
begin
  select * into n from private.claim_nonces where nonce = p_nonce and expires_at > now();
  if n.nonce is null then return jsonb_build_object('status', 'expired'); end if;
  v_res := private.do_claim(n.user_id, auth.jwt()->>'email');
  delete from private.claim_nonces where nonce = p_nonce;
  return v_res;
end $$;

-- Shortcut when the main account itself signed up with the student email.
create or replace function public.claim_with_own_email() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  return private.do_claim(auth.uid(), auth.jwt()->>'email');
end $$;

create or replace function public.my_claim() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('entry_id', e.id, 'surname', e.surname, 'first_name', e.first_name, 'middle_name', e.middle_name,
                            'matric', e.matric, 'method', c.method, 'student_email', c.student_email, 'class_id', e.class_id)
  from claims c join class_list_entries e on e.id = c.entry_id where c.user_id = auth.uid();
$$;

create or replace function public.class_list_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'class_id', p.class_id,
    'uploaded', exists (select 1 from class_list_entries e where e.class_id = p.class_id),
    'hocs', coalesce((select jsonb_agg(pr.display_name) from class_hocs h join profiles pr on pr.id = h.user_id where h.class_id = p.class_id), '[]'::jsonb))
  from profiles p where p.id = auth.uid();
$$;

-- "This isn't me": undo my claim and tell the HOC.
create or replace function public.release_claim(p_message text default null) returns void
language plpgsql security definer set search_path = public as $$
declare c claims; v_class uuid;
begin
  select * into c from claims where user_id = auth.uid();
  if c.entry_id is null then return; end if;
  select class_id into v_class from class_list_entries where id = c.entry_id;
  delete from claims where user_id = auth.uid();
  insert into inbox_items(class_id, kind, from_user, payload, message)
  values (v_class, 'not_on_list', auth.uid(), jsonb_build_object('released_entry', c.entry_id, 'email', c.student_email), coalesce(p_message, 'Matched a name that isn''t mine'));
end $$;

-- Student → HOC: "someone claimed my matric" (with a message) or "check my ID card".
create or replace function public.message_hoc(p_kind text, p_matric text, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_class uuid; v_id uuid; v_entry uuid;
begin
  if p_kind not in ('clash','id_check','not_on_list') then raise exception 'Unknown request'; end if;
  select class_id into v_class from profiles where id = auth.uid();
  if v_class is null then raise exception 'Choose your department and level first'; end if;
  select id into v_entry from class_list_entries where class_id = v_class and matric = p_matric;
  select id into v_id from inbox_items where class_id = v_class and kind = p_kind and from_user = auth.uid() and status = 'open';
  if v_id is not null then
    update inbox_items set message = p_message, payload = payload || jsonb_build_object('matric', p_matric, 'entry_id', v_entry) where id = v_id;
    return v_id;
  end if;
  insert into inbox_items(class_id, kind, from_user, payload, message)
  values (v_class, p_kind, auth.uid(), jsonb_build_object('matric', p_matric, 'entry_id', v_entry), p_message)
  returning id into v_id;
  return v_id;
end $$;

-- Priority (carryover) course: ask that course's class HOC to add me to the register.
create or replace function public.request_priority(p_course uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_class uuid; v_id uuid; c courses;
begin
  if not exists (select 1 from claims where user_id = auth.uid()) then
    return jsonb_build_object('status', 'claim_first');
  end if;
  select * into c from courses where id = p_course;
  select cc.class_id into v_class from class_courses cc join classes k on k.id = cc.class_id
    where cc.course_id = p_course and k.session = '2026/2027' order by (k.level = c.level) desc limit 1;
  if v_class is null then return jsonb_build_object('status', 'no_class_for_course'); end if;
  insert into priority_registrations(user_id, course_id, class_id) values (auth.uid(), p_course, v_class)
  on conflict (user_id, course_id, class_id) do update set status = case when priority_registrations.status = 'declined' then 'requested' else priority_registrations.status end
  returning id into v_id;
  if not exists (select 1 from inbox_items where kind = 'priority' and status = 'open' and from_user = auth.uid() and payload->>'registration' = v_id::text) then
    insert into inbox_items(class_id, kind, from_user, payload)
    values (v_class, 'priority', auth.uid(), jsonb_build_object('registration', v_id, 'course', c.code, 'claim', public.my_claim()));
  end if;
  return jsonb_build_object('status', 'requested', 'registration', v_id);
end $$;

-- HOC inbox view with names resolved (only for HOCs of the class).
create or replace function public.hoc_inbox(p_class uuid) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not (is_hoc(p_class) or is_admin()) then raise exception 'Only HOCs of this class can see its inbox'; end if;
  return query
  select jsonb_build_object(
    'id', i.id, 'kind', i.kind, 'status', i.status, 'created_at', i.created_at, 'message', i.message, 'payload', i.payload,
    'from_name', p.display_name, 'from_email', p.email,
    'entry', (select jsonb_build_object('surname', e.surname, 'first_name', e.first_name, 'middle_name', e.middle_name, 'matric', e.matric)
              from class_list_entries e where e.id = coalesce((i.payload->>'entry_id')::uuid, null)),
    'holder', (select jsonb_build_object('name', hp.display_name, 'email', c.student_email, 'claimed_at', c.claimed_at,
                                         'classes', (select count(*) from attendance_records ar where ar.entry_id = c.entry_id))
               from claims c join profiles hp on hp.id = c.user_id where c.entry_id = (i.payload->>'entry_id')::uuid))
  from inbox_items i left join profiles p on p.id = i.from_user
  where i.class_id = p_class and i.status = 'open'
  order by case i.kind when 'clash' then 0 when 'id_check' then 1 when 'not_on_list' then 2 else 3 end, i.created_at;
end $$;

-- HOC decisions.
--   clash:       p_decision 'keep' (holder keeps it) | 'move' (give it to the requester)
--   id_check:    'confirm' (create claim by ID card) | 'decline'
--   not_on_list: 'decline' (adding happens through add_student, then the student claims again) | 'resolved'
--   priority:    'approve' | 'decline'
create or replace function public.resolve_inbox(p_item uuid, p_decision text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare i inbox_items; v_entry uuid; v_status text := 'resolved';
begin
  select * into i from inbox_items where id = p_item for update;
  if i.id is null or i.status <> 'open' then raise exception 'This request is already settled'; end if;
  if not is_hoc(i.class_id) then raise exception 'Only an HOC of this class can do this'; end if;

  if i.kind = 'clash' then
    v_entry := (i.payload->>'entry_id')::uuid;
    if v_entry is null then select id into v_entry from class_list_entries where class_id = i.class_id and matric = i.payload->>'matric'; end if;
    if p_decision = 'move' then
      delete from claims where entry_id = v_entry;
      delete from claims where user_id = i.from_user;
      insert into claims(entry_id, user_id, method, student_email) values (v_entry, i.from_user, coalesce(nullif(i.payload->>'method',''),'id_check'), i.payload->>'email');
      perform private.log(i.class_id, 'clash', (i.payload->>'matric') || ' moved to the second account');
      v_status := 'approved';
    elsif p_decision = 'keep' then
      perform private.log(i.class_id, 'clash', (i.payload->>'matric') || ' kept on the first account');
      v_status := 'declined';
    else raise exception 'Choose keep or move'; end if;

  elsif i.kind = 'id_check' then
    if p_decision = 'confirm' then
      select id into v_entry from class_list_entries where class_id = i.class_id and matric = i.payload->>'matric';
      if v_entry is null then raise exception 'That matric number is not on the list. Add the student first.'; end if;
      if exists (select 1 from claims where entry_id = v_entry and user_id <> i.from_user) then raise exception 'Someone else holds this matric number. Settle it as a clash.'; end if;
      delete from claims where user_id = i.from_user;
      insert into claims(entry_id, user_id, method) values (v_entry, i.from_user, 'id_check') on conflict (entry_id) do nothing;
      perform private.log(i.class_id, 'id_check', (i.payload->>'matric') || ' confirmed by ID card');
      v_status := 'approved';
    else v_status := 'declined'; end if;

  elsif i.kind = 'priority' then
    update priority_registrations set status = case when p_decision = 'approve' then 'approved' else 'declined' end
    where id = (i.payload->>'registration')::uuid;
    perform private.log(i.class_id, 'priority', (i.payload->>'course') || case when p_decision = 'approve' then ' approved' else ' declined' end);
    v_status := case when p_decision = 'approve' then 'approved' else 'declined' end;

  else -- not_on_list
    v_status := case when p_decision = 'decline' then 'declined' else 'resolved' end;
    -- They proved their student email before they were on the list. Once the HOC adds that
    -- matric, finish their claim so they don't have to do it again. The matric must come from
    -- the proven email itself, not from anything typed later.
    if v_status = 'resolved' and lower(coalesce(i.payload->>'email', '')) ~ '@st\.lasu\.edu\.ng$' then
      select e.id into v_entry from class_list_entries e
      where e.class_id = i.class_id
        and e.matric = substring(split_part(lower(i.payload->>'email'), '@', 1) from '([0-9]{6,12})$')
        and not exists (select 1 from claims c where c.entry_id = e.id);
      if v_entry is not null and not exists (select 1 from claims where user_id = i.from_user) then
        insert into claims(entry_id, user_id, method, student_email) values (v_entry, i.from_user, 'student_email', lower(i.payload->>'email'));
      end if;
    end if;
  end if;

  update inbox_items set status = v_status, decided_by = auth.uid(), decided_at = now() where id = p_item;
  return jsonb_build_object('status', v_status);
end $$;

-- --- attendance
create or replace function public.open_attendance(p_course uuid, p_class uuid, p_venue text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not (exists (select 1 from course_lecturers where course_id = p_course and user_id = auth.uid() and confirmed) or is_hoc(p_class)) then
    raise exception 'Only the course lecturer or an HOC of the class can open attendance';
  end if;
  select id into v_id from attendance_sessions where course_id = p_course and class_id = p_class and closed_at is null;
  if v_id is not null then return v_id; end if;
  insert into attendance_sessions(course_id, class_id, venue, opened_by) values (p_course, p_class, p_venue, auth.uid()) returning id into v_id;
  return v_id;
end $$;

create or replace function public.close_attendance(p_session uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s attendance_sessions;
begin
  select * into s from attendance_sessions where id = p_session;
  if s.id is null then raise exception 'No such session'; end if;
  if not (s.opened_by = auth.uid() or is_hoc(s.class_id) or exists (select 1 from course_lecturers where course_id = s.course_id and user_id = auth.uid() and confirmed)) then
    raise exception 'Not allowed';
  end if;
  update attendance_sessions set closed_at = now() where id = p_session and closed_at is null;
end $$;

-- open sessions this student can check into (their class, or approved priority courses)
create or replace function public.my_open_sessions() returns setof jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', s.id, 'course_code', c.code, 'course_title', c.title, 'venue', s.venue, 'opened_at', s.opened_at)
  from attendance_sessions s join courses c on c.id = s.course_id
  where s.closed_at is null and s.opened_at > now() - interval '6 hours'
    and (s.class_id = (select class_id from profiles where id = auth.uid())
         or exists (select 1 from priority_registrations pr where pr.user_id = auth.uid() and pr.course_id = s.course_id and pr.class_id = s.class_id and pr.status = 'approved'))
  order by s.opened_at desc;
$$;

create or replace function private.eligible_entry(p_session attendance_sessions, p_user uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select c.entry_id from claims c join class_list_entries e on e.id = c.entry_id where c.user_id = p_user and e.class_id = p_session.class_id),
    (select c.entry_id from claims c where c.user_id = p_user
       and exists (select 1 from priority_registrations pr where pr.user_id = p_user and pr.course_id = p_session.course_id and pr.class_id = p_session.class_id and pr.status = 'approved')));
$$;

-- The pass: valid for the current 30-second window. QR content = "<session>.<user>.<window>.<sig>"
create or replace function public.pass_token(p_session uuid) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare s attendance_sessions; v_window bigint := floor(extract(epoch from now()) / 30); v_secret bytea; v_msg text;
begin
  select * into s from attendance_sessions where id = p_session and closed_at is null;
  if s.id is null then return jsonb_build_object('status', 'closed'); end if;
  if not exists (select 1 from claims where user_id = auth.uid()) then return jsonb_build_object('status', 'claim_first'); end if;
  if private.eligible_entry(s, auth.uid()) is null then return jsonb_build_object('status', 'not_registered'); end if;
  select value into v_secret from private.settings where key = 'pass_secret';
  v_msg := s.id || '.' || auth.uid() || '.' || v_window;
  return jsonb_build_object('status', 'ok', 'token', v_msg || '.' || left(encode(private.hmac_sha256(v_secret, convert_to(v_msg, 'UTF8')), 'hex'), 32),
                            'expires_in', 30 - (floor(extract(epoch from now()))::bigint % 30));
end $$;

-- Mark one person on the register present.
create or replace function private.record_entry(s attendance_sessions, p_entry uuid, p_method text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e class_list_entries; v_at timestamptz;
begin
  select * into e from class_list_entries where id = p_entry;
  select scanned_at into v_at from attendance_records where session_id = s.id and entry_id = p_entry;
  if v_at is not null then
    return jsonb_build_object('status', 'already', 'name', e.surname || ' ' || e.first_name, 'matric', e.matric, 'at', v_at);
  end if;
  insert into attendance_records(session_id, entry_id, user_id, method, scanned_by)
  values (s.id, p_entry, (select user_id from claims where entry_id = p_entry), p_method, auth.uid());
  return jsonb_build_object('status', 'present', 'name', e.surname || ' ' || e.first_name, 'matric', e.matric,
                            'level', (select k.level || 'L ' || k.department_code from classes k where k.id = e.class_id));
end $$;

create or replace function private.record(s attendance_sessions, p_user uuid, p_method text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_entry uuid;
begin
  v_entry := private.eligible_entry(s, p_user);
  if v_entry is null then return jsonb_build_object('status', 'not_registered'); end if;
  return private.record_entry(s, v_entry, p_method);
end $$;

create or replace function public.record_scan(p_token text) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare parts text[]; s attendance_sessions; v_user uuid; v_window bigint; v_now bigint := floor(extract(epoch from now()) / 30); v_secret bytea; v_msg text;
begin
  parts := string_to_array(p_token, '.');
  if array_length(parts, 1) <> 4 then return jsonb_build_object('status', 'invalid'); end if;
  begin
    select * into s from attendance_sessions where id = parts[1]::uuid;
    v_user := parts[2]::uuid; v_window := parts[3]::bigint;
  exception when others then return jsonb_build_object('status', 'invalid');
  end;
  if s.id is null then return jsonb_build_object('status', 'invalid'); end if;
  if s.closed_at is not null then return jsonb_build_object('status', 'closed'); end if;
  if not (is_hoc(s.class_id) or exists (select 1 from course_lecturers where course_id = s.course_id and user_id = auth.uid() and confirmed)) then
    return jsonb_build_object('status', 'not_allowed');
  end if;
  select value into v_secret from private.settings where key = 'pass_secret';
  v_msg := parts[1] || '.' || parts[2] || '.' || parts[3];
  if left(encode(private.hmac_sha256(v_secret, convert_to(v_msg, 'UTF8')), 'hex'), 32) <> parts[4] then
    return jsonb_build_object('status', 'invalid');
  end if;
  if v_window < v_now - 1 or v_window > v_now then return jsonb_build_object('status', 'expired'); end if;
  return private.record(s, v_user, 'scan');
end $$;

-- HOC types a matric number (dead phone, no data)
create or replace function public.record_typed(p_session uuid, p_matric text) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare s attendance_sessions; v_entry uuid; v_matric text := regexp_replace(coalesce(p_matric, ''), '\D', '', 'g');
begin
  select * into s from attendance_sessions where id = p_session;
  if s.id is null or s.closed_at is not null then return jsonb_build_object('status', 'closed'); end if;
  if not (is_hoc(s.class_id) or exists (select 1 from course_lecturers where course_id = s.course_id and user_id = auth.uid() and confirmed)) then
    return jsonb_build_object('status', 'not_allowed');
  end if;
  -- anyone on this class's list, claimed or not (students without a phone still count)
  select id into v_entry from class_list_entries where class_id = s.class_id and matric = v_matric;
  if v_entry is null then
    -- or a carryover student approved for this course
    select c.entry_id into v_entry from claims c join class_list_entries e on e.id = c.entry_id
    join priority_registrations pr on pr.user_id = c.user_id and pr.course_id = s.course_id and pr.class_id = s.class_id and pr.status = 'approved'
    where e.matric = v_matric;
  end if;
  if v_entry is null then return jsonb_build_object('status', 'not_registered', 'matric', v_matric); end if;
  return private.record_entry(s, v_entry, 'typed');
end $$;

create or replace function public.session_attendance(p_session uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s attendance_sessions;
begin
  select * into s from attendance_sessions where id = p_session;
  if s.id is null then raise exception 'No such session'; end if;
  if not (can_see_class(s.class_id) or s.opened_by = auth.uid()) then raise exception 'Not allowed'; end if;
  return (
    -- the register: the class list plus carryover students the HOC approved for this course
    with roster as (
      select e.id, e.surname, e.first_name, e.matric, false as carryover from class_list_entries e where e.class_id = s.class_id
      union
      select e.id, e.surname, e.first_name, e.matric, true from priority_registrations pr
        join claims c on c.user_id = pr.user_id join class_list_entries e on e.id = c.entry_id
        where pr.course_id = s.course_id and pr.class_id = s.class_id and pr.status = 'approved'
    )
    select jsonb_build_object(
      'session', jsonb_build_object('id', s.id, 'venue', s.venue, 'opened_at', s.opened_at, 'closed_at', s.closed_at,
                                    'course', (select code from courses where id = s.course_id)),
      'present', (select count(*) from attendance_records where session_id = s.id),
      'on_list', (select count(*) from roster),
      'typed', (select count(*) from attendance_records where session_id = s.id and method = 'typed'),
      'records', coalesce((select jsonb_agg(jsonb_build_object('name', e.surname || ' ' || e.first_name, 'matric', e.matric, 'method', r.method,
                                    'at', r.scanned_at, 'by', (select display_name from profiles where id = r.scanned_by)) order by r.scanned_at desc)
                           from attendance_records r left join class_list_entries e on e.id = r.entry_id where r.session_id = s.id), '[]'::jsonb),
      'absent', coalesce((select jsonb_agg(jsonb_build_object('name', ro.surname || ' ' || ro.first_name, 'matric', ro.matric, 'carryover', ro.carryover) order by ro.surname, ro.first_name)
                          from roster ro where not exists (select 1 from attendance_records r where r.session_id = s.id and r.entry_id = ro.id)), '[]'::jsonb)));
end $$;

-- --- admin overview (counts only)
create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  return jsonb_build_object(
    'classes', (select count(*) from classes where session = '2026/2027'),
    'lists_uploaded', (select count(distinct class_id) from class_list_entries),
    'students_on_lists', (select count(*) from class_list_entries),
    'claimed', (select count(*) from claims),
    'hoc_requests', (select count(*) from hoc_requests where status = 'open'),
    'open_clashes', (select count(*) from inbox_items where kind = 'clash' and status = 'open'),
    'by_class', coalesce((select jsonb_agg(x order by x->>'class') from (
        select jsonb_build_object('class_id', k.id, 'class', k.level || 'L ' || k.department_code,
          'hocs', (select coalesce(jsonb_agg(p.display_name), '[]'::jsonb) from class_hocs h join profiles p on p.id = h.user_id where h.class_id = k.id),
          'students', (select count(*) from class_list_entries e where e.class_id = k.id),
          'claimed', (select count(*) from claims c join class_list_entries e on e.id = c.entry_id where e.class_id = k.id),
          'clashes', (select count(*) from inbox_items i where i.class_id = k.id and i.kind = 'clash' and i.status = 'open')) x
        from classes k where k.session = '2026/2027') t), '[]'::jsonb));
end $$;

create or replace function public.admin_hoc_requests() returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  return query select jsonb_build_object('id', r.id, 'name', p.display_name, 'email', p.email, 'class', k.level || 'L ' || k.department_code,
    'class_id', r.class_id, 'phone', r.phone, 'confirmer', r.confirmer, 'created_at', r.created_at,
    'current_hocs', (select count(*) from class_hocs h where h.class_id = r.class_id),
    'claimed', exists (select 1 from claims c where c.user_id = r.user_id))
  from hoc_requests r join profiles p on p.id = r.user_id join classes k on k.id = r.class_id
  where r.status = 'open' order by r.created_at;
end $$;

-- --- account deletion (removes the auth user; everything else cascades)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- --- lecturers: an HOC of a class taking the course confirms "yes, this person teaches us"
create or replace function public.pending_lecturers(p_class uuid) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_hoc(p_class) then raise exception 'Only HOCs of this class'; end if;
  return query select jsonb_build_object('course_id', cl.course_id, 'user_id', cl.user_id, 'name', p.display_name,
                                         'course', c.code, 'title', c.title)
  from course_lecturers cl join class_courses cc on cc.course_id = cl.course_id and cc.class_id = p_class
  join profiles p on p.id = cl.user_id join courses c on c.id = cl.course_id
  where not cl.confirmed;
end $$;

create or replace function public.confirm_lecturer(p_course uuid, p_user uuid, p_confirm boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from class_courses cc where cc.course_id = p_course and is_hoc(cc.class_id)) then
    raise exception 'Only an HOC of a class taking this course can confirm its lecturer';
  end if;
  if p_confirm then update course_lecturers set confirmed = true where course_id = p_course and user_id = p_user;
  else delete from course_lecturers where course_id = p_course and user_id = p_user; end if;
end $$;

-- --- HOC views that need names from other people's profiles
create or replace function public.class_priority_students(p_class uuid) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not can_see_class(p_class) then raise exception 'Only HOCs and lecturers of this class'; end if;
  return query select jsonb_build_object('registration', pr.id, 'status', pr.status, 'course', c.code,
      'name', e.surname || ' ' || e.first_name, 'matric', e.matric, 'from_class', k.level || 'L ' || k.department_code)
    from priority_registrations pr join courses c on c.id = pr.course_id
    join claims cl on cl.user_id = pr.user_id join class_list_entries e on e.id = cl.entry_id join classes k on k.id = e.class_id
    where pr.class_id = p_class and pr.status = 'approved' order by e.surname;
end $$;

create or replace function public.class_history(p_class uuid) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not can_see_class(p_class) then raise exception 'Only HOCs and lecturers of this class'; end if;
  return query select jsonb_build_object('action', le.action, 'detail', le.detail, 'at', le.created_at,
      'by', case when le.actor = auth.uid() then 'You' else coalesce(p.display_name, 'Someone') end)
    from list_events le left join profiles p on p.id = le.actor where le.class_id = p_class order by le.created_at desc limit 200;
end $$;

-- ============================================================ grants
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
