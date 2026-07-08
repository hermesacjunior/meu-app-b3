import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/components/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');

  async function submit() {
    if (!email || !password) {
      Alert.alert('Preencha email e senha');
      return;
    }
    setLoading(true);
    const fn =
      mode === 'entrar'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setLoading(false);
    if (error) Alert.alert('Ops', error.message);
    else if (mode === 'criar') {
      Alert.alert('Quase la', 'Confirme seu email para ativar a conta.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Achego</Text>
          <Text style={styles.tagline}>Gente de verdade, pertinho de voce.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button
            label={mode === 'entrar' ? 'Entrar' : 'Criar conta'}
            onPress={submit}
            loading={loading}
          />
          <Button
            label={mode === 'entrar' ? 'Nao tenho conta' : 'Ja tenho conta'}
            variant="ghost"
            onPress={() => setMode(mode === 'entrar' ? 'criar' : 'entrar')}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 40, fontWeight: '800', color: colors.accent, letterSpacing: -1 },
  tagline: { color: colors.muted, marginTop: spacing.sm, fontSize: 15 },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
});
