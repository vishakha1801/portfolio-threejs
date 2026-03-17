import { useCallback, useEffect, useRef, useState } from 'react';

// ── WebGL animated noise overlay ─────────────────────────────────────────────
const VERT_SRC = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.0,1.0);}`;
const FRAG_SRC = `
  #ifdef GL_ES precision mediump float; #endif
  const float PHI=1.61803398874989484820459;
  uniform float u_time;
  float noise(vec2 xy,float seed){return fract(tan(distance(xy*PHI,xy)*seed)*xy.x);}
  void main(){
    float n=noise(gl_FragCoord.xy,fract(u_time)+1.0);
    gl_FragColor=vec4(n*0.9,n*0.9,n*0.9,0.035);
  }
`;
const NoiseOverlay = ({ w, h }) => {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    canvas.width = w; canvas.height = h;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
    if (!gl) return;
    const mk = (src, type) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(VERT_SRC, gl.VERTEX_SHADER));
    gl.attachShader(prog, mk(FRAG_SRC, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const t0 = performance.now(); let raf;
    const draw = () => { gl.uniform1f(uTime, (performance.now() - t0) * 0.001); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); raf = requestAnimationFrame(draw); };
    draw();
    return () => { cancelAnimationFrame(raf); gl.deleteBuffer(buf); gl.deleteProgram(prog); };
  }, [w, h]);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} />;
};

// ── Win95 palette ─────────────────────────────────────────────────────────────
const W = {
  desktop:    '#008080',
  winBg:      '#c0c0c0',
  titleActive:'#000080',
  titleText:  '#ffffff',
  white:      '#ffffff',
  black:      '#000000',
  dark:       '#808080',
  darker:     '#404040',
  content:    '#ffffff',
  taskbar:    '#c0c0c0',
};
const SANS = '"MS Sans Serif","Tahoma","Arial",sans-serif';

// ── 3-D border helpers ────────────────────────────────────────────────────────
const raised = {
  borderTop:   `2px solid ${W.white}`,
  borderLeft:  `2px solid ${W.white}`,
  borderBottom:`2px solid ${W.dark}`,
  borderRight: `2px solid ${W.dark}`,
};
const sunken = {
  borderTop:   `2px solid ${W.dark}`,
  borderLeft:  `2px solid ${W.dark}`,
  borderBottom:`2px solid ${W.white}`,
  borderRight: `2px solid ${W.white}`,
};
const deepRaised = {
  outline:     `1px solid ${W.black}`,
  borderTop:   `2px solid ${W.white}`,
  borderLeft:  `2px solid ${W.white}`,
  borderBottom:`2px solid ${W.darker}`,
  borderRight: `2px solid ${W.darker}`,
};

// ── Title-bar button ──────────────────────────────────────────────────────────
const TitleBtn95 = ({ label, onClick, style }) => {
  const [down, setDown] = useState(false);
  return (
    <div
      onMouseDown={() => onClick && setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      onClick={onClick}
      style={{
        width: 16, height: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: W.winBg,
        ...(down ? sunken : raised),
        fontSize: 9, fontWeight: 700, fontFamily: SANS,
        color: W.black, cursor: 'default',
        flexShrink: 0, userSelect: 'none',
        ...style,
      }}
    >{label}</div>
  );
};

// ── Regular button ────────────────────────────────────────────────────────────
const Btn95 = ({ children, onClick, style }) => {
  const [down, setDown] = useState(false);
  return (
    <button
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      onClick={onClick}
      style={{
        background: W.winBg, fontFamily: SANS, fontSize: 11, color: W.black,
        padding: '3px 12px', cursor: 'default',
        ...(down ? sunken : raised),
        ...style,
      }}
    >{children}</button>
  );
};

// ── Win95 Window chrome ───────────────────────────────────────────────────────
// winWidth / winHeight set a fixed size when not maximized — critical for
// ShowcaseExplorer so tab-switching never resizes the window
const Win95Window = ({
  title, icon, onClose, onMinimize, onFocus,
  zIndex = 10, initialX = 20, initialY = 20,
  desktopW = 400, desktopH = 300,
  winWidth, winHeight,
  noMaximize = false,
  children,
}) => {
  const [pos, setPos]               = useState({ x: initialX, y: initialY });
  const [isMaximized, setIsMaximized] = useState(false);
  const preMax  = useRef(null);
  const drag    = useRef({ active: false, sx: 0, sy: 0 });
  const TASKBAR_H = 32;

  const onDown = (e) => {
    if (drag.current.active || isMaximized) return;
    e.preventDefault(); onFocus?.();
    drag.current = { active: true, sx: e.clientX - pos.x, sy: e.clientY - pos.y };
    const mv = (e) => { if (drag.current.active) setPos({ x: e.clientX - drag.current.sx, y: e.clientY - drag.current.sy }); };
    const up = () => { drag.current.active = false; document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  };

  const handleMaximize = (e) => {
    e.stopPropagation();
    if (isMaximized) {
      if (preMax.current) setPos(preMax.current);
      setIsMaximized(false);
    } else {
      preMax.current = { ...pos };
      setPos({ x: 0, y: 0 });
      setIsMaximized(true);
    }
  };

  // Maximized: fill the desktop area above the taskbar
  // Normal: use explicit winWidth×winHeight when provided, else size-to-content
  const containerStyle = isMaximized
    ? {
        position: 'absolute', left: 0, top: 0,
        width: desktopW, height: desktopH - TASKBAR_H - 5,
        zIndex, background: W.winBg,
        // no outline/border when maximized — deepRaised adds a 1px outline outside
        // the box model which bleeds past the desktop edges
        border: 'none', outline: 'none',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
      }
    : {
        position: 'absolute', left: pos.x, top: pos.y,
        zIndex, background: W.winBg, ...deepRaised,
        ...(winWidth  ? { width: winWidth }  : {}),
        ...(winHeight ? { height: winHeight, display: 'flex', flexDirection: 'column' } : {}),
      };

  const TITLE_H = 22;

  return (
    <div onMouseDown={onFocus} style={containerStyle}>
      {/* Title bar — drag handle */}
      <div onMouseDown={onDown} style={{
        background: W.titleActive,
        backgroundImage: `linear-gradient(90deg,${W.titleActive},#1084d0)`,
        padding: '2px 3px 2px 4px',
        display: 'flex', alignItems: 'center', gap: 3,
        cursor: isMaximized ? 'default' : 'move',
        userSelect: 'none', height: TITLE_H, flexShrink: 0,
      }}>
        {icon && <span style={{ fontSize: 11, lineHeight: 1 }}>{icon}</span>}
        <span style={{
          flex: 1, color: W.titleText, fontFamily: SANS, fontSize: 11, fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</span>
        <TitleBtn95 label="─" onClick={(e) => { e.stopPropagation(); onMinimize?.(); }} />
        <TitleBtn95
          label={isMaximized ? '❐' : '□'}
          onClick={noMaximize ? undefined : handleMaximize}
          style={{ opacity: noMaximize ? 0.4 : 1, cursor: noMaximize ? 'default' : undefined }}
        />
        <TitleBtn95 label="✕" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      </div>

      {/* Children fill remaining space; flex column propagates to ShowcaseExplorer */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: W.winBg,
      }}>
        {children}
      </div>
    </div>
  );
};

