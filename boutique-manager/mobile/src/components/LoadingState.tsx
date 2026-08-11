import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';

export function LoadingState() {
  return <View style={styles.container}><ActivityIndicator size="large" color={colors.primary} /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } });
