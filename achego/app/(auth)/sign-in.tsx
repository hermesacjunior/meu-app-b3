import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/components/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');

  // Entrada animada: logo surge com fade + escala, formulario desliza de baixo.
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        <Animated.View
          style={[
            styles.header,
            {
              opacity: logoAnim,
              transform: [
                { scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.mark}>
            <Text style={styles.markText}>a</Text>
          </View>
          <Text style={styles.logo}>Achego</Text>
          <Text style={styles.tagline}>Gente de verdade, pertinho de voce.</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.form,
            {
              opacity: formAnim,
              transform: [
                { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            },
          ]}
        >
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
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  markText: { color: colors.bg, fontSize: 44, fontWeight: '900', marginTop: -4 },
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