// ── Typography helpers ────────────────────────────────────────────────────────
const H1 = ({ children, style }) => (
  <h1 style={{ fontFamily: SANS, fontSize: 20, margin: '0 0 2px 0', color: W.black, fontWeight: 700, ...style }}>{children}</h1>
);
const Sub = ({ children }) => (
  <p style={{ fontFamily: SANS, fontSize: 12, color: '#444', margin: '0 0 14px 0' }}>{children}</p>
);
const SecTitle = ({ children }) => (
  <div style={{
    fontFamily: SANS, fontSize: 11, fontWeight: 700, margin: '14px 0 6px 0', color: W.black,
    borderBottom: `1px solid ${W.dark}`, paddingBottom: 3, textTransform: 'uppercase', letterSpacing: 1,
  }}>{children}</div>
);
const P = ({ children, style }) => (
  <p style={{ fontFamily: SANS, fontSize: 11, lineHeight: 1.7, color: '#111', margin: '0 0 8px 0', ...style }}>{children}</p>
);

// ── Home page ─────────────────────────────────────────────────────────────────
const HomePage = () => (
  <div style={{ padding: '24px 20px 16px' }}>
    <H1>Vishakha Pathak</H1>
    <Sub>Software Engineer · Carnegie Mellon University MS '25</Sub>

    <P>
      I build things at the intersection of engineering and design. Currently completing my Master's in
      Information Systems at CMU, where I also serve as a Teaching Assistant.
    </P>
    <P>
      Welcome to my portfolio. Use the sidebar to explore my background, experience, and projects —
      or reach out directly through the Contact page.
    </P>

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16, marginBottom: 16 }}>
      <Btn95 onClick={() => window.open('https://github.com/vishakhapathak', '_blank')}>📄 Download Resume</Btn95>
    </div>

    <SecTitle>Find me online</SecTitle>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {[
        { icon: '🐙', label: 'GitHub',   href: 'https://github.com/vishakhapathak' },
        { icon: '💼', label: 'LinkedIn', href: 'https://linkedin.com/in/vishakhapathak' },
        { icon: '✉',  label: 'Email',    href: 'mailto:hello@vishakhapathak.com' },
      ].map(s => (
        <a key={s.label} href={s.href} target="_blank" rel="noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: SANS, fontSize: 10, color: W.black, textDecoration: 'none',
          background: W.winBg, padding: '2px 8px', ...raised,
        }}>
          {s.icon} {s.label}
        </a>
      ))}
    </div>
  </div>
);

