# Remix of Remix of Remix of SkillMatch Connect

Build a complete, production-quality web application for SIH 2026 Problem Statement SIH26044:

"Portal for Academia–Industry Collaboration for Skill Mapping, Internships and Placement"

The application should NOT be a LinkedIn clone and should NOT primarily focus on social networking.

The core product idea is:

INDUSTRY REQUIREMENTS

        ↓

SKILL MAPPING

        ↓

STUDENT SKILL GAP ANALYSIS

        ↓

PERSONALIZED LEARNING ROADMAP

        ↓

SKILL VERIFICATION

        ↓

INTERNSHIP MATCHING

        ↓

PLACEMENT READINESS

        ↓

INDUSTRY HIRING

The platform connects three major stakeholders:

1. Students

2. Academia / Colleges

3. Industry / Recruiters

Create a modern, highly polished SaaS-style UI suitable for an SIH final-round demo.

PRODUCT NAME:

"SkillBridge"

Tagline:

"Bridging Campus Skills with Industry Needs"

Use a professional technology/education visual identity. Avoid copying LinkedIn's design, terminology, feed, connection system, or visual style.

==================================================

1. TECHNOLOGY STACK

==================================================

Use:

- React

- TypeScript

- Vite

- Tailwind CSS

- shadcn/ui

- Lucide icons

- Supabase for:

  - Authentication

  - PostgreSQL database

  - Row Level Security

  - Storage where required

- Recharts for analytics and charts

Use a clean modular architecture.

The application must be fully responsive:

- Desktop

- Tablet

- Mobile

Use reusable components rather than duplicating UI.

Use proper loading states, empty states, error states, success states, toast notifications, modal dialogs, confirmation dialogs and form validation.

Do not create fake buttons that do nothing.

Every major button must perform a meaningful action or navigate to a functional page.

==================================================

2. USER ROLES

==================================================

Implement role-based authentication with these roles:

A. STUDENT

B. COLLEGE / ACADEMIC ADMIN

C. INDUSTRY / RECRUITER

D. SUPER ADMIN

After login, redirect users to the correct dashboard based on their role.

Students must never access college or recruiter administration pages.

Recruiters must never access college administration pages.

College administrators must only manage their institution's data.

Super Admin can manage the entire platform.

Implement Supabase Row Level Security policies for role-based access.

==================================================

3. LANDING PAGE

==================================================

Create a highly polished landing page.

Hero section:

"From Skill Gap to Career Readiness"

Subheading:

"SkillBridge connects students, colleges and industries through verified skill mapping, personalized upskilling, internships and placement intelligence."

Primary CTA:

"Explore SkillBridge"

Secondary CTA:

"See How It Works"

Hero visual:

Show a visual pipeline:

Industry Demand

→ Skill Mapping

→ Skill Gap

→ Learning

→ Verification

→ Internship

→ Placement

Add a section:

"Why SkillBridge?"

Cards:

1. Industry-Driven Skills

2. Verified Skill Profiles

3. AI-Powered Skill Gap Analysis

4. Smart Internship Matching

5. College Skill Intelligence

6. Placement Readiness

Add a section:

"Not another job portal"

Explain:

"LinkedIn helps professionals network and discover opportunities. SkillBridge focuses on identifying what skills industry actually needs, measuring what students know, closing the skill gap, verifying skills and connecting placement-ready students with companies."

Add stakeholder section:

FOR STUDENTS

"Know exactly what you need to learn."

FOR COLLEGES

"Know what industry needs from your students."

FOR INDUSTRIES

"Find verified talent instead of relying only on resumes."

Add an end-to-end workflow section.

Add statistics cards with demo data:

- 12,450+ Students

- 320+ Industry Partners

- 85+ Colleges

- 2,800+ Verified Skills

Add footer with:

- About

- Contact

- Privacy

- Terms

- SIH 2026

- Ministry of Ayush

==================================================

4. AUTHENTICATION

==================================================

Create:

- Login

- Student registration

- College registration

