import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  authScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topSpacer: {
    height: 60,
  },
  brandingSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#737373',
    marginTop: 4,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  authCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  passwordMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: -8,
  },
  passwordMatchText: {
    fontSize: 12,
    marginLeft: 6,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#262626',
  },
  dividerText: {
    color: '#525252',
    paddingHorizontal: 16,
    fontSize: 13,
  },
  secondaryButtonFull: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#404040',
  },
  secondaryButtonFullText: {
    color: '#a3a3a3',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSection: {
    paddingVertical: 24,
  },
  footerText: {
    color: '#525252',
    fontSize: 13,
    textAlign: 'center',
  },
});