// ── About page ────────────────────────────────────────────────────────────────
const AboutPage = () => (
  <div style={{ padding: '24px 20px 16px' }}>
    <H1>About Me</H1>
    <Sub>Background, interests, and what drives me</Sub>

    <P>
      I'm a software engineer originally from India, currently living in Pittsburgh while pursuing my
      MS in Information Systems at Carnegie Mellon University. I'm graduating in May 2025.
    </P>
    <P>
      I started programming in high school — first with web development, then quickly into backend systems
      and data engineering. That curiosity has never stopped. I'm drawn to problems where thoughtful
      engineering and good design meet.
    </P>

    <SecTitle>Education</SecTitle>
    {[
      { school: 'Carnegie Mellon University', degree: 'MS Information Systems', year: '2024 – 2025', note: 'TA: OOP in Java, Linux & Open Source' },
      { school: 'Manipal Institute of Technology', degree: 'B.Tech Computer Science', year: '2018 – 2022', note: 'Focus: systems, algorithms, distributed computing' },
    ].map((e, i) => (
      <div key={i} style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: W.black }}>{e.school}</div>
        <div style={{ fontFamily: SANS, fontSize: 10, color: '#000080', marginBottom: 1 }}>{e.degree} · {e.year}</div>
        <div style={{ fontFamily: SANS, fontSize: 10, color: W.dark }}>{e.note}</div>
      </div>
    ))}

    <SecTitle>Interests & Hobbies</SecTitle>
    <P>
      Outside of code I enjoy photography, hiking, and exploring whatever city I'm in. I have a deep
      interest in how interfaces shape user behaviour — which explains this portfolio's existence.
    </P>
    <P>
      Also: cooking, reading non-fiction, and yes — Tetris. The window on this desktop is fully
      playable. Arrow keys + Space.
    </P>
  </div>
);

// ── Experience page ───────────────────────────────────────────────────────────
const ExperiencePage = () => (
  <div style={{ padding: '24px 20px 16px' }}>
    <H1>Experience</H1>
    <Sub>Where I've worked and what I've shipped</Sub>

    {[
      {
        role: 'Teaching Assistant',
        company: 'Carnegie Mellon University',
        period: 'Aug 2024 – May 2025',
        location: 'Pittsburgh, PA',
        bullets: [
          'TA for Object-Oriented Programming in Java — held weekly office hours and graded 80+ assignments per semester',
          'TA for Linux & Open Source Software — guided students through shell scripting, kernel concepts, and OSS contribution workflows',
          'Mentored students individually on debugging strategies and software design principles',
        ],
      },
      {
        role: 'Runner-Up — Product Wars',
        company: 'CMU Hack-a-Startup',
        period: 'Fall 2024',
        location: 'Pittsburgh, PA',
        bullets: [
          'Built and pitched a full product with a 3-person team in under 24 hours',
          'Placed runner-up out of 20+ competing teams; recognised for technical execution and presentation quality',
        ],
      },
      {
        role: 'Software Engineering Intern',
        company: '[ Company Name ]',
        period: '[ Dates ]',
        location: '',
        bullets: [
          'Add your internship or work experience here — edit MacOSDesktop.jsx → ExperiencePage',
        ],
      },
    ].map((job, i, arr) => (
      <div key={i} style={{
        marginBottom: 14, paddingBottom: 14,
        borderBottom: i < arr.length - 1 ? `1px solid ${W.dark}` : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 1 }}>
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: W.black }}>{job.role}</span>
          <span style={{ fontFamily: SANS, fontSize: 10, color: W.dark, flexShrink: 0 }}>{job.period}</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: '#000080', marginBottom: 6 }}>
          {job.company}{job.location ? ` · ${job.location}` : ''}
        </div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {job.bullets.map((b, j) => (
            <li key={j} style={{ fontFamily: SANS, fontSize: 10, color: '#111', lineHeight: 1.65, marginBottom: 2 }}>{b}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

// ── Projects page ─────────────────────────────────────────────────────────────
const ProjectsPage = () => (
  <div style={{ padding: '24px 20px 16px' }}>
    <H1>Projects</H1>
    <Sub>Things I've built — personal and academic</Sub>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        {
          name: '3D Portfolio',
          tech: 'React · Three.js · React Three Fiber · GSAP',
          desc: 'This site. A 3D hacker room scene where clicking the monitor zooms the camera in and reveals a functional Win95 desktop overlay with portfolio content and a playable Tetris game.',
          link: null,
        },
        {
          name: '[ Project Name ]',
          tech: '[ Tech stack ]',
          desc: 'Add a project description here. Edit MacOSDesktop.jsx → ProjectsPage to fill this in.',
          link: null,
        },
        {
          name: '[ Project Name ]',
          tech: '[ Tech stack ]',
          desc: 'Add another project here.',
          link: null,
        },
      ].map((proj, i) => (
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

// ── Contact page ──────────────────────────────────────────────────────────────
const ContactPage = () => {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState(false);

  const fieldStyle = {
    width: '100%', boxSizing: 'border-box',
    background: W.content, fontFamily: SANS, fontSize: 10,
    padding: '3px 5px', color: W.black, outline: 'none',
    ...sunken,
  };

  const handleSend = () => {
    if (name && email && message) setSent(true);
  };

  return (
    <div style={{ padding: '24px 20px 16px' }}>
      <H1>Contact</H1>
      <Sub>Let's get in touch</Sub>

      <P>
        I'm currently open to new opportunities — internships, full-time roles, and interesting collaborations.
        Feel free to reach out directly or use the form below.
      </P>
      <P>
        <b>Email: </b>
        <a href="mailto:hello@vishakhapathak.com" style={{ color: '#000080' }}>hello@vishakhapathak.com</a>
      </P>

      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {[
          { icon: '🐙', label: 'GitHub',   href: 'https://github.com/vishakhapathak' },
          { icon: '💼', label: 'LinkedIn', href: 'https://linkedin.com/in/vishakhapathak' },
        ].map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: SANS, fontSize: 10, color: W.black, textDecoration: 'none',
            background: W.winBg, padding: '2px 8px', ...raised,
          }}>
            {s.icon} {s.label}
          </a>
        ))}
      </div>

      {sent ? (
        <div style={{ ...sunken, background: '#e0ffe0', padding: '10px 12px', fontFamily: SANS, fontSize: 11, color: '#004400' }}>
          ✓ Message sent! I'll get back to you soon.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Name',    val: name,    set: setName,    type: 'text',  placeholder: 'Your name' },
            { label: 'Email',   val: email,   set: setEmail,   type: 'email', placeholder: 'you@example.com' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: W.black, marginBottom: 2 }}>{f.label}:</div>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={fieldStyle} />
            </div>
          ))}
          <div>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: W.black, marginBottom: 2 }}>Message:</div>
            <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Your message..." style={{ ...fieldStyle, resize: 'none' }} />
          </div>
          <Btn95 onClick={handleSend} style={{ alignSelf: 'flex-start' }}>Send Message</Btn95>
        </div>
      )}
    </div>
  );
};

