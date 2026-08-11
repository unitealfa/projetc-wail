import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export function EmptyState({ message }: { message: string }) {
  return <View style={styles.container}><Text style={styles.text}>{message}</Text></View>;
}

const styles = StyleSheet.create({ container: { padding: 30, alignItems: 'center' }, text: { color: colors.muted, fontSize: 16, textAlign: 'center' } });