- Industry registration

- Forgot password

- Reset password

- Logout

Registration should collect role-specific information.

STUDENT:

- Name

- Email

- Phone

- College

- Department

- Degree

- Year

- Graduation year

- Location

- Areas of interest

COLLEGE:

- Institution name

- Institution type

- Location

- Contact person

- Official email

- Website

INDUSTRY:

- Company name

- Industry sector

- Company size

- Location

- Recruiter name

- Recruiter email

- Website

After registration, show onboarding.

==================================================

5. STUDENT DASHBOARD

==================================================

Create a personalized student dashboard.

Header:

"Good morning, [Student Name]"

Show:

A. Placement Readiness Score

Example:

76%

Use a circular progress visualization.

Breakdown:

- Technical Skills: 82%

- Soft Skills: 70%

- Projects: 75%

- Certifications: 65%

- Industry Exposure: 60%

B. Skill Gap Summary

Example:

You are targeting:

"Full Stack Developer"

Required skills:

JavaScript ✓

React ✓

Node.js ✓

SQL ✓

REST API ✓

Docker ✗

AWS ✗

System Design ✗

Show:

"3 high-priority skills missing"

C. Recommended Actions

Examples:

- Complete Docker fundamentals

- Build a REST API project

- Take AWS Cloud assessment

- Apply for matching internships

D. Internship Matches

Show cards with:

- Company

- Role

- Location

- Required skills

- Match percentage

- Missing skills

- Application deadline

- Apply button

E. Recent Skill Verification

Show:

- Skill

- Score

- Verification method

- Status

- Date

==================================================

6. STUDENT PROFILE / SKILL PASSPORT

==================================================

Create a "Skill Passport" instead of a traditional social profile.

This is a major differentiator from LinkedIn.

Profile should contain:

Personal information

Education

Skills

Projects

Certifications

Assessments

Internships

Achievements

Skill verification

Placement readiness

For every skill show:

Skill name

Proficiency level

Verification status

Assessment score

Projects demonstrating the skill

Last verified date

Example:

Java

Advanced

✓ Verified

Assessment: 89%

Projects: 3

React

Intermediate

✓ Verified

Assessment: 81%

Projects: 2

AWS

Beginner

Not verified

Allow students to upload:

- Resume

- Certificates

- Project documents

Use Supabase Storage.

Create a downloadable "Skill Passport" style profile.

==================================================

7. SKILL ASSESSMENT SYSTEM

==================================================

Create a skill assessment module.

Students can select:

- Programming

- Database

- Web Development

- Cloud

- AI/ML

- Cybersecurity

- Data Science

- Communication

- Aptitude

Assessment page should display questions.

Support:

- MCQ

- Coding-style questions as simulated assessment

- Scenario-based questions

Track:

- Score

- Accuracy

- Time

- Skill level

Levels:

0-39 = Beginner

40-59 = Developing

60-74 = Intermediate

75-89 = Advanced

90-100 = Expert

After assessment show detailed result.

Example:

Python Assessment

Score: 84%

Strong Areas:

- Functions

- Data Structures

- OOP

Weak Areas:

- Exception Handling

- File Handling

Recommendation:

"Practice file handling and exception handling before attempting advanced Python roles."

Store assessment results in Supabase.

==================================================

8. AI SKILL GAP ENGINE

==================================================

Create an AI Skill Gap Analysis module.

The architecture should support an AI provider later, but also work in demo mode with deterministic sample analysis.

Do NOT simply add an "AI" label everywhere.

AI should perform useful functions.

Inputs:

STUDENT:

- Skills

- Assessment scores

- Projects

- Certifications

- Education

- Resume

INDUSTRY ROLE:

- Job title

- Job description

- Required skills

- Preferred skills

- Experience

Output:

1. Overall match percentage

2. Matching skills

3. Missing skills

4. Skill priority

5. Recommended learning roadmap

6. Recommended projects

7. Internship suitability

8. Placement readiness

Example:

Target Role:

"Full Stack Developer"