// ── Showcase Explorer ─────────────────────────────────────────────────────────
const SHOWCASE_PAGES = [
  { id: 'home',       label: 'Home',       icon: '🏠' },
  { id: 'about',      label: 'About',      icon: '👤' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'projects',   label: 'Projects',   icon: '📁' },
  { id: 'contact',    label: 'Contact',    icon: '✉'  },
];
const PAGE_MAP = {
  home: HomePage, about: AboutPage,
  experience: ExperiencePage, projects: ProjectsPage, contact: ContactPage,
};

// Fixed dimensions — tab switching must never change the window size
const SHOWCASE_W = 600;
const SHOWCASE_H = 480;

const NavItem95 = ({ page, active, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 8px', cursor: 'default',
        background: active ? W.titleActive : hov ? '#a0a0a0' : 'transparent',
        color: active ? W.white : W.black,
        fontFamily: SANS, fontSize: 11,
        borderBottom: `1px solid ${W.dark}`,
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1, width: 16, textAlign: 'center' }}>{page.icon}</span>
      {page.label}
    </div>
  );
};

const ShowcaseExplorer = ({ onClose, onMinimize, onFocus, zIndex, initialX, initialY, desktopW, desktopH }) => {
  const [page, setPage] = useState('home');
  const Page = PAGE_MAP[page];

  return (
    <Win95Window
      title="Vishakha Pathak — Portfolio 2025"
      icon="🖥"
      onClose={onClose} onMinimize={onMinimize} onFocus={onFocus}
      zIndex={zIndex} initialX={initialX} initialY={initialY}
      desktopW={desktopW} desktopH={desktopH}
      winWidth={SHOWCASE_W} winHeight={SHOWCASE_H}
    >
      {/* Menu bar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexShrink: 0,
        background: W.winBg, borderBottom: `1px solid ${W.dark}`,
        padding: '1px 2px',
      }}>
        {['File', 'Edit', 'View', 'Help'].map(m => (
          <div key={m}
            style={{ fontFamily: SANS, fontSize: 11, padding: '1px 7px', color: W.black, cursor: 'default', userSelect: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = W.black; }}
          >{m}</div>
        ))}
      </div>

      {/* Address bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
        background: W.winBg, padding: '2px 4px',
        borderBottom: `1px solid ${W.dark}`,
      }}>
        <span style={{ fontFamily: SANS, fontSize: 10, color: W.black, flexShrink: 0 }}>Address</span>
        <div style={{
          flex: 1, background: W.content, padding: '1px 5px',
          fontFamily: SANS, fontSize: 10, color: W.black, ...sunken,
        }}>C:\Desktop\Portfolio\{page}</div>
        <Btn95 style={{ padding: '1px 8px', fontSize: 10 }}>Go</Btn95>
      </div>

      {/* Nav + Content — flex:1 fills the fixed height left after menu/address/status bars */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left sidebar */}
        <nav style={{
          width: 110, background: W.winBg,
          borderRight: `2px solid ${W.dark}`,
          flexShrink: 0, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            background: W.titleActive,
            backgroundImage: `linear-gradient(90deg,${W.titleActive},#1084d0)`,
            color: W.white, fontFamily: SANS, fontSize: 10, fontWeight: 700,
            padding: '3px 8px', flexShrink: 0,
          }}>
            Navigation
          </div>
          {SHOWCASE_PAGES.map(p => (
            <NavItem95 key={p.id} page={p} active={page === p.id} onClick={() => setPage(p.id)} />
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: '6px 4px', fontFamily: SANS, fontSize: 8, color: W.dark, textAlign: 'center' }}>
            © 2025 Vishakha Pathak
          </div>
        </nav>

        {/* Content area — fixed height via flex, overflowY scroll — no resize on tab change */}
        <div style={{
          flex: 1, overflowY: 'auto', background: W.content, ...sunken,
          // scrollbar styling for Win95 feel
        }}>
          <Page />
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexShrink: 0,
        background: W.winBg, padding: '1px 4px',
        borderTop: `1px solid ${W.dark}`, gap: 8,
      }}>
        <div style={{ ...sunken, padding: '0 6px', fontFamily: SANS, fontSize: 10, color: W.black, flex: 1 }}>
          {SHOWCASE_PAGES.find(p => p.id === page)?.label}
        </div>
        <div style={{ ...sunken, padding: '0 6px', fontFamily: SANS, fontSize: 10, color: W.black }}>
          Vishakha Pathak
        </div>
      </div>
    </Win95Window>
  );
};

