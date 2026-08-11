import { Pressable, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';

export function LogoutButton() {
  const { logout } = useAuth();
  return <Pressable onPress={() => void logout()} style={styles.button}><Text style={styles.text}>Déconnexion</Text></Pressable>;
}

const styles = StyleSheet.create({ button: { paddingHorizontal: 12, paddingVertical: 8 }, text: { color: colors.primary, fontWeight: '700' } });
