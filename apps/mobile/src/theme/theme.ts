import { Appearance } from 'react-native';

const palette = {
  // Primary
  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo200: '#C7D2FE',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',

  // Accent / Wellness
  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',

  // Warm accent
  amber400: '#FBBF24',
  amber500: '#F59E0B',

  // Error / Danger
  rose400: '#FB7185',
  rose500: '#F43F5E',
  rose600: '#E11D48',

  // Neutrals
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',
};

export const lightTheme = {
  colors: {
    primary: palette.indigo500,
    primaryLight: palette.indigo100,
    primaryDark: palette.indigo700,

    accent: palette.emerald500,
    accentLight: palette.emerald100,

    warning: palette.amber500,
    error: palette.rose500,
    errorLight: palette.rose400,

    background: palette.white,
    surface: palette.gray50,
    surfaceElevated: palette.white,
    border: palette.gray200,

    textPrimary: palette.gray900,
    textSecondary: palette.gray500,
    textTertiary: palette.gray400,
    textInverse: palette.white,

    tabBar: palette.white,
    tabBarBorder: palette.gray200,
    tabActive: palette.indigo500,
    tabInactive: palette.gray400,

    cardBackground: palette.white,
    inputBackground: palette.gray50,
    inputBorder: palette.gray300,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
    h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
    h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
    bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  },
  shadows: {
    sm: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export const darkTheme: typeof lightTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: palette.indigo400,
    primaryLight: palette.indigo700,
    primaryDark: palette.indigo200,

    accent: palette.emerald400,
    accentLight: palette.emerald600,

    warning: palette.amber400,
    error: palette.rose400,
    errorLight: palette.rose600,

    background: palette.gray900,
    surface: palette.gray800,
    surfaceElevated: palette.gray700,
    border: palette.gray700,

    textPrimary: palette.gray50,
    textSecondary: palette.gray400,
    textTertiary: palette.gray500,
    textInverse: palette.gray900,

    tabBar: palette.gray900,
    tabBarBorder: palette.gray700,
    tabActive: palette.indigo400,
    tabInactive: palette.gray500,

    cardBackground: palette.gray800,
    inputBackground: palette.gray800,
    inputBorder: palette.gray600,
  },
};

export type Theme = typeof lightTheme;

export function getTheme(mode?: 'light' | 'dark' | 'system'): Theme {
  if (mode === 'light') return lightTheme;
  if (mode === 'dark') return darkTheme;
  return Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme;
}