// ── Tetris ────────────────────────────────────────────────────────────────────
const COLS = 10, ROWS = 20, CELL = 16;
const PIECES = [
  { shapes: [[[1,1,1,1]], [[1],[1],[1],[1]]], color: '#00ccee' },
  { shapes: [[[1,1],[1,1]]], color: '#eeee00' },
  { shapes: [[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[1,1,1],[0,1,0]],[[0,1],[1,1],[0,1]]], color: '#aa00ee' },
  { shapes: [[[0,1,1],[1,1,0]],[[1,0],[1,1],[0,1]]], color: '#00ee44' },
  { shapes: [[[1,1,0],[0,1,1]],[[0,1],[1,1],[1,0]]], color: '#ee2222' },
  { shapes: [[[1,0,0],[1,1,1]],[[1,1],[1,0],[1,0]],[[1,1,1],[0,0,1]],[[0,1],[0,1],[1,1]]], color: '#2255ff' },
  { shapes: [[[0,0,1],[1,1,1]],[[1,0],[1,0],[1,1]],[[1,1,1],[1,0,0]],[[1,1],[0,1],[0,1]]], color: '#ff8800' },
];
const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const newPiece = () => { const p = PIECES[Math.floor(Math.random() * PIECES.length)]; return { piece: p, rot: 0, x: Math.floor(COLS / 2) - 1, y: 0 }; };
const getShape = a => a.piece.shapes[a.rot % a.piece.shapes.length];
const isValid = (board, shape, x, y) => {
  for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++)
    if (shape[r][c]) { if (x + c < 0 || x + c >= COLS || y + r >= ROWS) return false; if (y + r >= 0 && board[y + r][x + c]) return false; }
  return true;
};

