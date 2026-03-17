import { H1, Sub } from '../Win95Window.jsx';
import { W, SANS, raised, sunken } from '../theme.js';

const PROJECTS = [
  {
    name: 'Movie Recommendation Platform',
    tech: 'Python · Kafka · Docker · CI/CD',
    desc: 'Built a production-style recommendation system designed to scale to 1M users and 27K movies. The interesting part was less the model and more everything around it — Kafka for real-time event streaming, a CI pipeline that actually caught regressions, and keeping p99 latency under a 600ms SLA while maintaining 99%+ availability.',
    link: null,
  },
  {
    name: 'ai-native-ui',
    tech: 'TypeScript · React · CSS',
    desc: "An open-source React component library for AI interfaces — the stuff general-purpose design systems don't think about. Streaming text with cursor behavior and ARIA live regions, thinking indicators, tool call cards that show the full pending → running → success/error lifecycle, and citation cards for grounding. Built because I kept writing the same ad-hoc patterns across every AI project.",
    link: 'https://github.com/vishakha1801/ai-native-ui',
  },
  {
    name: 'VigilantAI',
    tech: 'Python · PyTorch · Transformers · Computer Vision',
    desc: 'A Transformer-based super-resolution model built at CMU to enhance low-quality CCTV footage for crime detection use cases. The core problem is that most real-world surveillance footage is too degraded for reliable facial or object recognition — this model upscales and sharpens frames to a point where that becomes viable. Trained and evaluated on low-res surveillance datasets with a focus on preserving detail that actually matters for identification.',
    link: null,
  },
  {
    name: 'Adversarial Robustness Evaluation',
    tech: 'Python · PyTorch · React · ResNet-18 · Llama · Qwen',
    desc: 'A full-stack system for stress-testing computer vision models and LLMs under adversarial attack. Ran attacks against ResNet-18, MNIST CNNs, and open-source LLMs (Llama, Qwen), then built and evaluated defense layers that improved robustness by ~40%. Part research tool, part dashboard for visualising where models break.',
    link: null,
  },
  {
    name: 'LeetCode Tracker',
    tech: 'JavaScript · Chrome Extensions · Manifest V3',
    desc: "A Chrome extension that fills a gap in LeetCode's own stats — daily problem counts, streak tracking, and cumulative totals, without overcounting multiple submissions on the same problem. Runs entirely client-side, no backend. Available on the Chrome Web Store.",
    link: 'https://github.com/vishakha1801/leetcode-tracker',
  },
  {
    name: '3D Portfolio (this site)',
    tech: 'React · Three.js · React Three Fiber · Drei · GSAP · Vite',
    desc: "A portfolio built as a 3D room scene in the browser. The scene is rendered with Three.js via React Three Fiber — clicking the monitor triggers a GSAP camera animation that zooms in and fades into a fully functional Windows 95 desktop overlay. The desktop runs multiple draggable, minimisable windows, a working Tetris game, ambient office audio, and all the portfolio content you're reading right now. The whole thing is a single-page React app with no backend.",
    link: null,
  },
];

const ProjectsPage = () => (
  <div style={{ padding: '24px 20px 16px' }}>
    <H1>Projects</H1>
    <Sub>Things I&apos;ve built — personal and academic</Sub>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {PROJECTS.map((proj, i) => (
        <div key={i} style={{ ...sunken, background: W.content, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: W.black }}>{proj.name}</span>
            {proj.link && (
              <a href={proj.link} target="_blank" rel="noreferrer" style={{
                fontFamily: SANS, fontSize: 9, color: '#000080', textDecoration: 'none', ...raised, padding: '1px 5px',
              }}>↗ View</a>
            )}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 9, color: W.dark, fontStyle: 'italic', marginBottom: 5 }}>{proj.tech}</div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: '#333', lineHeight: 1.6 }}>{proj.desc}</div>
        </div>
      ))}
    </div>
  </div>
);

export default ProjectsPage;
