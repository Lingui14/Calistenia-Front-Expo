import { StyleSheet } from 'react-native';

export const rutinaStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 4,
  },
  routineCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#0a0a0a',
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  routineDescription: {
    fontSize: 13,
    color: '#a3a3a3',
    marginTop: 4,
  },
});