const TetrisContent = () => {
  const canvasRef = useRef(); const gs = useRef(null);
  const [ui, setUi] = useState({ score: 0, level: 1, lines: 0, over: false });
  const mkState = () => ({ board: emptyBoard(), active: newPiece(), score: 0, level: 1, lines: 0, over: false });

  const drawCell = useCallback((ctx, x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + 1, y + 1, CELL - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, CELL - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + 1, y + CELL - 4, CELL - 2, 3);
    ctx.fillRect(x + CELL - 4, y + 1, 3, CELL - 2);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas || !gs.current) return;
    const ctx = canvas.getContext('2d'); const s = gs.current; const W2 = COLS * CELL, H = ROWS * CELL;
    ctx.fillStyle = '#080818'; ctx.fillRect(0, 0, W2, H);
    ctx.strokeStyle = '#12122a'; ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W2, r * CELL); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (s.board[r][c]) drawCell(ctx, c * CELL, r * CELL, s.board[r][c]);
    if (!s.over && s.active) {
      const shape = getShape(s.active);
      let gy = s.active.y; while (isValid(s.board, shape, s.active.x, gy + 1)) gy++;
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) if (shape[r][c]) ctx.fillRect((s.active.x + c) * CELL + 2, (gy + r) * CELL + 2, CELL - 4, CELL - 4);
      for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) if (shape[r][c]) drawCell(ctx, (s.active.x + c) * CELL, (s.active.y + r) * CELL, s.active.piece.color);
    }
    if (s.over) {
      ctx.fillStyle = 'rgba(0,0,10,0.82)'; ctx.fillRect(0, 0, W2, H);
      ctx.fillStyle = '#ff4466'; ctx.font = `bold ${CELL + 2}px monospace`; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W2 / 2, H / 2 - CELL);
      ctx.fillStyle = '#aaa'; ctx.font = `${CELL - 2}px monospace`;
      ctx.fillText('press R to restart', W2 / 2, H / 2 + CELL);
    }
  }, [drawCell]);

  const lock = useCallback(() => {
    const s = gs.current; const shape = getShape(s.active); const board = s.board.map(r => [...r]);
    for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) if (shape[r][c] && s.active.y + r >= 0) board[s.active.y + r][s.active.x + c] = s.active.piece.color;
    let cleared = 0; const kept = board.filter(row => row.some(c => !c));
    while (kept.length < ROWS) { kept.unshift(Array(COLS).fill(null)); cleared++; }
    const lines = s.lines + cleared, score = s.score + [0, 40, 100, 300, 1200][cleared] * s.level, level = Math.floor(lines / 10) + 1;
    const active = newPiece(), over = !isValid(kept, getShape(active), active.x, active.y);
    gs.current = { board: kept, active, score, level, lines, over }; setUi({ score, level, lines, over });
  }, []);

  const tick = useCallback(() => {
    const s = gs.current; if (!s || s.over) return;
    const shape = getShape(s.active);
    if (isValid(s.board, shape, s.active.x, s.active.y + 1)) gs.current = { ...s, active: { ...s.active, y: s.active.y + 1 } }; else lock();
    render();
  }, [lock, render]);

  useEffect(() => { gs.current = mkState(); render(); }, [render]);
  useEffect(() => { if (ui.over) return; const id = setInterval(tick, Math.max(80, 700 - (ui.level - 1) * 60)); return () => clearInterval(id); }, [tick, ui.level, ui.over]);
  useEffect(() => {
    const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'KeyR']);
    const onKey = (e) => {
      if (!GAME_KEYS.has(e.code)) return; e.preventDefault(); e.stopPropagation();
      const s = gs.current; if (!s) return;
      if (e.code === 'KeyR') { gs.current = mkState(); setUi({ score: 0, level: 1, lines: 0, over: false }); render(); return; }
      if (s.over) return;
      let { active } = s; const shape = getShape(active);
      if (e.code === 'ArrowLeft' && isValid(s.board, shape, active.x - 1, active.y)) active = { ...active, x: active.x - 1 };
      else if (e.code === 'ArrowRight' && isValid(s.board, shape, active.x + 1, active.y)) active = { ...active, x: active.x + 1 };
      else if (e.code === 'ArrowDown' && isValid(s.board, shape, active.x, active.y + 1)) active = { ...active, y: active.y + 1 };
      else if (e.code === 'ArrowUp') { const rot = active.piece.shapes[(active.rot + 1) % active.piece.shapes.length]; if (isValid(s.board, rot, active.x, active.y)) active = { ...active, rot: active.rot + 1 }; }
      else if (e.code === 'Space') { let ny = active.y; while (isValid(s.board, shape, active.x, ny + 1)) ny++; gs.current = { ...s, active: { ...active, y: ny } }; lock(); render(); return; }
      gs.current = { ...s, active }; render();
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [lock, render]);

  return (
    <div style={{ display: 'flex', gap: 0, background: '#080818' }}>
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} style={{ display: 'block', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 10px', background: '#0e0e22', borderLeft: '1px solid #1a1a3a', minWidth: 80 }}>
        {[['SCORE', ui.score], ['LEVEL', ui.level], ['LINES', ui.lines]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4466aa', letterSpacing: 1, marginBottom: 2 }}>{k}</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: '#00ffcc' }}>{v}</div>
          </div>
        ))}
        <div style={{ marginTop: 'auto', fontFamily: 'monospace', fontSize: 8, color: '#334', lineHeight: 2 }}>
          ← → move<br />↑ rotate<br />↓ soft drop<br />SPC hard drop<br />R restart
        </div>
      </div>
    </div>
  );
};

