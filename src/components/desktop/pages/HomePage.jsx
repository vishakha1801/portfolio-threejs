import { Btn95, H1 } from '../Win95Window.jsx';
import { W, SANS } from '../theme.js';

const NAV_PAGES = [
  { id: 'about',      label: 'About',      icon: '👤' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'projects',   label: 'Projects',   icon: '📁' },
  { id: 'contact',    label: 'Contact',    icon: '✉️'  },
];

const HomePage = ({ onNavigate }) => (
  <div style={{
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', padding: '32px 40px', textAlign: 'center',
    background: W.content,
  }}>
    <H1 style={{ fontSize: 26, marginBottom: 6 }}>Vishakha Pathak</H1>
    <p style={{ fontFamily: SANS, fontSize: 13, color: '#555', margin: '0 0 36px 0' }}>
      Software Engineer
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 180 }}>
      {NAV_PAGES.map(p => (
        <Btn95
          key={p.id}
          onClick={() => onNavigate(p.id)}
          style={{ width: '100%', padding: '5px 12px', textAlign: 'left', fontSize: 11 }}
        >
          {p.icon}{'  '}{p.label}
        </Btn95>
      ))}
    </div>
  </div>
);

export default HomePage;
