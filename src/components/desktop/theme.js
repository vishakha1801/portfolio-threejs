// ── Win95 design tokens ───────────────────────────────────────────────────────
export const W = {
  desktop:     '#008080',
  winBg:       '#c0c0c0',
  titleActive: '#000080',
  titleText:   '#ffffff',
  white:       '#ffffff',
  black:       '#000000',
  dark:        '#808080',
  darker:      '#404040',
  content:     '#ffffff',
  taskbar:     '#c0c0c0',
};

// Tahoma is the authentic Win98/XP UI font, available on all modern Mac + Windows systems.
// MS Sans Serif (bitmap) is listed as a fallback for Windows purists.
export const SANS = 'Tahoma,"MS Sans Serif","Microsoft Sans Serif",Arial,sans-serif';

export const raised = {
  borderTop:    `2px solid ${W.white}`,
  borderLeft:   `2px solid ${W.white}`,
  borderBottom: `2px solid ${W.dark}`,
  borderRight:  `2px solid ${W.dark}`,
};

export const sunken = {
  borderTop:    `2px solid ${W.dark}`,
  borderLeft:   `2px solid ${W.dark}`,
  borderBottom: `2px solid ${W.white}`,
  borderRight:  `2px solid ${W.white}`,
};

export const deepRaised = {
  outline:      `1px solid ${W.black}`,
  borderTop:    `2px solid ${W.white}`,
  borderLeft:   `2px solid ${W.white}`,
  borderBottom: `2px solid ${W.darker}`,
  borderRight:  `2px solid ${W.darker}`,
};