Match:

78%

Strong Skills:

✓ JavaScript

✓ React

✓ SQL

✓ Git

Missing:

! Node.js

! Docker

! AWS

Skill Gap Priority:

HIGH:

Node.js

Docker

MEDIUM:

AWS

LOW:

System Design

Recommended roadmap:

Week 1:

Node.js fundamentals

Week 2:

REST API + Express

Week 3:

Docker

Week 4:

AWS deployment

Then recommend a project:

"Build and deploy a containerized full-stack application."

Create a visually impressive Skill Gap page.

==================================================

9. INDUSTRY ROLE CREATION

==================================================

Recruiters should be able to create:

- Internship

- Full-time job

- Apprenticeship

- Training program

Form:

Role title

Description

Location

Work mode

Stipend

Salary

Duration

Application deadline

Required skills

Preferred skills

Minimum qualification

Graduation year

Experience

Number of openings

Allow recruiter to select required skills from a standardized skill database.

Example:

Role:

"Software Development Intern"

Required:

Java

SQL

Git

REST API

Preferred:

React

Docker

After publishing, the platform should automatically calculate potential student matches.

==================================================

10. INDUSTRY DASHBOARD

==================================================

Create recruiter dashboard.

Show:

Active job postings

Applications

Recommended students

Skill demand

Interview pipeline

Main feature:

"Find Verified Talent"

Recruiter can enter:

Role:

Backend Developer

Required:

Java

Spring Boot

SQL

REST API

The system shows students ranked by:

Match %

Verified skills

Assessment score

Project experience

Placement readiness

Example:

Candidate A

92% Match

4/4 required skills verified

Candidate B

81% Match

3/4 required skills verified

Candidate C

73% Match

3/4 required skills verified

Allow recruiter to:

- View Skill Passport

- Shortlist

- Invite to interview

- Reject

- Contact

==================================================

11. SMART MATCHING

==================================================

Implement a transparent matching algorithm.

Example weighted calculation:

Required skill match = 50%

Skill verification = 15%

Assessment performance = 15%

Project relevance = 10%

Education eligibility = 5%

Experience = 5%

Display the result transparently.

Example:

92% Match

Breakdown:

Required Skills 48/50

Verification 14/15

Assessment 13/15

Projects 9/10

Education 5/5

Experience 3/5

Do not make the recommendation a black box.

Explain why a candidate matched.

==================================================

12. COLLEGE / ACADEMIA DASHBOARD

==================================================

This is one of the most important parts of the project.

College administrators should see institution-level intelligence.

Dashboard:

Total Students

Placement Ready Students

Average Skill Score

Industry Skill Gap

Internship Participation

Placement Rate

Create:

"Industry Skill Demand Heatmap"

Example:

Skill              Demand       Student Readiness

Python              High          78%

Java                High          84%

Cloud               Very High     32%

GenAI                Very High     21%

Cybersecurity       Medium        44%

Docker              High          29%

Use charts.

==================================================

13. COLLEGE SKILL GAP ANALYTICS

==================================================

College administrator can select:

Department

Year

Semester

Target role

Then show:

"What Industry Wants"

vs

"What Our Students Have"

Example:

Industry requirement:

Cloud 82%

Student proficiency:

34%

Gap:

48%

Show recommendations:

"Increase cloud training."

"Conduct AWS fundamentals workshop."

"Create cloud deployment project."

This should demonstrate how the platform helps colleges make data-driven decisions.

==================================================

14. CURRICULUM / TRAINING RECOMMENDATION

==================================================

College administrators can create training programs based on skill gaps.

Example:

Program:

"Cloud Computing Bootcamp"

Target skill:

AWS

Eligible students:

CSE 3rd year

Duration:

4 weeks

After completion:

Students can take an assessment.

Successful students receive verified skill status.

==================================================

15. INTERNSHIP MODULE

==================================================

Create internship marketplace.

Students can:

- Search

- Filter

- Sort

- View match percentage

- Apply

- Track applications

