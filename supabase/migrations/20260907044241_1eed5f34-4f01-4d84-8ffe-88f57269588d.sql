
-- SKILLS
insert into public.skills (name, category, demand_level, demand_score) values
 ('React','Frontend','high',92),('TypeScript','Frontend','high',90),('JavaScript','Frontend','high',88),
 ('HTML/CSS','Frontend','medium',70),('Node.js','Backend','high',86),('Python','Backend','high',94),
 ('SQL','Data','high',89),('PostgreSQL','Data','high',80),('MongoDB','Data','medium',68),
 ('Machine Learning','AI/ML','high',93),('Deep Learning','AI/ML','high',85),('NLP','AI/ML','medium',74),
 ('Data Analysis','Data','high',82),('Power BI','Data','medium',66),('Docker','DevOps','high',81),
 ('Kubernetes','DevOps','medium',72),('AWS','Cloud','high',91),('Azure','Cloud','medium',75),
 ('Git','Tools','high',87),('REST APIs','Backend','high',84),('Java','Backend','high',83),
 ('Spring Boot','Backend','medium',73),('Flutter','Mobile','medium',69),('Android','Mobile','medium',67),
 ('Cybersecurity','Security','high',85),('Linux','DevOps','medium',71),
 ('Communication','Soft Skills','high',88),('Problem Solving','Soft Skills','high',90),
 ('Teamwork','Soft Skills','medium',78),('Presentation','Soft Skills','medium',65)
on conflict do nothing;

-- ROLE TEMPLATES
insert into public.role_templates (title, description, required_skills, preferred_skills) values
 ('Full Stack Developer','Builds end-to-end web products across UI and services.',
   array['React','TypeScript','Node.js','SQL','Git'], array['Docker','AWS','REST APIs']),
 ('Data Analyst','Turns raw data into decisions with dashboards and analysis.',
   array['SQL','Python','Data Analysis','Communication'], array['Power BI','PostgreSQL']),
 ('Machine Learning Engineer','Trains and ships models into production systems.',
   array['Python','Machine Learning','SQL','Problem Solving'], array['Deep Learning','NLP','Docker','AWS']),
 ('Backend Engineer','Designs reliable services and APIs at scale.',
   array['Node.js','SQL','REST APIs','Git'], array['Docker','Kubernetes','AWS','Java']),
 ('Cloud/DevOps Engineer','Automates delivery and keeps platforms healthy.',
   array['Linux','Docker','AWS','Git'], array['Kubernetes','Azure']),
 ('Cybersecurity Analyst','Protects systems and responds to threats.',
   array['Cybersecurity','Linux','Problem Solving'], array['Python','AWS']);

-- COLLEGES
insert into public.colleges (name, institution_type, location, contact_person, official_email, website, is_demo) values
 ('Sunrise Institute of Technology','Engineering College','Chennai','Dr. Iyer','principal@sit.edu','https://sit.edu',true),
 ('Meridian University','University','Hyderabad','Prof. Kavita Rao','registrar@meridian.edu','https://meridian.edu',true),
 ('Coastal Polytechnic','Polytechnic','Kochi','Anil Thomas','office@coastalpoly.edu','https://coastalpoly.edu',true);

-- COMPANIES
insert into public.companies (name, sector, company_size, location, recruiter_name, recruiter_email, website, about, is_demo) values
 ('Aurora Analytics','Information Technology','201-500','Bengaluru','Ritu Shah','hiring@auroraanalytics.com','https://auroraanalytics.com','Data and AI consultancy for enterprise clients.',true),
 ('Vertex Cloud','Cloud Services','501-1000','Pune','Sameer Khan','careers@vertexcloud.io','https://vertexcloud.io','Managed cloud and DevOps platform provider.',true),
 ('Finlytic','Fintech','51-200','Mumbai','Priya Nair','talent@finlytic.in','https://finlytic.in','Payments infrastructure for emerging markets.',true),
 ('MedNova Health','Healthcare Tech','51-200','Hyderabad','Arjun Das','jobs@mednova.health','https://mednova.health','Clinical data platforms for hospitals.',true);

