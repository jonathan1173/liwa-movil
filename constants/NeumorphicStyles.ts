import { StyleSheet } from 'react-native';

// ─── Color tokens ─────────────────────────────────────────────────────────────
export const Colors = {
  background: '#E0E5EC',
  shadowLight: '#FFFFFF',
  shadowDark: '#A3B1C6',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textPlaceholder: '#9CA3AF',
  accent: '#1A1A2E',
  accentLight: '#374151',
  error: '#4B5563',
  white: '#FFFFFF',
  inputBg: '#E0E5EC',
  borderLight: 'rgba(255,255,255,0.8)',
} as const;

// ─── Shadow presets ───────────────────────────────────────────────────────────
export const Shadows = {
  /** Elevated surface — pops out */
  raised: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  /** Inset surface — pressed in */
  inset: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 0,
  },
  /** Soft / subtle lift */
  soft: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// ─── Reusable style sheets ────────────────────────────────────────────────────
export const neumorphicStyles = StyleSheet.create({
  /** Full-screen background */
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /** Raised card / panel */
  card: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 24,
    // raised shadows use elevation on Android; on iOS we use the shadow* props
    ...Shadows.raised,
  },

  /** Inset input field */
  inputContainer: {
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    // inner shadow simulation via border
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    // concave shadows
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 0,
  },

  /** Primary action button */
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.raised,
  },

  /** Secondary / ghost button */
  buttonOutline: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    ...Shadows.soft,
  },

  /** Button text */
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  buttonOutlineText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /** Input text */
  inputText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    marginLeft: 10,
  },

  /** Label above input */
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },

  /** Section title */
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    marginTop: 6,
    lineHeight: 20,
  },

  /** Error text */
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },

  /** Divider line */
  divider: {
    height: 1,
    backgroundColor: Colors.shadowDark,
    opacity: 0.3,
    marginVertical: 20,
  },

  /** Logo circle */
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...Shadows.raised,
  },
});
