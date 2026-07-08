// ── Shared CRT artifact overlay ───────────────────────────────────────────────
// Scanlines, rolling scan band, corner vignette and top-edge glint, shared by
// the Win98 desktop and the BIOS loader. Defaults match the desktop; the
// loader passes stronger values since it sits on pure black.

const CrtOverlay = ({ scanlineOpacity = 0.04, scanlineSpacing = 2, vignette = 0.16, vignetteStart = 75 }) => (
  <>
    <style>{`
      @keyframes crt-scan-roll {
        0%   { transform: translateY(-8%); }
        100% { transform: translateY(108%); }
      }
    `}</style>

    {/* Scanlines */}
    <div aria-hidden style={{
      position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none',
      backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${scanlineOpacity}) 0px, rgba(0,0,0,${scanlineOpacity}) 1px, transparent 1px, transparent ${scanlineSpacing}px)`,
    }} />

    {/* Rolling scan band */}
    <div aria-hidden style={{
      position: 'absolute', left: 0, right: 0, height: '8%',
      background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.018) 50%, transparent 100%)',
      animation: 'crt-scan-roll 4s linear infinite',
      pointerEvents: 'none', zIndex: 9998,
    }} />

    {/* Corner vignette */}
    <div aria-hidden style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9997,
      background: `radial-gradient(ellipse at 50% 50%, transparent ${vignetteStart}%, rgba(0,0,0,${vignette}) 100%)`,
    }} />

    {/* Top-edge glint */}
    <div aria-hidden style={{
      position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent)',
      pointerEvents: 'none', zIndex: 9997,
    }} />
  </>
);

export default CrtOverlay;
