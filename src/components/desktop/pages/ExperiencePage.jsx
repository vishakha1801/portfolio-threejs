import { H1, Sub, SecTitle } from '../Win95Window.jsx';
import { W, SANS } from '../theme.js';

const EDUCATION = [
  {
    school: 'Carnegie Mellon University',
    degree: 'MS Information Systems',
    year: 'Aug 2024 – Dec 2025',
    note: 'Finalist Hack-a-Startup · Runner-up Product Wars 2024',
  },
  {
    school: 'Manipal Institute of Technology',
    degree: 'B.Tech Computer & Communication Engineering · Minor in Big Data',
    year: 'July 2018 – July 2022',
    note: '',
  },
];

const JOBS = [
  {
    role:    'Software Engineer',
    company: 'Optum · UnitedHealth Group',
    period:  'July 2022 – Apr 2024',
    desc:    'My first job out of college — I joined Optum as a frontend engineer on the Outpatient Charge Capture platform, which handles medical billing for 1,000+ healthcare clients and touches 13M+ patient encounters a year. I mostly worked in Angular and TypeScript, building UI components and at one point ripping out and rewriting the navigation service because it was just slow. That brought latency down by about 50%. I also picked up backend work over time — Python scripts, SQL, some ETL pipelines — and got into the infra side enough to set up Splunk monitoring and help keep the system at 99.9% uptime. Moved a bunch of repos to GitHub Cloud and set up Jenkins CI/CD too. Good place to learn what production software actually feels like.',
  },
  {
    role:    'Software Engineer (Contract)',
    company: 'Kearney',
    period:  'Sept 2025 – Dec 2025',
    desc:    'Built a full-stack should-cost application that replaced a slow, error-prone Excel process for chemical price negotiations. What used to take analysts 3–5 days now runs in minutes — pulling together market data, raw-material costs, and existing cost models through a React frontend and an n8n automation backend.',
  },
  {
    role:    'Teaching Assistant — OOP in Java & Linux',
    company: 'Carnegie Mellon University',
    period:  'Aug 2024 – May 2025',
    desc:    'Sole TA for two courses across both semesters. For OOP in Java, managed a class of 240+ students — ran weekly office hours, wrote supplementary material, and graded assignments end-to-end. For Linux & Open Source Software, guided students through shell scripting, kernel internals, and real OSS contribution workflows, mentoring many through their first upstream pull request.',
  },
];

const ExperiencePage = () => (
  <div style={{ padding: '24px 20px 16px' }}>
    <H1>Experience</H1>
    <Sub>Where I&apos;ve worked and what I&apos;ve shipped</Sub>

    <SecTitle>Education</SecTitle>
    {EDUCATION.map((e, i) => (
      <div key={i} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: W.black }}>{e.school}</span>
          <span style={{ fontFamily: SANS, fontSize: 10, color: W.dark, flexShrink: 0 }}>{e.year}</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 10, color: '#000080', marginBottom: e.note ? 2 : 0 }}>{e.degree}</div>
        {e.note && <div style={{ fontFamily: SANS, fontSize: 10, color: W.dark }}>{e.note}</div>}
      </div>
    ))}

    <SecTitle>Work</SecTitle>
    {JOBS.map((job, i) => (
      <div key={i} style={{
        marginBottom: 14, paddingBottom: 14,
        borderBottom: i < JOBS.length - 1 ? `1px solid ${W.dark}` : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 1 }}>
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: W.black }}>{job.role}</span>
          <span style={{ fontFamily: SANS, fontSize: 10, color: W.dark, flexShrink: 0 }}>{job.period}</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: '#000080', marginBottom: 5 }}>{job.company}</div>
        <div style={{ fontFamily: SANS, fontSize: 10, color: '#111', lineHeight: 1.7 }}>{job.desc}</div>
      </div>
    ))}
  </div>
);

export default ExperiencePage;
