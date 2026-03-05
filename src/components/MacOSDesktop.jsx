import { useCallback, useEffect, useRef, useState } from 'react';

// ── WebGL noise overlay ───────────────────────────────────────────────────────
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
    const gl = canvas.getContext('webgl', { premultipliedAlpha:false });
    if (!gl) return;
    const mk = (src,type) => { const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(VERT_SRC, gl.VERTEX_SHADER));
    gl.attachShader(prog, mk(FRAG_SRC, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog,'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);
    const uTime = gl.getUniformLocation(prog,'u_time');
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const t0 = performance.now(); let raf;
    const draw = () => { gl.uniform1f(uTime,(performance.now()-t0)*0.001); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); raf=requestAnimationFrame(draw); };
    draw();
    return () => { cancelAnimationFrame(raf); gl.deleteBuffer(buf); gl.deleteProgram(prog); };
  }, [w, h]);
  return <canvas ref={ref} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:10 }} />;
};

// ── Windows 95 palette ────────────────────────────────────────────────────────
const W = {
  desktop:   '#008080',   // classic teal
  winBg:     '#c0c0c0',   // window chrome / button face
  titleActive:'#000080',  // navy title bar
  titleText: '#ffffff',
  white:     '#ffffff',
  black:     '#000000',
  dark:      '#808080',
  darker:    '#404040',
  content:   '#ffffff',   // inner content area
  taskbar:   '#c0c0c0',
};
const SANS = '"MS Sans Serif","Tahoma","Arial",sans-serif';

// ── Win95 3-D border helpers ──────────────────────────────────────────────────
// raised: light top/left, dark bottom/right
const raised = {
  borderTop:   `2px solid ${W.white}`,
  borderLeft:  `2px solid ${W.white}`,
  borderBottom:`2px solid ${W.dark}`,
  borderRight: `2px solid ${W.dark}`,
};
// sunken: dark top/left, light bottom/right
const sunken = {
  borderTop:   `2px solid ${W.dark}`,
  borderLeft:  `2px solid ${W.dark}`,
  borderBottom:`2px solid ${W.white}`,
  borderRight: `2px solid ${W.white}`,
};
// deep-raised (outer black + inner raised)
const deepRaised = {
  outline:     `1px solid ${W.black}`,
  borderTop:   `2px solid ${W.white}`,
  borderLeft:  `2px solid ${W.white}`,
  borderBottom:`2px solid ${W.darker}`,
  borderRight: `2px solid ${W.darker}`,
};

// ── Win95 title-bar button ────────────────────────────────────────────────────
const TitleBtn95 = ({ label, onClick }) => {
  const [down, setDown] = useState(false);
  return (
    <div
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      onClick={onClick}
      style={{
        width:16, height:14,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: W.winBg,
        ...(down ? sunken : raised),
        fontSize:9, fontWeight:700, fontFamily:SANS,
        color: W.black, cursor:'default',
        flexShrink:0, userSelect:'none',
      }}
    >{label}</div>
  );
};

// ── Win95 regular button ──────────────────────────────────────────────────────
const Btn95 = ({ children, onClick, style }) => {
  const [down, setDown] = useState(false);
  return (
    <button
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      onClick={onClick}
      style={{
        background:W.winBg, fontFamily:SANS, fontSize:11, color:W.black,
        padding:'3px 12px', cursor:'default',
        ...(down ? sunken : raised),
        ...style,
      }}
    >{children}</button>
  );
};

