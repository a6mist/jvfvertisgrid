// JVF Design System Tokens

export const colors = {
  bg: '#0A0E14',
  bgAlt: '#0D131B',
  surface: '#121922',
  surface2: '#161F2B',
  border: '#212B38',
  borderSoft: '#1A222D',
  text: '#EDF2F7',
  textDim: '#93A1B0',
  textFaint: '#5C6A79',
  teal: '#2FD3E8',
  blue: '#1C7EA6',
  navy: '#0B2545',
  green: '#2ED573',
  red: '#FF5C7A',
};

export const gradients = {
  primary: 'linear-gradient(135deg, #1C7EA6, #2FD3E8)',
  primary2: 'linear-gradient(160deg, #0D2438, #0A1420)',
};

export const fonts = {
  display: 'Space Grotesk, sans-serif',
  body: 'Inter, sans-serif',
  mono: 'JetBrains Mono, monospace',
};

export const spacing = {
  xs: '6px',
  sm: '12px',
  md: '20px',
  lg: '32px',
  xl: '56px',
  xxl: '96px',
};

export const borderRadius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '22px',
};

export const keyframes = {
  pulse: `
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.55); }
      70% { box-shadow: 0 0 0 7px rgba(46, 213, 115, 0); }
      100% { box-shadow: 0 0 0 0 rgba(46, 213, 115, 0); }
    }
  `,
  scrollTicker: `
    @keyframes scrollTicker {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
  `,
};

// CSS Custom Properties to inject into tailwind config
export const cssVariables = {
  '--bg': colors.bg,
  '--bg-alt': colors.bgAlt,
  '--surface': colors.surface,
  '--surface-2': colors.surface2,
  '--border': colors.border,
  '--border-soft': colors.borderSoft,
  '--text': colors.text,
  '--text-dim': colors.textDim,
  '--text-faint': colors.textFaint,
  '--teal': colors.teal,
  '--blue': colors.blue,
  '--navy': colors.navy,
  '--green': colors.green,
  '--red': colors.red,
  '--grad': gradients.primary,
};
