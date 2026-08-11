import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { authApi } from '@/src/api/auth.api';
import { AppButton } from '@/src/components/AppButton';
import { ErrorState } from '@/src/components/ErrorState';
import { LoadingState } from '@/src/components/LoadingState';
import { Screen } from '@/src/components/Screen';
import { colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import type { AuthOptions } from '@/src/types/auth';
import { errorMessage } from '@/src/utils/errorMessage';

export default function LoginScreen() {
  const { user, login } = useAuth();
  const [options, setOptions] = useState<AuthOptions>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [chooseBoutique, setChooseBoutique] = useState(false);
  const [noBoutique, setNoBoutique] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try { setOptions(await authApi.options()); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const connect = async (userId: string) => {
    setSubmitting(true); setError(undefined);
    try { await login(userId); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setSubmitting(false); }
  };

  const boutiqueLogin = async () => {
    const latest = await authApi.options().catch((reason: unknown) => { setError(errorMessage(reason)); return null; });
    if (!latest) return;
    setOptions(latest);
    if (latest.boutiques.length === 0) { setNoBoutique(true); return; }
    setNoBoutique(false);
    if (latest.boutiques.length === 1) { await connect(latest.boutiques[0].userId); return; }
    setChooseBoutique(true);
  };

  if (user) return <Redirect href="/" />;
  if (loading) return <LoadingState />;
  if (error && !options) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{chooseBoutique ? 'Choisir une boutique' : 'Connexion'}</Text>
        {chooseBoutique ? (
          <>
            {options?.boutiques.map((boutique) => <AppButton key={boutique.userId} title={boutique.shopName} disabled={submitting} onPress={() => void connect(boutique.userId)} />)}
            <AppButton title="Retour" variant="secondary" disabled={submitting} onPress={() => setChooseBoutique(false)} />
          </>
        ) : (
          <>
            <AppButton title="Administrateur" loading={submitting} onPress={() => options && void connect(options.admin.userId)} />
            <AppButton title="Boutique" variant="secondary" disabled={submitting} onPress={() => void boutiqueLogin()} />
            {noBoutique ? <Text style={styles.empty}>Aucune boutique disponible.</Text> : null}
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 22, gap: 14 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: 6 },
  empty: { color: colors.muted, textAlign: 'center', fontSize: 15 },
  error: { color: colors.danger, textAlign: 'center' },
});