-- SKILL DEMAND SNAPSHOTS
insert into public.skill_demand (skill_id, industry, location, period, demand_score, openings)
select s.id, i.industry, i.loc, '2026-Q3', greatest(40, least(99, s.demand_score + i.delta)), (s.demand_score/6 + i.delta)::int
from public.skills s
cross join (values ('Information Technology','Bengaluru',4),('Fintech','Mumbai',-3),('Cloud Services','Pune',2),('Healthcare Tech','Hyderabad',-5)) as i(industry,loc,delta)
where s.category in ('Frontend','Backend','Data','AI/ML','Cloud','DevOps','Security');

-- JOB POSTINGS (demo companies + the signed-up recruiter's company if present)
insert into public.job_postings (company_id, title, opportunity_type, description, location, work_mode, stipend, salary, duration, deadline, min_qualification, graduation_year, experience, openings, status, is_demo)
select c.id, v.title, v.otype, v.descr, v.loc, v.mode, v.stipend, v.salary, v.dur, current_date + v.days, v.qual, 2026, v.exp, v.openings, 'open', true
from (values
 ('Aurora Analytics','Data Analyst Intern','Internship','Work with the analytics pod on dashboards, SQL models and client reporting.','Bengaluru','Hybrid','₹25,000/month',null,'6 months',30,'B.Tech / B.Sc','Fresher',4),
 ('Aurora Analytics','Machine Learning Engineer','Full-time','Build and deploy ML pipelines for forecasting and recommendation products.','Bengaluru','On-site',null,'₹12-18 LPA',null,45,'B.Tech','0-2 years',2),
 ('Vertex Cloud','Cloud Support Intern','Internship','Assist the platform team with container workloads, monitoring and incident triage.','Pune','Remote','₹20,000/month',null,'3 months',20,'B.Tech / Diploma','Fresher',6),
 ('Vertex Cloud','Backend Engineer','Full-time','Design and operate high-throughput APIs on Kubernetes.','Pune','Hybrid',null,'₹10-16 LPA',null,40,'B.Tech','1-3 years',3),
 ('Finlytic','Full Stack Developer Intern','Internship','Ship product features across React and Node services for payment flows.','Mumbai','Hybrid','₹30,000/month',null,'6 months',25,'Any graduate','Fresher',5),
 ('Finlytic','Frontend Engineer','Full-time','Own the merchant dashboard experience end to end.','Mumbai','Remote',null,'₹9-14 LPA',null,50,'B.Tech / BCA','0-2 years',2),
 ('MedNova Health','Python Developer Intern','Internship','Automate clinical data ingestion and validation pipelines.','Hyderabad','On-site','₹18,000/month',null,'4 months',18,'B.Tech / M.Sc','Fresher',3),
 ('MedNova Health','Cybersecurity Analyst','Full-time','Monitor and harden healthcare data infrastructure.','Hyderabad','On-site',null,'₹8-12 LPA',null,35,'B.Tech','0-3 years',1)
) as v(company,title,otype,descr,loc,mode,stipend,salary,dur,days,qual,exp,openings)
join public.companies c on c.name = v.company;

insert into public.job_postings (company_id, title, opportunity_type, description, location, work_mode, stipend, duration, deadline, min_qualification, graduation_year, experience, openings, status, is_demo)
select c.id, 'React Developer Intern','Internship','Build customer-facing dashboards with React and TypeScript alongside senior engineers.', coalesce(nullif(c.location,''),'Pune'),'Hybrid','₹28,000/month','6 months', current_date + 28,'B.Tech / BCA',2026,'Fresher',3,'open',false
from public.companies c where c.owner_id is not null;

-- JOB SKILLS
insert into public.job_skills (job_id, skill_id, is_required)
select j.id, s.id, m.req from public.job_postings j
join (values
 ('Data Analyst Intern','SQL',true),('Data Analyst Intern','Python',true),('Data Analyst Intern','Data Analysis',true),('Data Analyst Intern','Power BI',false),('Data Analyst Intern','Communication',false),
 ('Machine Learning Engineer','Python',true),('Machine Learning Engineer','Machine Learning',true),('Machine Learning Engineer','SQL',true),('Machine Learning Engineer','Deep Learning',false),('Machine Learning Engineer','AWS',false),
 ('Cloud Support Intern','Linux',true),('Cloud Support Intern','Docker',true),('Cloud Support Intern','AWS',false),('Cloud Support Intern','Problem Solving',false),
 ('Backend Engineer','Node.js',true),('Backend Engineer','SQL',true),('Backend Engineer','REST APIs',true),('Backend Engineer','Kubernetes',false),('Backend Engineer','Docker',false),
 ('Full Stack Developer Intern','React',true),('Full Stack Developer Intern','TypeScript',true),('Full Stack Developer Intern','Node.js',true),('Full Stack Developer Intern','Git',false),('Full Stack Developer Intern','PostgreSQL',false),
 ('Frontend Engineer','React',true),('Frontend Engineer','JavaScript',true),('Frontend Engineer','HTML/CSS',true),('Frontend Engineer','TypeScript',false),
 ('Python Developer Intern','Python',true),('Python Developer Intern','SQL',true),('Python Developer Intern','Git',false),
 ('Cybersecurity Analyst','Cybersecurity',true),('Cybersecurity Analyst','Linux',true),('Cybersecurity Analyst','Python',false),
 ('React Developer Intern','React',true),('React Developer Intern','TypeScript',true),('React Developer Intern','Git',false),('React Developer Intern','REST APIs',false)
) as m(job_title, skill_name, req) on m.job_title = j.title
join public.skills s on s.name = m.skill_name
on conflict do nothing;

-- ASSESSMENTS
insert into public.assessments (title, category, skill_id, description, duration_minutes)
select v.title, v.cat, s.id, v.descr, v.mins
from (values
 ('React Fundamentals','Frontend','React','Components, state, hooks and rendering behaviour.',15),
 ('SQL for Analysts','Data','SQL','Joins, aggregation, filtering and query reasoning.',15),
 ('Python Essentials','Backend','Python','Core syntax, data structures and standard library.',15),
 ('Machine Learning Basics','AI/ML','Machine Learning','Supervised learning, evaluation and overfitting.',15),
 ('Cloud & DevOps Foundations','Cloud','AWS','Containers, CI/CD and cloud service basics.',15),
 ('Communication at Work','Soft Skills','Communication','Workplace writing, clarity and collaboration.',10)
) as v(title,cat,skill,descr,mins)
join public.skills s on s.name = v.skill;

-- ASSESSMENT QUESTIONS
insert into public.assessment_questions (assessment_id, question, options, correct_index, topic, question_type, position)
select a.id, q.question, q.options::jsonb, q.correct, q.topic, 'mcq', q.pos
from (values
 ('React Fundamentals','Which hook stores local component state?','["useEffect","useState","useMemo","useRef"]',1,'Hooks',1),
 ('React Fundamentals','What does the dependency array of useEffect control?','["Styling","When the effect re-runs","Component name","Prop types"]',1,'Hooks',2),
 ('React Fundamentals','Keys in a list help React to…','["Sort items","Identify changed items","Style items","Fetch data"]',1,'Rendering',3),
 ('React Fundamentals','Props in React are…','["Mutable by the child","Read-only for the child","Global state","CSS classes"]',1,'Components',4),
 ('React Fundamentals','Which is a valid way to render conditionally?','["for loop in JSX","{cond && <A/>}","if inside JSX attributes","switch in JSX text"]',1,'Rendering',5),
 ('SQL for Analysts','Which join keeps all rows from the left table?','["INNER JOIN","LEFT JOIN","CROSS JOIN","SELF JOIN"]',1,'Joins',1),
 ('SQL for Analysts','GROUP BY is used to…','["Sort rows","Aggregate rows by column values","Delete rows","Rename columns"]',1,'Aggregation',2),
 ('SQL for Analysts','Which filters groups after aggregation?','["WHERE","HAVING","LIMIT","ORDER BY"]',1,'Aggregation',3),
 ('SQL for Analysts','COUNT(*) counts…','["Distinct values","All rows including NULLs","Only non-null columns","Only indexed rows"]',1,'Aggregation',4),
 ('SQL for Analysts','An index mainly improves…','["Storage size","Read/query speed","Data accuracy","Backup speed"]',1,'Performance',5),
 ('Python Essentials','Which type is immutable?','["list","dict","tuple","set"]',2,'Data types',1),
 ('Python Essentials','len("skill") returns…','["4","5","6","Error"]',1,'Strings',2),
 ('Python Essentials','A list comprehension produces…','["A generator always","A new list","A dictionary","A tuple"]',1,'Syntax',3),
 ('Python Essentials','Which keyword defines a function?','["func","def","lambda only","function"]',1,'Functions',4),
 ('Python Essentials','try/except is used for…','["Loops","Error handling","Imports","Typing"]',1,'Errors',5),
 ('Machine Learning Basics','Overfitting means the model…','["Underperforms on training data","Memorises training data and generalises poorly","Has too few parameters","Trains too fast"]',1,'Model quality',1),
 ('Machine Learning Basics','Which is a supervised task?','["Clustering","Classification","Dimensionality reduction","Association mining"]',1,'Fundamentals',2),
 ('Machine Learning Basics','A validation set is used to…','["Train weights","Tune and check generalisation","Report final marketing numbers","Store raw data"]',1,'Evaluation',3),
 ('Machine Learning Basics','Accuracy is a poor metric when…','["Classes are balanced","Classes are heavily imbalanced","Data is numeric","Features are scaled"]',1,'Evaluation',4),
 ('Machine Learning Basics','Feature scaling matters most for…','["Decision trees","Distance-based models","Random forests","Rule engines"]',1,'Preprocessing',5),
 ('Cloud & DevOps Foundations','A container image is…','["A running process","A packaged filesystem and config","A virtual machine","A cloud region"]',1,'Containers',1),
 ('Cloud & DevOps Foundations','CI/CD primarily improves…','["Manual approvals","Automated build and delivery","Server pricing","Disk usage"]',1,'CI/CD',2),
 ('Cloud & DevOps Foundations','Object storage in AWS is…','["EC2","S3","RDS","IAM"]',1,'Cloud services',3),
 ('Cloud & DevOps Foundations','Kubernetes schedules workloads as…','["Pods","Buckets","Lambdas","Tables"]',0,'Orchestration',4),
 ('Cloud & DevOps Foundations','Infrastructure as Code means…','["Manual console setup","Declaring infra in versioned files","Writing app code only","Using spreadsheets"]',1,'Automation',5),
 ('Communication at Work','A good status update leads with…','["Background history","The outcome and any blocker","Tool names","Apologies"]',1,'Writing',1),
 ('Communication at Work','Active listening includes…','["Interrupting to speed up","Summarising back what you heard","Ignoring questions","Multitasking"]',1,'Listening',2),
 ('Communication at Work','When you miss a deadline you should…','["Stay quiet until asked","Flag early with a revised plan","Blame dependencies","Send a long essay"]',1,'Ownership',3),
 ('Communication at Work','Clear writing prefers…','["Long passive sentences","Short specific sentences","Heavy jargon","No structure"]',1,'Writing',4)
) as q(atitle,question,options,correct,topic,pos)
join public.assessments a on a.title = q.atitle;

-- DEMO STUDENTS
insert into public.students (full_name, email, phone, college_id, department, degree, year, graduation_year, location, interests, target_role, headline, readiness_score, technical_score, soft_skills_score, projects_score, certifications_score, exposure_score, is_demo)
select v.name, v.email, v.phone, c.id, v.dept, v.degree, v.year, v.grad, v.loc, v.interests, v.target, v.headline, v.readiness, v.tech, v.soft, v.proj, v.cert, v.exp, true
from (values
 ('Priya Sharma','priya.sharma@demo.sit.edu','9800000001','Sunrise Institute of Technology','Computer Science','B.Tech',4,2026,'Chennai',array['AI','Data'],'Data Analyst','Aspiring data analyst · SQL + Python',78,80,74,76,70,72),
 ('Rahul Verma','rahul.verma@demo.sit.edu','9800000002','Sunrise Institute of Technology','Information Technology','B.Tech',3,2027,'Chennai',array['Web','Cloud'],'Full Stack Developer','React and Node builder',66,70,64,68,55,60),
 ('Ananya Nair','ananya.nair@demo.meridian.edu','9800000003','Meridian University','Computer Science','M.Tech',2,2026,'Hyderabad',array['AI','ML'],'Machine Learning Engineer','ML research + applied projects',84,88,78,82,80,79),
 ('Karthik Reddy','karthik.reddy@demo.meridian.edu','9800000004','Meridian University','Electronics','B.Tech',4,2026,'Hyderabad',array['Cloud','DevOps'],'Cloud/DevOps Engineer','Containers, CI/CD, Linux',59,62,58,55,50,54),
 ('Meera Joseph','meera.joseph@demo.coastalpoly.edu','9800000005','Coastal Polytechnic','Computer Engineering','B.Sc',3,2027,'Kochi',array['Security'],'Cybersecurity Analyst','Security enthusiast, CTF player',52,55,60,48,40,45),
 ('Dev Patel','dev.patel@demo.sit.edu','9800000006','Sunrise Institute of Technology','Computer Science','B.Tech',4,2026,'Chennai',array['Web'],'Frontend Engineer','UI engineer in the making',71,73,70,72,62,68)
) as v(name,email,phone,college,dept,degree,year,grad,loc,interests,target,headline,readiness,tech,soft,proj,cert,exp)
join public.colleges c on c.name = v.college;

-- DEMO STUDENT SKILLS
insert into public.student_skills (student_id, skill_id, proficiency, proficiency_score, verified, verification_source, assessment_score, last_verified_at)
select st.id, sk.id,
  case when x.score >= 80 then 'advanced' when x.score >= 60 then 'intermediate' else 'beginner' end,
  x.score, x.score >= 70, case when x.score >= 70 then 'assessment' else null end,
  case when x.score >= 70 then x.score else null end,
  case when x.score >= 70 then now() - interval '10 days' else null end
from (values
 ('Priya Sharma','SQL',85),('Priya Sharma','Python',78),('Priya Sharma','Data Analysis',80),('Priya Sharma','Communication',72),('Priya Sharma','Power BI',55),
 ('Rahul Verma','React',72),('Rahul Verma','JavaScript',75),('Rahul Verma','Node.js',60),('Rahul Verma','Git',68),('Rahul Verma','SQL',52),
 ('Ananya Nair','Python',92),('Ananya Nair','Machine Learning',88),('Ananya Nair','Deep Learning',80),('Ananya Nair','SQL',74),('Ananya Nair','Problem Solving',85),
 ('Karthik Reddy','Linux',70),('Karthik Reddy','Docker',62),('Karthik Reddy','AWS',55),('Karthik Reddy','Git',66),
 ('Meera Joseph','Cybersecurity',64),('Meera Joseph','Linux',58),('Meera Joseph','Python',50),
 ('Dev Patel','React',80),('Dev Patel','HTML/CSS',85),('Dev Patel','JavaScript',78),('Dev Patel','TypeScript',62),('Dev Patel','Git',70)
) as x(sname,skill,score)
join public.students st on st.full_name = x.sname
join public.skills sk on sk.name = x.skill
on conflict do nothing;

-- DEMO PROJECTS
insert into public.projects (student_id, title, description, technologies, github_url, role, duration)
select st.id, p.title, p.descr, p.tech, p.url, p.role, p.dur
from (values
 ('Priya Sharma','Campus Placement Dashboard','Interactive dashboard analysing five years of placement data.',array['Python','SQL','Power BI'],'https://github.com/demo/placement-dashboard','Analyst','2 months'),
 ('Rahul Verma','Hostel Mess Feedback App','React and Node app collecting daily meal feedback.',array['React','Node.js','PostgreSQL'],'https://github.com/demo/mess-feedback','Full stack','3 months'),
 ('Ananya Nair','Crop Disease Classifier','CNN model classifying leaf disease from field photos.',array['Python','Deep Learning'],'https://github.com/demo/crop-classifier','ML engineer','4 months'),
 ('Dev Patel','Accessible Component Library','Reusable accessible React components with docs.',array['React','TypeScript','HTML/CSS'],'https://github.com/demo/a11y-kit','Frontend','2 months')
) as p(sname,title,descr,tech,url,role,dur)
join public.students st on st.full_name = p.sname;

-- DEMO CERTIFICATIONS
insert into public.certifications (student_id, name, issuer, issued_on, credential_url)
select st.id, c.name, c.issuer, current_date - c.ago, c.url
from (values
 ('Priya Sharma','Google Data Analytics','Coursera',120,'https://coursera.org/verify/demo1'),
 ('Ananya Nair','TensorFlow Developer','Google',200,'https://coursera.org/verify/demo2'),
 ('Karthik Reddy','AWS Cloud Practitioner','Amazon Web Services',90,'https://aws.amazon.com/verify/demo3')
) as c(sname,name,issuer,ago,url)
join public.students st on st.full_name = c.sname;

-- APPLICATIONS FROM DEMO STUDENTS
insert into public.applications (job_id, student_id, status, match_score, note)
select j.id, st.id, a.status, a.score, a.note
from (values
 ('Priya Sharma','Data Analyst Intern','shortlisted',86,'Strong SQL and reporting portfolio.'),
 ('Ananya Nair','Machine Learning Engineer','interview',91,'Scheduled for technical round.'),
 ('Rahul Verma','Full Stack Developer Intern','under_review',72,null),
 ('Dev Patel','Frontend Engineer','applied',75,null),
 ('Karthik Reddy','Cloud Support Intern','applied',64,null),
 ('Meera Joseph','Cybersecurity Analyst','rejected',48,'Needs more hands-on security experience.'),
 ('Priya Sharma','Python Developer Intern','selected',80,'Offer released.')
) as a(sname,jtitle,status,score,note)
join public.students st on st.full_name = a.sname
join public.job_postings j on j.title = a.jtitle;

-- TRAINING PROGRAMS
insert into public.training_programs (college_id, title, target_skill_id, description, eligibility, duration_weeks, starts_on, status)
select c.id, t.title, s.id, t.descr, t.elig, t.weeks, current_date + t.days, 'open'
from (values
 ('Sunrise Institute of Technology','SQL Bootcamp for Analysts','SQL','Hands-on querying, modelling and reporting.','3rd and 4th year, any branch',6,14),
 ('Sunrise Institute of Technology','Modern React Intensive','React','Component design, hooks and production patterns.','2nd year onwards',8,21),
 ('Meridian University','Applied Machine Learning','Machine Learning','From data prep to model deployment.','Final year / PG',10,10),
 ('Coastal Polytechnic','Cloud Foundations','AWS','Core cloud services, Linux and containers.','All years',6,30)
) as t(college,title,skill,descr,elig,weeks,days)
join public.colleges c on c.name = t.college
join public.skills s on s.name = t.skill;

-- TRAINING ENROLLMENTS
insert into public.training_enrollments (program_id, student_id, status)
select p.id, st.id, 'enrolled'
from public.training_programs p
join public.colleges c on c.id = p.college_id
join public.students st on st.college_id = c.id
where p.title in ('SQL Bootcamp for Analysts','Applied Machine Learning','Cloud Foundations')
limit 12;

-- PLACEMENT DRIVES
insert into public.placement_drives (college_id, company_id, role_title, drive_date, eligible_count, applied_count, shortlisted_count, selected_count, status)
select c.id, co.id, d.role, current_date + d.days, d.elig, d.app, d.shl, d.sel, d.status
from (values
 ('Sunrise Institute of Technology','Aurora Analytics','Data Analyst Intern',12,120,84,26,9,'scheduled'),
 ('Sunrise Institute of Technology','Finlytic','Full Stack Developer Intern',-20,95,70,22,7,'completed'),
 ('Meridian University','Aurora Analytics','Machine Learning Engineer',18,60,41,15,4,'scheduled'),
 ('Meridian University','Vertex Cloud','Backend Engineer',-8,88,55,19,6,'completed'),
 ('Coastal Polytechnic','Vertex Cloud','Cloud Support Intern',25,140,90,30,11,'scheduled')
) as d(college,company,role,days,elig,app,shl,sel,status)
join public.colleges c on c.name = d.college
join public.companies co on co.name = d.company;
