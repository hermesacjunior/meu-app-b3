import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/Avatar';
import { colors, radius, spacing } from '@/components/theme';
import type { Match } from '@/lib/types';

function timeLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Conversas() {
  const [matches, setMatches] = useState<Match[]>([]);
  const router = useRouter();

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('my_matches');
    if (error) {
      Alert.alert('Nao deu para carregar', error.message);
      return;
    }
    setMatches((data ?? []) as Match[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(m) => m.connection_id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: {
                  id: item.connection_id,
                  name: item.other_name,
                  avatar: item.other_avatar ?? '',
                  otherId: item.other_id,
                },
              })
            }
          >
            <Avatar name={item.other_name} url={item.other_avatar} size={52} />
            <View style={styles.rowText}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{item.other_name}</Text>
                <Text style={styles.time}>{timeLabel(item.last_at)}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_body ?? 'Voces deram match! Diga um oi 👋'}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptyText}>
              Quando alguem aceitar sua conexao (ou voce aceitar), a conversa aparece aqui.
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  pressed: { opacity: 0.7 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontSize: 22, fontWeight: '700' },
  rowText: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  time: { color: colors.muted, fontSize: 12 },
  preview: { color: colors.muted, fontSize: 14, marginTop: 2 },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
