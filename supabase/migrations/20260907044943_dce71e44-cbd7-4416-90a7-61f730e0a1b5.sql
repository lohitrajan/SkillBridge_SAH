insert into public.applications (job_id, student_id, status, match_score, note)
select j.id, s.id, v.status, v.score, null
from public.job_postings j
join public.companies c on c.id = j.company_id and c.owner_id is not null
join (values ('Dev Patel','applied',82),('Rahul Verma','under_review',74),('Priya Sharma','shortlisted',68)) as v(sname,status,score) on true
join public.students s on s.full_name = v.sname
where j.title = 'React Developer Intern'
on conflict do nothing;