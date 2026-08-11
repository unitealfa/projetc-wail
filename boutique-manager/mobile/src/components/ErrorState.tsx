import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { AppButton } from './AppButton';

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.container}><Text style={styles.text}>{message}</Text><AppButton title="Réessayer" onPress={onRetry} /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, gap: 16, padding: 24, alignItems: 'center', justifyContent: 'center' }, text: { color: colors.danger, fontSize: 16, textAlign: 'center' } });