Filters:

Skill

Role

Location

Remote

Duration

Stipend

Company

Match percentage

Application states:

Applied

Under Review

Shortlisted

Interview

Selected

Rejected

Show application timeline.

==================================================

16. PLACEMENT MANAGEMENT

==================================================

Create placement module for colleges.

College admins can see:

Eligible students

Companies

Job drives

Applications

Shortlisted students

Selected students

Placement statistics

Company can conduct a placement drive.

Example:

Company:

ABC Technologies

Role:

Software Engineer

Eligible students:

245

Applied:

182

Shortlisted:

64

Selected:

18

Show placement funnel visualization.

==================================================

17. INDUSTRY SKILL DEMAND INTELLIGENCE

==================================================

Create a platform-level analytics page.

Analyze job postings and identify trending skills.

Show:

Top skills in demand:

1. Python

2. SQL

3. Cloud

4. React

5. AI/ML

6. Docker

7. Cybersecurity

Charts:

Skill demand trend

Industry-wise skill demand

Role-wise skill demand

Location-wise demand

Allow filters:

Industry

Location

Job role

Time period

==================================================

18. VERIFIED SKILLS

==================================================

Create a standardized verification system.

Verification sources:

1. Platform assessment

2. College assessment

3. Project evaluation

4. Industry assessment

5. Certification

Badge types:

Verified

College Verified

Industry Verified

Assessment Verified

Do not allow students to simply claim "Expert".

Use verification evidence.

==================================================

19. PROJECT PORTFOLIO

==================================================

Students can add projects.

Fields:

Project title

Description

Technologies

GitHub URL

Demo URL

Role

Duration

Skills demonstrated

Allow recruiter to see which skills each project proves.

Example:

Project:

"Hospital Management System"

Technologies:

Java, MySQL, Spring Boot

Skills demonstrated:

Java

SQL

REST API

Database Design

==================================================

20. NOTIFICATIONS

==================================================

Create notification center.

Examples:

"You are now eligible for 3 internships."

"Your Docker skill assessment is pending."

"ABC Technologies shortlisted your profile."

"Your college added a new training program."

"Your skill verification expires soon."

Use real database notifications.

==================================================

21. SUPER ADMIN

==================================================

Create admin dashboard.

Admin can manage:

Students

Colleges

Industries

Skills

Jobs

Internships

Assessments

Training programs

Applications

Reports

Show platform analytics.

Admin should be able to deactivate users and moderate job postings.

==================================================

22. DATABASE DESIGN

==================================================

Create Supabase PostgreSQL tables for:

profiles

students

colleges

industries

departments

skills

student_skills

skill_verifications

assessments

assessment_questions

assessment_attempts

assessment_results

projects

project_skills

certifications

resumes

job_postings

job_skills

internships

applications

application_status_history

training_programs

training_enrollments

learning_resources

skill_gap_analyses

recommendations

notifications

placement_drives

placement_applications

interviews

shortlists

Use UUID primary keys.

Use timestamps.

Create appropriate foreign keys.

Create indexes for:

- skill searches

- job matching

- student matching

- applications

- industry postings

- college analytics

==================================================

23. ROW LEVEL SECURITY

==================================================

Implement proper Supabase RLS.

Student:

- Can view/update own profile

- Can view public/eligible opportunities

- Can manage own applications

- Can view own assessments

- Can manage own projects

Recruiter:

- Can manage own company

- Can create/manage own postings

- Can view matched candidate information

- Can manage applications for own postings

College:

- Can manage own institution

- Can view students belonging to own institution

- Can manage training programs

- Can view institutional analytics

Admin:

- Full access

Never expose sensitive data unnecessarily.

==================================================

24. DEMO DATA

==================================================

Seed realistic demo data.

Create at least:

50 students

5 colleges

10 companies

30 skills

15 job/internship postings

20 projects

multiple assessments

multiple applications

multiple skill verifications

multiple training programs

Use realistic Indian college/company examples but do not imply partnerships with real companies unless explicitly configured as demo data.

