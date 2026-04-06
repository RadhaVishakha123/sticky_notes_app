export const AUTH_COLORS = {
  sky: '#38BDF8',
  skyDark: '#0369A1',
  skyMid: '#0EA5E9',
  skyLight: '#BAE6FD',
  wave1: '#0369A1',
  wave2: '#0EA5E9',
  wave3: '#38BDF8',
  inputBorder: '#E2E8F0',
  inputBg: '#F8FAFC',
  inputIcon: '#94A3B8',
  cardBg: '#FFFFFF',
} as const;

export const COLORS = {
  // Brand
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryDark: '#0369A1',

  // UI
  background: '#F5F5F5',
  surface: '#FFFFFF',
  border: '#E0E0E0',

  // Text
  text: '#1A1A1A',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',

  // Status
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // Note colors (sticky note palette)
  noteYellow: '#FFFF88',
  noteRed: '#FF9999',
  noteGreen: '#99FF99',
  noteBlue: '#99CCFF',
  noteOrange: '#FFB347',
  notePurple: '#DDA0DD',
  noteWhite: '#FFFFFF',
  noteBlack: '#000000',
} as const;

export type ColorKey = keyof typeof COLORS;

// Sticky note color options available in the UI
export const NOTE_COLOR_OPTIONS: string[] = [
  COLORS.noteYellow,
  COLORS.noteRed,
  COLORS.noteGreen,
  COLORS.noteBlue,
  COLORS.noteOrange,
  COLORS.notePurple,
  COLORS.noteWhite,
  COLORS.noteBlack,
];
