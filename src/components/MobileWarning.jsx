import { useState } from 'react';

const VT     = { fontFamily: "'VT323', monospace" };
const AMBER  = '#c8a96e';
const DIM    = '#6b4f28';
const BRIGHT = '#e8c98e';

const MobileWarning = ({ onContinue }) => {
  const [dismissed, setDismissed] = useState(false);

  const handle = () => {
    setDismissed(true);
    setTimeout(onContinue, 300);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      opacity: dismissed ? 0 : 1,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{ width: '100%', maxWidth: 420, ...VT }}>

        {/* Warning box */}
        <div style={{ border: `1px solid ${DIM}`, padding: '22px 24px' }}>

          {/* Header */}
          <div style={{ borderBottom: `1px solid ${DIM}`, paddingBottom: 12, marginBottom: 18 }}>
            <div style={{ color: BRIGHT, fontSize: 20, letterSpacing: 1 }}>
              VISHAKHA PATHAK  —  System Notice
            </div>
            <div style={{ color: DIM, fontSize: 15, marginTop: 3 }}>
              Display Compatibility Warning
            </div>
          </div>

          <div style={{ color: AMBER, fontSize: 19, lineHeight: 1.6, marginBottom: 16 }}>
            This experience is designed for desktop or laptop computers.
          </div>

          <div style={{ color: DIM, fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
            On a small screen the 3D scene may be slow or cramped.
            A keyboard is also recommended for the best interaction.
          </div>

          <div style={{
            borderTop: `1px solid ${DIM}`, paddingTop: 14, marginBottom: 20,
            color: DIM, fontSize: 15,
          }}>
            For the full experience, visit on a desktop browser.
          </div>

          <button
            onClick={handle}
            style={{
              ...VT, fontSize: 18, letterSpacing: 2, width: '100%',
              background: 'transparent',
              border: `1px solid ${AMBER}`, color: AMBER,
              padding: '9px 0', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = AMBER; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = AMBER; }}
          >
            CONTINUE ANYWAY
          </button>

        </div>

        <div style={{ color: DIM, fontSize: 14, textAlign: 'center', marginTop: 14, letterSpacing: 1 }}>
          © 2025 Vishakha Pathak  |  System BIOS v1.0
        </div>

      </div>
    </div>
  );
};

// Returns true if the device is likely a phone/tablet
export const isMobileDevice = () =>
  window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

export default MobileWarning;
