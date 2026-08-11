import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors } from '../constants/theme';

export function Screen({ style, ...props }: ViewProps) {
  return <View style={[styles.screen, style]} {...props} />;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background, padding: 16 } });