// ── Win95 Window chrome ───────────────────────────────────────────────────────
const Win95Window = ({ title, icon, onClose, onFocus, zIndex=10, initialX=20, initialY=20, children }) => {
  const [pos, setPos] = useState({ x:initialX, y:initialY });
  const drag = useRef({ active:false, sx:0, sy:0 });

  const onDown = (e) => {
    if (drag.current.active) return;
    e.preventDefault(); onFocus?.();
    drag.current = { active:true, sx:e.clientX-pos.x, sy:e.clientY-pos.y };
    const mv = (e) => { if (drag.current.active) setPos({ x:e.clientX-drag.current.sx, y:e.clientY-drag.current.sy }); };
    const up = () => { drag.current.active=false; document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); };
    document.addEventListener('mousemove',mv);
    document.addEventListener('mouseup',up);
  };

  return (
    <div onMouseDown={onFocus} style={{
      position:'absolute', left:pos.x, top:pos.y, zIndex,
      background:W.winBg,
      ...deepRaised,
    }}>
      {/* Title bar */}
      <div onMouseDown={onDown} style={{
        background:W.titleActive,
        padding:'2px 3px 2px 4px',
        display:'flex', alignItems:'center', gap:3,
        cursor:'default', userSelect:'none', height:18,
        backgroundImage:`linear-gradient(90deg,${W.titleActive},#1084d0)`,
      }}>
        {icon && <span style={{ fontSize:11, lineHeight:1 }}>{icon}</span>}
        <span style={{
          flex:1, color:W.titleText, fontFamily:SANS, fontSize:11, fontWeight:700,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{title}</span>
        <TitleBtn95 label="─" onClick={() => {}} />
        <TitleBtn95 label="□" onClick={() => {}} />
        <TitleBtn95 label="✕" isClose onClick={(e) => { e.stopPropagation(); onClose(); }} />
      </div>
      {/* Content */}
      <div style={{ background:W.winBg }}>
        {children}
      </div>
    </div>
  );
};

// ── Page content helpers ──────────────────────────────────────────────────────
const H1 = ({ children }) => (
  <h1 style={{ fontFamily:SANS, fontSize:18, margin:'0 0 2px 0', color:W.black, fontWeight:700 }}>{children}</h1>
);
const H3sub = ({ children }) => (
  <h3 style={{ fontFamily:SANS, fontSize:11, fontWeight:'normal', color:'#444', margin:'0 0 10px 0' }}>{children}</h3>
);
const SecTitle = ({ children }) => (
  <h3 style={{
    fontFamily:SANS, fontSize:12, fontWeight:700, margin:'0 0 6px 0', color:W.black,
    borderBottom:`2px solid ${W.dark}`, paddingBottom:2,
  }}>{children}</h3>
);
const P = ({ children, style }) => (
  <p style={{ fontFamily:SANS, fontSize:11, lineHeight:1.65, color:'#111', margin:'0 0 7px 0', ...style }}>{children}</p>
);
const SocialLink = ({ icon, label, href }) => (
  <a href={href} target="_blank" rel="noreferrer" style={{
    display:'flex', alignItems:'center', gap:4,
    fontFamily:SANS, fontSize:10, color:W.black, textDecoration:'none',
    background:W.winBg, padding:'2px 8px',
    ...raised,
  }}>
    {icon} {label}
  </a>
);

// ── Home page ─────────────────────────────────────────────────────────────────
const HomePage = () => (
  <div style={{ padding:'14px 16px' }}>
    <H1>Welcome</H1>
    <H3sub>I'm Vishakha Pathak</H3sub>
    <P>I'm a software engineer currently pursuing my MS in Information Systems at Carnegie Mellon University.</P>
    <P>Thank you for taking the time to check out my portfolio! I hope you enjoy exploring it. Feel free to reach out anytime.</P>
    <div style={{ marginBottom:12 }}>
      <Btn95>📄 Download Resume</Btn95>
    </div>
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      <SocialLink icon="🐙" label="GitHub"   href="https://github.com/vishakhapathak" />
      <SocialLink icon="💼" label="LinkedIn" href="https://linkedin.com/in/vishakhapathak" />
      <SocialLink icon="✉"  label="Email"    href="mailto:vishakhapathak@example.com" />
    </div>
  </div>
);

// ── About page ────────────────────────────────────────────────────────────────
const AboutPage = () => (
  <div style={{ padding:'14px 16px' }}>
    <H1>Welcome</H1>
    <H3sub>I'm Vishakha Pathak</H3sub>

    <P>I'm a software engineer pursuing my MS in Information Systems at Carnegie Mellon University (graduating 2025). I love building things at the intersection of design and engineering.</P>
    <P>Thank you for taking the time to check out my portfolio. I hope you enjoy exploring it as much as I enjoyed building it.</P>

    {/* Photo placeholder */}
    <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
      <div>
        <div style={{
          ...sunken, width:72, height:72,
          background:'linear-gradient(135deg,#000060 0%,#0000aa 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:W.white, fontSize:20, fontWeight:700, marginBottom:3,
        }}>VP</div>
        <p style={{ margin:0, fontSize:9, color:'#555', fontFamily:SANS }}>
          <b>Figure 1:</b> Me 🙂
        </p>
      </div>
      <P style={{ flex:1 }}>
        From a young age I've had a deep curiosity about how things work. Growing up in India, technology and problem-solving became natural obsessions that led me into computer science.
      </P>
    </div>

    <SecTitle>About Me</SecTitle>
    <P>I started programming seriously in high school, beginning with web development and quickly moving into full-stack applications. I worked on passion projects ranging from scrapers to game prototypes, many with close friends and classmates.</P>
    <P>In 2018, I joined Manipal Institute of Technology for my B.Tech in Computer Science. Towards the end of my undergrad, I interned at a startup focused on ML infrastructure — which solidified my love for scalable software.</P>
    <P>In 2024, I joined Carnegie Mellon University for my MS in Information Systems, where I've served as a Teaching Assistant for OOP in Java and Linux/Open Source courses. I also placed runner-up in CMU's Hack-a-Startup Product Wars competition in 2024, building and pitching a product in under 24 hours.</P>

    <SecTitle>My Hobbies</SecTitle>
    <div style={{ display:'flex', gap:12, marginBottom:8 }}>
      <div style={{ flex:1 }}>
        <P>Beyond software, I love photography, hiking, and building creative side projects. I'm always looking for outlets that merge aesthetics with engineering.</P>
        <P>I also enjoy cooking, reading, and (unsurprisingly) playing video games — the Tetris window on this desktop is proof. 🎮</P>
      </div>
      <div style={{ flexShrink:0, textAlign:'center' }}>
        <div style={{
          ...sunken, width:56, height:72,
          background:'linear-gradient(135deg,#003060,#005090)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:W.white, fontSize:9, fontFamily:SANS, marginBottom:3,
        }}>photo</div>
        <p style={{ margin:0, fontSize:8, color:'#555', fontFamily:SANS }}><b>Figure 2:</b> 2024</p>
      </div>
    </div>

    <P>Thanks for reading about me! If you find something cool, let me know. You can reach me through the Contact page or at{' '}
      <a href="mailto:vishakhapathak@example.com" style={{ color:'#000080' }}>vishakhapathak@example.com</a>
    </P>
  </div>
);

// ── Experience page ───────────────────────────────────────────────────────────
const ExperiencePage = () => (
  <div style={{ padding:'14px 16px' }}>
    <H1>Experience</H1>
    <div style={{ height:10 }} />
    {[
      {
        role:'Teaching Assistant',
        company:'Carnegie Mellon University',
        period:'Aug 2024 – Present',
        desc:'TA for Object-Oriented Programming in Java and Linux/Open Source courses. Hold weekly office hours, grade assignments, and mentor students on fundamentals.',
      },
      {
        role:'Hack-a-Startup Finalist',
        company:'CMU — Product Wars Runner-Up',
        period:'2024',
        desc:'Built and pitched a full product with a 3-person team in under 24 hours. Placed runner-up out of 20+ competing teams.',
      },
      {
        role:'[ Add Your Role ]',
        company:'[ Company Name ]',
        period:'20XX – 20XX',
        desc:'Placeholder — fill in your work experience here. Edit MacOSDesktop.jsx → ExperiencePage.',
      },
    ].map((job, i, arr) => (
      <div key={i} style={{
        marginBottom:10, paddingBottom:10,
        borderBottom: i < arr.length-1 ? `1px solid ${W.dark}` : 'none',
      }}>
        <div style={{ fontWeight:700, fontSize:12, fontFamily:SANS, color:W.black, marginBottom:1 }}>{job.role}</div>
        <div style={{ color:'#000080', fontSize:11, fontFamily:SANS, marginBottom:2 }}>{job.company}</div>
        <div style={{ color:W.dark, fontSize:10, fontFamily:SANS, marginBottom:4 }}>{job.period}</div>
        <P style={{ margin:0 }}>{job.desc}</P>
      </div>
    ))}
  </div>
);

// ── Projects page ─────────────────────────────────────────────────────────────
const ProjectsPage = () => (
  <div style={{ padding:'14px 16px' }}>
    <H1>Projects</H1>
    <div style={{ height:10 }} />
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
      {[
        { name:'3D Portfolio',  desc:'This site — 3D hacker room with zoomable monitor running a fake Win95 desktop.', tech:'React · Three.js · R3F · GSAP' },
        { name:'[ Project 2 ]', desc:'Add your project description here.',  tech:'[ Tech stack ]' },
        { name:'[ Project 3 ]', desc:'Add your project description here.',  tech:'[ Tech stack ]' },
        { name:'[ Project 4 ]', desc:'Add your project description here.',  tech:'[ Tech stack ]' },
      ].map((proj, i) => (
        <div key={i} style={{ ...sunken, background:W.content, padding:'7px 9px' }}>
          <div style={{ fontWeight:700, fontSize:11, fontFamily:SANS, marginBottom:3 }}>{proj.name}</div>
          <div style={{ fontSize:10, color:'#333', fontFamily:SANS, lineHeight:1.5, marginBottom:4 }}>{proj.desc}</div>
          <div style={{ fontSize:9, color:W.dark, fontFamily:SANS, fontStyle:'italic' }}>{proj.tech}</div>
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

  const fieldInput = {
    width:'100%', boxSizing:'border-box',
    background:W.content, fontFamily:SANS, fontSize:10,
    padding:'2px 4px', color:W.black, outline:'none',
    ...sunken,
  };
  const label = (text, required) => (
    <div style={{ fontSize:10, fontFamily:SANS, fontWeight:700, color:W.black, marginBottom:2 }}>
      {required && !((text==='Name'&&name)||(text==='Email'&&email)||(text==='Message'&&message)) &&
        <span style={{ color:'red', marginRight:3 }}>*</span>
      }{text}:
    </div>
  );

  return (
    <div style={{ padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <H1>Contact</H1>
        <div style={{ display:'flex', gap:4 }}>
          {[
            { icon:'🐙', href:'https://github.com/vishakhapathak', title:'GitHub' },
            { icon:'💼', href:'https://linkedin.com/in/vishakhapathak', title:'LinkedIn' },
          ].map(s => (
            <a key={s.title} href={s.href} target="_blank" rel="noreferrer" title={s.title} style={{
              width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center',
              background:W.winBg, textDecoration:'none', fontSize:13, ...raised,
            }}>{s.icon}</a>
          ))}
        </div>
      </div>

      <P>I'm always open to new opportunities. Feel free to reach out — I'd love to chat!</P>
      <P><b>Email: </b><a href="mailto:vishakhapathak@example.com" style={{ color:'#000080' }}>vishakhapathak@example.com</a></P>

      <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
        <div>{label('Name', true)}<input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={fieldInput} /></div>
        <div>{label('Email', true)}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={fieldInput} /></div>
        <div>{label('Message', true)}<textarea rows={3} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Your message..." style={{ ...fieldInput, resize:'none' }} /></div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Btn95>Send Message</Btn95>
          <span style={{ fontSize:9, color:W.dark, fontFamily:SANS }}><b style={{ color:'red' }}>*</b> = required</span>
        </div>
      </div>
    </div>
  );
};

// ── Showcase Explorer ─────────────────────────────────────────────────────────
const SHOWCASE_PAGES = [
  { id:'home',       label:'Home',       icon:'🏠' },
  { id:'about',      label:'About',      icon:'👤' },
  { id:'experience', label:'Experience', icon:'💼' },
  { id:'projects',   label:'Projects',   icon:'📁' },
  { id:'contact',    label:'Contact',    icon:'✉'  },
];
const PAGE_MAP = {
  home: HomePage, about: AboutPage,
  experience: ExperiencePage, projects: ProjectsPage, contact: ContactPage,
};

const NavItem95 = ({ page, active, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        padding:'8px 4px', cursor:'default',
        background: active ? W.titleActive : hov ? '#a0a0a0' : 'transparent',
        color: active ? W.white : W.black,
        fontFamily:SANS, fontSize:10,
        borderBottom:`1px solid ${W.dark}`,
        gap:3, userSelect:'none',
      }}
    >
      <span style={{ fontSize:16, lineHeight:1 }}>{page.icon}</span>
      {page.label}
    </div>
  );
};

const ShowcaseExplorer = ({ onClose, onFocus, zIndex, initialX, initialY }) => {
  const [page, setPage] = useState('home');
  const Page = PAGE_MAP[page];
  return (
    <Win95Window
      title="Vishakha Pathak — Showcase 2025"
      icon="🖥"
      onClose={onClose} onFocus={onFocus}
      zIndex={zIndex} initialX={initialX} initialY={initialY}
    >
      {/* Win95-style menu bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:0,
        background:W.winBg, borderBottom:`1px solid ${W.dark}`,
        padding:'1px 2px',
      }}>
        {['File','Edit','View','Help'].map(m => (
          <div key={m} style={{
            fontFamily:SANS, fontSize:11, padding:'1px 6px',
            color:W.black, cursor:'default', userSelect:'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background='#000080'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >{m}</div>
        ))}
      </div>
      {/* Address bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:4,
        background:W.winBg, padding:'2px 4px',
        borderBottom:`1px solid ${W.dark}`,
      }}>
        <span style={{ fontFamily:SANS, fontSize:10, color:W.black }}>Address</span>
        <div style={{
          flex:1, background:W.content, padding:'1px 4px',
          fontFamily:SANS, fontSize:10, color:W.black,
          ...sunken,
        }}>C:\Desktop\Showcase\{page}</div>
        <Btn95 style={{ padding:'1px 8px', fontSize:10 }}>Go</Btn95>
      </div>
      {/* Main area: nav + content */}
      <div style={{ display:'flex', width:460, height:290 }}>
        {/* Left nav */}
        <nav style={{
          width:95, background:W.winBg,
          borderRight:`2px solid ${W.dark}`,
          flexShrink:0, overflowY:'auto',
        }}>
          <div style={{
            background:W.titleActive, color:W.white,
            fontFamily:SANS, fontSize:10, fontWeight:700,
            padding:'3px 6px',
            backgroundImage:`linear-gradient(90deg,${W.titleActive},#1084d0)`,
          }}>
            Folders
          </div>
          {SHOWCASE_PAGES.map(p => (
            <NavItem95 key={p.id} page={p} active={page===p.id} onClick={() => setPage(p.id)} />
          ))}
          <div style={{ padding:'6px 4px', fontFamily:SANS, fontSize:8, color:W.dark, textAlign:'center' }}>
            © 2025 Vishakha Pathak
          </div>
        </nav>
        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', background:W.content, ...sunken }}>
          <Page />
        </div>
      </div>
      {/* Status bar */}
      <div style={{
        display:'flex', alignItems:'center',
        background:W.winBg, padding:'1px 4px',
        borderTop:`1px solid ${W.dark}`,
        gap:8,
      }}>
        <div style={{ ...sunken, padding:'0 6px', fontFamily:SANS, fontSize:10, color:W.black, flex:1 }}>
          {SHOWCASE_PAGES.find(p=>p.id===page)?.label}
        </div>
        <div style={{ ...sunken, padding:'0 6px', fontFamily:SANS, fontSize:10, color:W.black }}>
          Vishakha Pathak Portfolio
        </div>
      </div>
    </Win95Window>
  );
};

// ── Tetris ────────────────────────────────────────────────────────────────────
const COLS=10,ROWS=18,CELL=10;
const PIECES=[
  {shapes:[[[1,1,1,1]],[[1],[1],[1],[1]]],color:'#00ccee'},
  {shapes:[[[1,1],[1,1]]],color:'#eeee00'},
  {shapes:[[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[1,1,1],[0,1,0]],[[0,1],[1,1],[0,1]]],color:'#aa00ee'},
  {shapes:[[[0,1,1],[1,1,0]],[[1,0],[1,1],[0,1]]],color:'#00ee44'},
  {shapes:[[[1,1,0],[0,1,1]],[[0,1],[1,1],[1,0]]],color:'#ee2222'},
  {shapes:[[[1,0,0],[1,1,1]],[[1,1],[1,0],[1,0]],[[1,1,1],[0,0,1]],[[0,1],[0,1],[1,1]]],color:'#2255ff'},
  {shapes:[[[0,0,1],[1,1,1]],[[1,0],[1,0],[1,1]],[[1,1,1],[1,0,0]],[[1,1],[0,1],[0,1]]],color:'#ff8800'},
];
const emptyBoard=()=>Array.from({length:ROWS},()=>Array(COLS).fill(null));
const newPiece=()=>{const p=PIECES[Math.floor(Math.random()*PIECES.length)];return{piece:p,rot:0,x:Math.floor(COLS/2)-1,y:0};};
const getShape=a=>a.piece.shapes[a.rot%a.piece.shapes.length];
const isValid=(board,shape,x,y)=>{
  for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)
    if(shape[r][c]){if(x+c<0||x+c>=COLS||y+r>=ROWS)return false;if(y+r>=0&&board[y+r][x+c])return false;}
  return true;
};
const TetrisContent=()=>{
  const canvasRef=useRef();const gs=useRef(null);
  const[ui,setUi]=useState({score:0,level:1,lines:0,over:false});
  const mkState=()=>({board:emptyBoard(),active:newPiece(),score:0,level:1,lines:0,over:false});
  const render=useCallback(()=>{
    const canvas=canvasRef.current;if(!canvas||!gs.current)return;
    const ctx=canvas.getContext('2d');const s=gs.current;const W2=COLS*CELL,H=ROWS*CELL;
    ctx.fillStyle='#111';ctx.fillRect(0,0,W2,H);
    ctx.strokeStyle='#1a1a1a';ctx.lineWidth=0.5;
    for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CELL);ctx.lineTo(W2,r*CELL);ctx.stroke();}
    for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*CELL,0);ctx.lineTo(c*CELL,H);ctx.stroke();}
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(s.board[r][c]){ctx.fillStyle=s.board[r][c];ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,CELL-2);}
    if(!s.over&&s.active){
      const shape=getShape(s.active);let gy=s.active.y;
      while(isValid(s.board,shape,s.active.x,gy+1))gy++;
      ctx.fillStyle='rgba(255,255,255,0.08)';
      for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c])ctx.fillRect((s.active.x+c)*CELL+1,(gy+r)*CELL+1,CELL-2,CELL-2);
      ctx.fillStyle=s.active.piece.color;
      for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c])ctx.fillRect((s.active.x+c)*CELL+1,(s.active.y+r)*CELL+1,CELL-2,CELL-2);
    }
    if(s.over){ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W2,H);ctx.fillStyle='#fff';ctx.font=`bold ${CELL}px Tahoma`;ctx.textAlign='center';ctx.fillText('GAME OVER',W2/2,H/2-CELL);ctx.font=`${CELL-1}px Tahoma`;ctx.fillText('press R',W2/2,H/2+CELL);}
  },[]);
  const lock=useCallback(()=>{
    const s=gs.current;const shape=getShape(s.active);const board=s.board.map(r=>[...r]);
    for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c]&&s.active.y+r>=0)board[s.active.y+r][s.active.x+c]=s.active.piece.color;
    let cleared=0;const kept=board.filter(row=>row.some(c=>!c));
    while(kept.length<ROWS){kept.unshift(Array(COLS).fill(null));cleared++;}
    const lines=s.lines+cleared,score=s.score+[0,40,100,300,1200][cleared]*s.level,level=Math.floor(lines/10)+1;
    const active=newPiece(),over=!isValid(kept,getShape(active),active.x,active.y);
    gs.current={board:kept,active,score,level,lines,over};setUi({score,level,lines,over});
  },[]);
  const tick=useCallback(()=>{
    const s=gs.current;if(!s||s.over)return;
    const shape=getShape(s.active);
    if(isValid(s.board,shape,s.active.x,s.active.y+1))gs.current={...s,active:{...s.active,y:s.active.y+1}};else lock();
    render();
  },[lock,render]);
  useEffect(()=>{gs.current=mkState();render();},[render]);
  useEffect(()=>{if(ui.over)return;const id=setInterval(tick,Math.max(80,700-(ui.level-1)*60));return()=>clearInterval(id);},[tick,ui.level,ui.over]);
  useEffect(()=>{
    const GAME_KEYS=new Set(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyR']);
    const onKey=(e)=>{
      if(!GAME_KEYS.has(e.code))return;e.preventDefault();e.stopPropagation();
      const s=gs.current;if(!s)return;
      if(e.code==='KeyR'){gs.current=mkState();setUi({score:0,level:1,lines:0,over:false});render();return;}
      if(s.over)return;
      let{active}=s;const shape=getShape(active);
      if(e.code==='ArrowLeft'&&isValid(s.board,shape,active.x-1,active.y))active={...active,x:active.x-1};
      else if(e.code==='ArrowRight'&&isValid(s.board,shape,active.x+1,active.y))active={...active,x:active.x+1};
      else if(e.code==='ArrowDown'&&isValid(s.board,shape,active.x,active.y+1))active={...active,y:active.y+1};
      else if(e.code==='ArrowUp'){const rot=active.piece.shapes[(active.rot+1)%active.piece.shapes.length];if(isValid(s.board,rot,active.x,active.y))active={...active,rot:active.rot+1};}
      else if(e.code==='Space'){let ny=active.y;while(isValid(s.board,shape,active.x,ny+1))ny++;gs.current={...s,active:{...active,y:ny}};lock();render();return;}
      gs.current={...s,active};render();
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[lock,render]);
  return(
    <div style={{display:'flex',gap:8,padding:'6px 8px',background:W.winBg}}>
      <canvas ref={canvasRef} width={COLS*CELL} height={ROWS*CELL} style={{...sunken,display:'block'}}/>
      <div style={{fontFamily:SANS,fontSize:10,lineHeight:1.5,color:W.black}}>
        {[['SCORE',ui.score],['LEVEL',ui.level],['LINES',ui.lines]].map(([k,v])=>(
          <div key={k} style={{marginBottom:8}}>
            <div style={{...sunken,padding:'0 4px',fontSize:9,color:W.dark}}>{k}</div>
            <div style={{fontWeight:700,fontSize:13,padding:'1px 0'}}>{v}</div>
          </div>
        ))}
        <div style={{marginTop:6,fontSize:9,color:W.dark,lineHeight:1.8}}>←→ move<br/>↑ rotate<br/>↓ fall<br/>SPC drop<br/>R reset</div>
      </div>
    </div>
  );
};

// ── Desktop icon ──────────────────────────────────────────────────────────────
const DesktopIcon=({icon,label,onDoubleClick})=>{
  const[sel,setSel]=useState(false);
  return(
    <div onClick={()=>setSel(true)} onDoubleClick={onDoubleClick} onBlur={()=>setSel(false)} tabIndex={0}
      style={{display:'flex',flexDirection:'column',alignItems:'center',width:54,padding:4,cursor:'default',outline:'none'}}>
      <div style={{
        fontSize:26,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',
        background:sel?'rgba(0,0,128,0.5)':'transparent',
        outline:sel?'1px dotted #fff':'none',
      }}>{icon}</div>
      <span style={{
        fontFamily:SANS,fontSize:10,color:W.white,
        textShadow:'1px 1px 2px #000',
        background:sel?W.titleActive:'transparent',
        padding:'0 2px',textAlign:'center',marginTop:2,
        maxWidth:54,wordBreak:'break-word',lineHeight:1.2,
      }}>{label}</span>
    </div>
  );
};

// ── Clock ─────────────────────────────────────────────────────────────────────
const Clock=()=>{
  const[t,setT]=useState(()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
  useEffect(()=>{const id=setInterval(()=>setT(new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})),30000);return()=>clearInterval(id);},[]);
  return<span>{t}</span>;
};

// ── Window registry ───────────────────────────────────────────────────────────
const WINDOWS_DEF=[
  {id:'showcase',label:'Showcase',   icon:'🖥',isShowcase:true},
  {id:'tetris',  label:'Tetris',     icon:'🎮',Panel:TetrisContent},
];

// ── MacOSDesktop (Win95 themed) ───────────────────────────────────────────────
const MacOSDesktop=({bounds,onClose})=>{
  const[visible,setVisible]=useState(false);
  const[openWindows,setOpenWindows]=useState([
    {id:'showcase',label:'Showcase 2025',icon:'🖥',isShowcase:true,zIndex:10,initialX:6,initialY:6},
  ]);
  const[startOpen,setStartOpen]=useState(false);
  const[activeWin,setActiveWin]=useState('showcase');
  const zRef=useRef(10);

  useEffect(()=>{const raf=requestAnimationFrame(()=>requestAnimationFrame(()=>setVisible(true)));return()=>cancelAnimationFrame(raf);},[]);

  const bringToFront=useCallback((id)=>{
    zRef.current+=1;setActiveWin(id);
    setOpenWindows(prev=>prev.map(w=>w.id===id?{...w,zIndex:zRef.current}:w));
  },[]);

  const openWindow=useCallback((def)=>{
    setStartOpen(false);
    if(openWindows.find(w=>w.id===def.id)){bringToFront(def.id);return;}
    zRef.current+=1;
    const offset=openWindows.length*16;
    setOpenWindows(prev=>[...prev,{...def,zIndex:zRef.current,initialX:6+offset,initialY:6+offset}]);
    setActiveWin(def.id);
  },[openWindows,bringToFront]);

  const closeWindow=useCallback((id)=>setOpenWindows(prev=>prev.filter(w=>w.id!==id)),[]);
  const handleExit=()=>{setVisible(false);setTimeout(onClose,300);};
  const TASKBAR_H=32;

  return(
    <div style={{
      position:'fixed',left:bounds.left,top:bounds.top,
      width:bounds.width,height:bounds.height,
      zIndex:100,overflow:'hidden',
      borderRadius:16,
      boxShadow:'0 0 0 2px #111, 0 0 18px 4px rgba(80,180,255,0.45), 0 0 45px 10px rgba(40,120,255,0.2), inset 0 0 20px rgba(0,0,0,0.6)',
      opacity:visible?1:0,transition:'opacity 0.35s ease',
    }}>
      <style>{`
        @keyframes w95-jitter{10%{transform:translate(-0.2px,-0.2px)}30%{transform:translate(-0.15px,0)}50%{transform:translate(0.15px,0.15px)}70%{transform:translate(0,-0.15px)}100%{transform:translate(0,0)}}
        @keyframes w95-flicker{0%,100%{filter:brightness(1)}50%{filter:brightness(0.9)}93%{filter:brightness(0.97)}}
      `}</style>

      <div style={{position:'absolute',inset:0,animation:'w95-jitter 0.3s ease-in-out infinite,w95-flicker 7s ease-in-out infinite'}}>
        <NoiseOverlay w={Math.round(bounds.width)} h={Math.round(bounds.height)}/>

        {/* CRT scanlines */}
        <div style={{position:'absolute',inset:0,zIndex:9999,pointerEvents:'none',
          backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.035) 0px,rgba(0,0,0,0.035) 1px,transparent 1px,transparent 2px)'}}/>

        {/* Desktop — classic Win95 teal */}
        <div style={{
          position:'absolute',left:0,top:0,
          width:'100%',height:`calc(100% - ${TASKBAR_H}px)`,
          background:W.desktop,overflow:'hidden',
        }} onClick={()=>setStartOpen(false)}>

          {/* Desktop icons */}
          <div style={{display:'flex',flexDirection:'column',gap:2,padding:'6px 4px',position:'relative',zIndex:1}}>
            {WINDOWS_DEF.map(def=>(
              <DesktopIcon key={def.id} icon={def.icon} label={def.label} onDoubleClick={()=>openWindow(def)}/>
            ))}
          </div>

          {/* Windows */}
          {openWindows.map((w,idx)=>{
            if(w.isShowcase)return(
              <ShowcaseExplorer key={w.id}
                onClose={()=>closeWindow(w.id)} onFocus={()=>bringToFront(w.id)}
                zIndex={w.zIndex} initialX={w.initialX??6} initialY={w.initialY??6}/>
            );
            const Panel=w.Panel;
            return(
              <Win95Window key={w.id} title={w.label} icon={w.icon}
                zIndex={w.zIndex} initialX={w.initialX??6+idx*16} initialY={w.initialY??6+idx*16}
                onClose={()=>closeWindow(w.id)} onFocus={()=>bringToFront(w.id)}>
                <Panel/>
              </Win95Window>
            );
          })}

          {/* Start menu popup */}
          {startOpen&&(
            <div style={{
              position:'absolute',bottom:0,left:0,width:170,zIndex:5000,
              background:W.winBg,...deepRaised,
            }}>
              {/* User banner */}
              <div style={{
                background:`linear-gradient(90deg,${W.titleActive},#1084d0)`,
                padding:'8px 10px',
                display:'flex',alignItems:'center',gap:8,
              }}>
                <div style={{
                  width:28,height:28,...sunken,
                  background:'#000060',display:'flex',alignItems:'center',justifyContent:'center',
                  color:W.white,fontSize:12,fontWeight:700,fontFamily:SANS,
                }}>VP</div>
                <span style={{color:W.white,fontFamily:SANS,fontSize:11,fontWeight:700}}>Vishakha Pathak</span>
              </div>
              {/* Menu items */}
              <div style={{padding:'4px 0'}}>
                {WINDOWS_DEF.map(def=>(
                  <div key={def.id} onClick={()=>openWindow(def)}
                    onMouseEnter={e=>{e.currentTarget.style.background=W.titleActive;e.currentTarget.style.color=W.white;}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=W.black;}}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'4px 10px',cursor:'default',fontFamily:SANS,fontSize:11,color:W.black}}>
                    <span style={{fontSize:16}}>{def.icon}</span>{def.label}
                  </div>
                ))}
                <div style={{borderTop:`1px solid ${W.dark}`,margin:'4px 8px'}}/>
                <div onClick={handleExit}
                  onMouseEnter={e=>{e.currentTarget.style.background=W.titleActive;e.currentTarget.style.color=W.white;}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=W.black;}}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'4px 10px',cursor:'default',fontFamily:SANS,fontSize:11,color:W.black}}>
                  <span style={{fontSize:16}}>⏻</span> Shut Down
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Win95 Taskbar */}
        <div style={{
          position:'absolute',bottom:0,left:0,right:0,
          height:TASKBAR_H,display:'flex',alignItems:'center',gap:3,
          background:W.taskbar,padding:'2px 4px',
          borderTop:`2px solid ${W.white}`,
          zIndex:4000,
        }}>
          {/* Start button */}
          <div
            onClick={(e)=>{e.stopPropagation();setStartOpen(s=>!s);}}
            style={{
              display:'flex',alignItems:'center',gap:3,
              padding:'2px 8px',height:24,
              background:W.winBg,fontFamily:SANS,fontWeight:700,fontSize:11,color:W.black,
              cursor:'default',userSelect:'none',
              ...(startOpen?sunken:raised),
            }}>
            <span style={{fontSize:13}}>⊞</span> Start
          </div>

          {/* Separator */}
          <div style={{width:2,height:22,borderLeft:`1px solid ${W.dark}`,borderRight:`1px solid ${W.white}`,margin:'0 2px'}}/>

          {/* Open window buttons */}
          {openWindows.map(w=>(
            <div key={w.id} onClick={()=>bringToFront(w.id)}
              style={{
                display:'flex',alignItems:'center',gap:3,
                padding:'1px 6px',maxWidth:90,height:22,
                background:W.winBg,fontFamily:SANS,fontSize:10,color:W.black,
                cursor:'default',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                ...(activeWin===w.id?sunken:raised),
              }}>
              <span style={{fontSize:10}}>{w.icon}</span>
              {w.isShowcase?'Showcase':w.label}
            </div>
          ))}

          <div style={{flex:1}}/>

          {/* System tray */}
          <div style={{
            display:'flex',alignItems:'center',gap:4,height:22,
            padding:'0 8px',fontFamily:SANS,fontSize:10,color:W.black,
            ...sunken,
          }}>
            🔊 <Clock/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacOSDesktop;
