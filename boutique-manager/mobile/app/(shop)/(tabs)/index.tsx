import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { colors } from '@/src/constants/theme';

export default function ShopHomeScreen() {
  return <Screen><Text style={styles.title}>Accueil</Text></Screen>;
}

const styles = StyleSheet.create({ title: { color: colors.text, fontSize: 28, fontWeight: '900' } });
