import { useState } from 'react';
import Win95Window, { Btn95 } from './Win95Window.jsx';
import { W, SANS, sunken } from './theme.js';

import HomePage       from './pages/HomePage.jsx';
import AboutPage      from './pages/AboutPage.jsx';
import ExperiencePage from './pages/ExperiencePage.jsx';
import ProjectsPage   from './pages/ProjectsPage.jsx';
import ContactPage    from './pages/ContactPage.jsx';

// ── Page registry ─────────────────────────────────────────────────────────────
const PAGES = [
  { id: 'home',       label: 'Home',       icon: '🏠', Component: HomePage },
  { id: 'about',      label: 'About',      icon: '👤', Component: AboutPage },
  { id: 'experience', label: 'Experience', icon: '💼', Component: ExperiencePage },
  { id: 'projects',   label: 'Projects',   icon: '📁', Component: ProjectsPage },
  { id: 'contact',    label: 'Contact',    icon: '✉️',  Component: ContactPage },
];

export const WINDOW_W = 600;
export const WINDOW_H = 480;

// ── Sidebar nav item ──────────────────────────────────────────────────────────
const NavItem = ({ page, active, onClick }) => {
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

// ── ShowcaseExplorer ──────────────────────────────────────────────────────────
const ShowcaseExplorer = ({ onClose, onMinimize, onFocus, zIndex, initialX, initialY, desktopW, desktopH }) => {
  const [pageId, setPageId] = useState('home');
  const { Component } = PAGES.find(p => p.id === pageId);
  const isHome = pageId === 'home';

  return (
    <Win95Window
      title="Vishakha Pathak"
      icon="🖥"
      onClose={onClose} onMinimize={onMinimize} onFocus={onFocus}
      zIndex={zIndex} initialX={initialX} initialY={initialY}
      desktopW={desktopW} desktopH={desktopH}
      winWidth={WINDOW_W} winHeight={WINDOW_H}
    >
      {/* Menu bar + address bar — hidden on home page */}
      {!isHome && (
        <>
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

          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            background: W.winBg, padding: '2px 4px',
            borderBottom: `1px solid ${W.dark}`,
          }}>
            <span style={{ fontFamily: SANS, fontSize: 10, color: W.black, flexShrink: 0 }}>Address</span>
            <div style={{ flex: 1, background: W.content, padding: '1px 5px', fontFamily: SANS, fontSize: 10, color: W.black, ...sunken }}>
              C:\Desktop\Portfolio\{pageId}
            </div>
            <Btn95 style={{ padding: '1px 8px', fontSize: 10 }}>Go</Btn95>
          </div>
        </>
      )}

      {/* Sidebar + content — sidebar hidden on home page */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!isHome && (
          <nav style={{
            width: 110, background: W.winBg,
            borderRight: `2px solid ${W.dark}`,
            flexShrink: 0, display: 'flex', flexDirection: 'column',
          }}>
            {PAGES.map(p => (
              <NavItem key={p.id} page={p} active={pageId === p.id} onClick={() => setPageId(p.id)} />
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ padding: '6px 4px', fontFamily: SANS, fontSize: 8, color: W.dark, textAlign: 'center' }}>
              © 2025 Vishakha Pathak
            </div>
          </nav>
        )}

        <div style={{ flex: 1, overflowY: 'auto', background: W.content, ...sunken }}>
          {isHome
            ? <HomePage onNavigate={setPageId} />
            : <Component />
          }
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexShrink: 0,
        background: W.winBg, padding: '1px 4px',
        borderTop: `1px solid ${W.dark}`, gap: 8,
      }}>
        <div style={{ ...sunken, padding: '0 6px', fontFamily: SANS, fontSize: 10, color: W.black, flex: 1 }}>
          {PAGES.find(p => p.id === pageId)?.label}
        </div>
        <div style={{ ...sunken, padding: '0 6px', fontFamily: SANS, fontSize: 10, color: W.black }}>
          Vishakha Pathak
        </div>
      </div>
    </Win95Window>
  );
};

export default ShowcaseExplorer;