// ── Desktop icon ──────────────────────────────────────────────────────────────
const DesktopIcon = ({ icon, label, onDoubleClick }) => {
  const [sel, setSel] = useState(false);
  return (
    <div onClick={() => setSel(true)} onDoubleClick={onDoubleClick} onBlur={() => setSel(false)} tabIndex={0}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 54, padding: 4, cursor: 'default', outline: 'none' }}>
      <div style={{
        fontSize: 26, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: sel ? 'rgba(0,0,128,0.5)' : 'transparent',
        outline: sel ? '1px dotted #fff' : 'none',
      }}>{icon}</div>
      <span style={{
        fontFamily: SANS, fontSize: 10, color: W.white,
        textShadow: '1px 1px 2px #000',
        background: sel ? W.titleActive : 'transparent',
        padding: '0 2px', textAlign: 'center', marginTop: 2,
        maxWidth: 54, wordBreak: 'break-word', lineHeight: 1.2,
      }}>{label}</span>
    </div>
  );
};

// ── Taskbar clock ─────────────────────────────────────────────────────────────
const Clock = () => {
  const [t, setT] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => { const id = setInterval(() => setT(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 30000); return () => clearInterval(id); }, []);
  return <span>{t}</span>;
};

// ── Window registry ───────────────────────────────────────────────────────────
const WINDOWS_DEF = [
  { id: 'showcase', label: 'Portfolio', icon: '🖥', isShowcase: true },
  { id: 'tetris',   label: 'Tetris',    icon: '🎮', Panel: TetrisContent },
];

// Approximate rendered sizes for centering calculations
const WIN_SIZES = {
  showcase: { w: SHOWCASE_W, h: SHOWCASE_H },
  tetris:   { w: 260, h: 360 },
  default:  { w: 260, h: 360 },
};

