with d as (select id, row_number() over (partition by job_id, student_id order by created_at) rn from public.applications)
delete from public.applications a using d where a.id = d.id and d.rn > 1;
create unique index if not exists applications_job_student_uniq on public.applications (job_id, student_id);