Clearly mark demo data where appropriate.

Create a demo scenario involving:

Student:

Arjun Kumar

Target:

Full Stack Developer

Skills:

Java

SQL

React

Git

Missing:

Node.js

Docker

AWS

Placement readiness:

76%

Create a company:

"TechNova Solutions"

Role:

Full Stack Developer Intern

Required:

JavaScript

React

Node.js

SQL

REST API

Then make Arjun's profile show a meaningful match score.

Create another student with higher and another with lower match score so the recruiter ranking looks realistic.

==================================================

25. SEARCH

==================================================

Global search should support:

Students

Jobs

Internships

Skills

Companies

Training programs

Use debounced search.

Add filters.

==================================================

26. UI / UX

==================================================

Design should look like a modern startup SaaS product.

Use:

- Clean sidebar navigation

- Top navigation

- Cards

- Charts

- Progress indicators

- Skill badges

- Status badges

- Tables

- Tabs

- Dialogs

- Command/search interface

Use a professional palette based around:

Deep navy

Blue

Cyan/teal accents

White/light gray backgrounds

Use subtle gradients.

Avoid excessive animations.

Use animations only for:

- Page transitions

- Progress

- Dashboard statistics

- Hover states

Make the application visually impressive but not cluttered.

==================================================

27. MAIN STUDENT NAVIGATION

==================================================

Sidebar:

Dashboard

My Skill Passport

Skill Assessments

Skill Gap

Learning Roadmap

Projects

Internships

Applications

Placement Readiness

Notifications

Profile

Settings

==================================================

28. MAIN INDUSTRY NAVIGATION

==================================================

Dashboard

Post Opportunity

Find Talent

Applications

Interview Pipeline

Skill Demand

Company Profile

Notifications

Settings

==================================================

29. MAIN COLLEGE NAVIGATION

==================================================

Dashboard

Students

Skill Intelligence

Industry Demand

Skill Gaps

Training Programs

Internships

Placement Drives

Analytics

Notifications

Settings

==================================================

30. MAIN ADMIN NAVIGATION

==================================================

Dashboard

Users

Students

Colleges

Industries

Skills

Opportunities

Assessments

Training

Applications

Reports

Settings

==================================================

31. CRITICAL DIFFERENTIATOR FROM LINKEDIN

==================================================

The application must clearly communicate:

"LinkedIn tells you what opportunities exist.

SkillBridge tells you what you need to become eligible for those opportunities."

Implement this differentiation throughout the application.

Do NOT build:

- social feed

- likes

- followers

- connection requests

- generic posts

- unnecessary social networking

Instead prioritize:

Skill Gap

Verified Skills

Industry Requirements

College Intelligence

Learning Roadmap

Internship Matching

Placement Readiness

==================================================

32. UNIQUE FEATURE: CAREER READINESS SIMULATOR

==================================================

Create a page:

"Career Readiness Simulator"

Student selects a target role.

Example:

"Data Analyst"

The system calculates:

Current readiness:

58%

If student completes:

SQL Advanced → +10%

Power BI → +12%

Data Analytics Project → +8%

Assessment → +5%

Projected readiness:

93%

Display a visually impressive before/after comparison.

This should motivate students to close skill gaps.

==================================================

33. UNIQUE FEATURE: WHAT SHOULD MY COLLEGE TEACH?

==================================================

For college administrators create a recommendation panel:

"Industry-to-Curriculum Insights"

Example:

Based on current industry demand:

Add / strengthen:

Cloud Computing

Generative AI

Cybersecurity

DevOps

Reduce curriculum-industry gap by:

32%

Allow college administrators to create training programs directly from recommendations.

==================================================

34. UNIQUE FEATURE: INDUSTRY TALENT POOL

==================================================

Recruiters should not only search resumes.

They can search:

"Show me students with:

React > 75%

SQL > 80%

At least 2 projects

Verified Git

Placement readiness > 75%"

Return ranked candidates.

This demonstrates skill-first hiring.