// ── MacOSDesktop (Win95 themed) — main export ─────────────────────────────────
const MacOSDesktop = ({ bounds, onClose }) => {
  const TASKBAR_H = 32;
  const [visible, setVisible] = useState(false);

  // Compute centered starting position for a window
  const centerPos = useCallback((id) => {
    const { w, h } = WIN_SIZES[id] ?? WIN_SIZES.default;
    return {
      x: Math.max(0, Math.round((bounds.width  - w) / 2)),
      y: Math.max(0, Math.round((bounds.height - TASKBAR_H - h) / 2)),
    };
  }, [bounds]);

  const [openWindows, setOpenWindows] = useState(() => {
    const p = centerPos('showcase');
    return [{ id: 'showcase', label: 'Portfolio', icon: '🖥', isShowcase: true, zIndex: 10, initialX: p.x, initialY: p.y, minimized: false }];
  });
  const [startOpen, setStartOpen] = useState(false);
  const [activeWin, setActiveWin] = useState('showcase');
  const zRef = useRef(10);

  // Fade in after two animation frames so the CSS transition fires
  useEffect(() => { const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))); return () => cancelAnimationFrame(raf); }, []);

  const bringToFront = useCallback((id) => {
    zRef.current += 1; setActiveWin(id);
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: zRef.current } : w));
  }, []);

  const openWindow = useCallback((def) => {
    setStartOpen(false);
    if (openWindows.find(w => w.id === def.id)) { bringToFront(def.id); return; }
    zRef.current += 1;
    const p = centerPos(def.id);
    const offset = openWindows.length * 14;
    setOpenWindows(prev => [...prev, { ...def, zIndex: zRef.current, initialX: p.x + offset, initialY: p.y + offset, minimized: false }]);
    setActiveWin(def.id);
  }, [openWindows, bringToFront, centerPos]);

  const closeWindow    = useCallback((id) => setOpenWindows(prev => prev.filter(w => w.id !== id)), []);
  const minimizeWindow = useCallback((id) => setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w)), []);
  const toggleMinimize = useCallback((id) => {
    zRef.current += 1; setActiveWin(id);
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: !w.minimized, zIndex: zRef.current } : w));
  }, []);

  const handleExit = () => { setVisible(false); setTimeout(onClose, 300); };

  return (
    <div style={{
      position: 'fixed', left: bounds.left, top: bounds.top,
      width: bounds.width, height: bounds.height,
      zIndex: 100, overflow: 'hidden', borderRadius: 16,
      boxShadow: '0 0 0 2px #111, 0 0 18px 4px rgba(80,180,255,0.45), 0 0 45px 10px rgba(40,120,255,0.2), inset 0 0 20px rgba(0,0,0,0.6)',
      opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease',
    }}>
      <style>{`
        @keyframes crt-flicker {
          0%,100% { opacity: 1; }
          48%     { opacity: 1; }
          50%     { opacity: 0.96; }
          52%     { opacity: 1; }
          88%     { opacity: 1; }
          90%     { opacity: 0.94; }
          92%     { opacity: 1; }
        }
        @keyframes scan-roll {
          0%   { transform: translateY(-8%); }
          100% { transform: translateY(108%); }
        }
      `}</style>

      {/* CRT effects wrapper */}
      <div style={{ position: 'absolute', inset: 0, animation: 'crt-flicker 8s ease-in-out infinite' }}>
        <NoiseOverlay w={Math.round(bounds.width)} h={Math.round(bounds.height)} />

        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 2px)',
        }} />

        {/* Rolling scan band — subtle bright stripe that drifts down the screen */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '8%',
          background: 'linear-gradient(180deg,transparent 0%,rgba(255,255,255,0.018) 50%,transparent 100%)',
          animation: 'scan-roll 4s linear infinite',
          pointerEvents: 'none', zIndex: 9998,
        }} />

        {/* Desktop */}
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: '100%', height: `calc(100% - ${TASKBAR_H}px)`,
          background: W.desktop, overflow: 'hidden',
        }} onClick={() => setStartOpen(false)}>

          {/* Desktop icons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 4px', position: 'relative', zIndex: 1 }}>
            {WINDOWS_DEF.map(def => (
              <DesktopIcon key={def.id} icon={def.icon} label={def.label} onDoubleClick={() => openWindow(def)} />
            ))}
          </div>

          {/* Open windows — wrapper visibility preserves DOM state (Tetris keeps running when minimized) */}
          {openWindows.map(w => {
            const hidden = { opacity: 0, pointerEvents: 'none' };
            if (w.isShowcase) return (
              <div key={w.id} style={w.minimized ? hidden : {}}>
                <ShowcaseExplorer
                  onClose={() => closeWindow(w.id)} onMinimize={() => minimizeWindow(w.id)} onFocus={() => bringToFront(w.id)}
                  zIndex={w.zIndex} initialX={w.initialX} initialY={w.initialY}
                  desktopW={bounds.width} desktopH={bounds.height}
                />
              </div>
            );
            const Panel = w.Panel;
            return (
              <div key={w.id} style={w.minimized ? hidden : {}}>
                <Win95Window
                  title={w.label} icon={w.icon}
                  zIndex={w.zIndex} initialX={w.initialX} initialY={w.initialY}
                  desktopW={bounds.width} desktopH={bounds.height}
                  noMaximize={w.id === 'tetris'}
                  onClose={() => closeWindow(w.id)} onMinimize={() => minimizeWindow(w.id)} onFocus={() => bringToFront(w.id)}
                >
                  <Panel />
                </Win95Window>
              </div>
            );
          })}

          {/* Start menu */}
          {startOpen && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 170, zIndex: 5000, background: W.winBg, ...deepRaised }}>
              <div style={{ background: `linear-gradient(90deg,${W.titleActive},#1084d0)`, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, ...sunken, background: '#000060', display: 'flex', alignItems: 'center', justifyContent: 'center', color: W.white, fontSize: 12, fontWeight: 700, fontFamily: SANS }}>VP</div>
                <span style={{ color: W.white, fontFamily: SANS, fontSize: 11, fontWeight: 700 }}>Vishakha Pathak</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {WINDOWS_DEF.map(def => (
                  <div key={def.id} onClick={() => openWindow(def)}
                    onMouseEnter={e => { e.currentTarget.style.background = W.titleActive; e.currentTarget.style.color = W.white; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = W.black; }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', cursor: 'default', fontFamily: SANS, fontSize: 11, color: W.black }}>
                    <span style={{ fontSize: 16 }}>{def.icon}</span>{def.label}
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${W.dark}`, margin: '4px 8px' }} />
                <div onClick={handleExit}
                  onMouseEnter={e => { e.currentTarget.style.background = W.titleActive; e.currentTarget.style.color = W.white; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = W.black; }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', cursor: 'default', fontFamily: SANS, fontSize: 11, color: W.black }}>
                  <span style={{ fontSize: 16 }}>⏻</span> Shut Down
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Taskbar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: TASKBAR_H, display: 'flex', alignItems: 'center', gap: 3,
          background: W.taskbar, padding: '2px 4px',
          borderTop: `2px solid ${W.white}`, zIndex: 4000,
        }}>
          <div
            onClick={(e) => { e.stopPropagation(); setStartOpen(s => !s); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', height: 24,
              background: W.winBg, fontFamily: SANS, fontWeight: 700, fontSize: 11, color: W.black,
              cursor: 'default', userSelect: 'none',
              ...(startOpen ? sunken : raised),
            }}>
            <span style={{ fontSize: 13 }}>⊞</span> Start
          </div>
          <div style={{ width: 2, height: 22, borderLeft: `1px solid ${W.dark}`, borderRight: `1px solid ${W.white}`, margin: '0 2px' }} />

          {openWindows.map(w => (
            <div key={w.id} onClick={() => toggleMinimize(w.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '1px 6px', maxWidth: 120, height: 22,
                background: W.winBg, fontFamily: SANS, fontSize: 10, color: W.black,
                cursor: 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                ...(activeWin === w.id && !w.minimized ? sunken : raised),
              }}>
              <span style={{ fontSize: 10 }}>{w.icon}</span>
              {w.label}
            </div>
          ))}

          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', fontFamily: SANS, fontSize: 10, color: W.black, ...sunken }}>
            🔊 <Clock />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacOSDesktop;
