import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/components/theme';

type Row = {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pendente' | 'aceita' | 'recusada';
  created_at: string;
  requester: { display_name: string } | null;
};

export default function Connections() {
  const [me, setMe] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setMe(uid);
    if (!uid) return;
    const { data, error } = await supabase
      .from('connections')
      .select('id, requester_id, target_id, status, created_at, requester:requester_id(display_name)')
      .eq('target_id', uid)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    setIncoming((data ?? []) as unknown as Row[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function respond(id: string, status: 'aceita' | 'recusada') {
    const { error } = await supabase.from('connections').update({ status }).eq('id', id);
    if (error) Alert.alert('Erro', error.message);
    else setIncoming((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={incoming}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.requester?.display_name ?? 'Alguem'}</Text>
            <Text style={styles.sub}>quer se conectar com voce</Text>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button label="Aceitar" onPress={() => respond(item.id, 'aceita')} />
              </View>
              <View style={styles.flex}>
                <Button label="Agora nao" variant="ghost" onPress={() => respond(item.id, 'recusada')} />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum pedido novo</Text>
            <Text style={styles.emptyText}>
              Quando alguem quiser te conhecer, o convite aparece aqui.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.muted, marginTop: 2, marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
