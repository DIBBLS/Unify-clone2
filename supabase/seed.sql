-- Reference data for LASU Faculty of Engineering, 2026/2027. Safe to run more than once.
insert into public.departments(code, name) values
  ('ECE', 'Electronic and Computer Engineering'),
  ('MEE', 'Mechanical Engineering'),
  ('CHE', 'Chemical Engineering'),
  ('CVE', 'Civil Engineering'),
  ('IPE', 'Industrial and Production Engineering')
on conflict (code) do nothing;

insert into public.classes(department_code, level, session)
select d.code, l.level, '2026/2027' from public.departments d cross join (values (100),(200),(300),(400),(500)) l(level)
on conflict do nothing;

insert into public.courses(code, title, units, department_code, level) values
  ('MEE 352', 'Energy Conservation', 3, 'MEE', 300),
  ('MEE 301', 'Engineering Mathematics III', 3, 'MEE', 300),
  ('MEE 203', 'Engineering Drawing II', 2, 'MEE', 200),
  ('ECE 305', 'Semiconductor Devices', 2, 'ECE', 300),
  ('ECE 303', 'Electrical Circuit Theory', 3, 'ECE', 300),
  ('ECE 307', 'Digital Electronics I', 2, 'ECE', 300),
  ('ECE 311', 'Measurement and Instrumentation', 3, 'ECE', 300)
on conflict (code) do nothing;

-- 300L ECE takes MEE 352, MEE 301 and its four ECE courses; 300L MEE and CHE share MEE 301; 200L MEE takes MEE 203.
insert into public.class_courses(class_id, course_id)
select k.id, c.id from public.classes k join public.courses c on
  (k.department_code = 'ECE' and k.level = 300 and c.code in ('MEE 352','MEE 301','ECE 305','ECE 303','ECE 307','ECE 311'))
  or (k.department_code = 'MEE' and k.level = 300 and c.code in ('MEE 352','MEE 301'))
  or (k.department_code = 'CHE' and k.level = 300 and c.code = 'MEE 301')
  or (k.department_code = 'MEE' and k.level = 200 and c.code = 'MEE 203')
where k.session = '2026/2027'
on conflict do nothing;