==================================================

35. UNIQUE FEATURE: EXPLAINABLE MATCHING

==================================================

Whenever a student sees:

"87% Match"

allow them to click:

"Why?"

Show:

Required skills:

4/5 matched

Verified:

4/5

Assessment:

82%

Projects:

2 relevant

Education:

Eligible

Missing:

Docker

Then say:

"Improve Docker proficiency to increase your estimated match."

Do the same for recruiters.

==================================================

36. DEMO MODE

==================================================

Create a demo mode that makes the SIH presentation easy.

Provide demo login buttons:

"Continue as Student"

"Continue as Recruiter"

"Continue as College"

"Continue as Admin"

Use demo accounts backed by the database.

Make sure the complete workflow works.

==================================================

37. END-TO-END DEMO FLOW

==================================================

The following scenario must work:

1. Student logs in.

2. Student opens Skill Passport.

3. Student sees current skills.

4. Student chooses "Full Stack Developer".

5. Skill Gap Engine calculates missing skills.

6. Student receives learning roadmap.

7. Student takes an assessment.

8. Skill verification gets updated.

9. Placement readiness increases.

10. Student sees recommended internships.

11. Student applies.

12. Recruiter logs in.

13. Recruiter sees matched candidates.

14. Recruiter views student's verified Skill Passport.

15. Recruiter shortlists student.

16. College admin logs in.

17. College sees student's placement status.

18. College dashboard shows overall skill gaps.

19. College sees industry demand.

20. College creates training program to close a major skill gap.

This entire flow should be functional.

==================================================

38. DASHBOARD ANALYTICS

==================================================

Use Recharts.

Student charts:

- Skill proficiency radar/bar chart

- Readiness progress

- Skill gap chart

- Application funnel

Recruiter charts:

- Candidate pipeline

- Skill distribution

- Applications

- Hiring funnel

College charts:

- Department skill comparison

- Industry demand

- Skill gap heatmap

- Placement statistics

Admin charts:

- Platform growth

- Students

- Companies

- Opportunities

- Placements

==================================================

39. ERROR HANDLING

==================================================

Implement:

- Form validation

- Empty states

- Loading skeletons

- Error messages

- Retry buttons

- Authentication errors

- Database errors

- Duplicate application prevention

- Invalid file handling

Do not silently fail.

==================================================

40. ACCESSIBILITY

==================================================

Use:

- Semantic HTML

- Keyboard navigation

- Accessible labels

- Proper contrast

- ARIA where needed

- Responsive design

==================================================

41. FINAL PRODUCT QUALITY

==================================================

The final result should feel like a real deployable product, not a hackathon mockup.

Prioritize functional workflows over unnecessary pages.

Every major feature should connect to the Supabase database.

Use realistic demo data.

Do not leave TODO placeholders.

Do not use lorem ipsum.

Do not create fake charts with unrelated random data.

Charts should use database/demo data that corresponds to the application's actual entities.

Make all navigation functional.

Make all CRUD operations functional.

Make authentication and role-based routing functional.

==================================================

42. FINAL HOME PAGE MESSAGE

==================================================

Use this message prominently:

"Close the gap between what students learn and what industries need."

Supporting text:

"SkillBridge transforms industry requirements into measurable skills, personalized learning paths, verified capabilities and meaningful career opportunities."

Final CTA:

"Build Your Career Readiness"

==================================================

After building the application, verify that:

1. Authentication works.

2. Role-based routing works.

3. Supabase database works.

4. RLS policies work.

5. Student workflow works.

6. Recruiter workflow works.

7. College workflow works.

8. Admin workflow works.

9. Skill matching works.

10. Skill gap analysis works.

11. Internship applications work.

12. Skill verification works.

13. Dashboards show real data.

nodemo accounts 15. Mobile layout works.

16. There are no broken links.

17. There are no non-functional primary buttons.

18. There are no console errors.

Build the complete application now.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/81e49dda-7508-4258-bc28-fb283464fbc1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
