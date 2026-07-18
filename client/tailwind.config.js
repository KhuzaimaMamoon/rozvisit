/** @type {import('tailwindcss').Config} */
import { colors, radii, shadows } from './src/design-system/tokens.js';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        'primary-soft': colors.primarySoft,
        accent: colors.accent,
        background: colors.background,
        surface: colors.surface,
        text: colors.text,
        muted: colors.muted,
        border: colors.border,
        success: colors.success,
        pending: colors.pending,
        emergency: colors.emergency,
        'primary-hover': colors.primaryHover,
        'surface-sunken': colors.surfaceSunken,
        'success-soft': colors.successSoft,
        'pending-soft': colors.pendingSoft,
        'emergency-soft': colors.emergencySoft,
        'emergency-hover': colors.emergencyHover,
      },
      borderRadius: radii,
      boxShadow: shadows,
    },
  },
  plugins: [],
};
