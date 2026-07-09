import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ProfileCard, type DiscoveredPerson } from '@/components/ProfileCard';
import { colors, spacing } from '@/components/theme';
import type { Gender } from '@/lib/types';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'mulher', label: 'Mulheres' },
  { key: 'homem', label: 'Homens' },
  { key: 'nao_binario', label: 'Nao-binarie' },
];

export default function Discover() {
  const [people, setPeople] = useState<DiscoveredPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [distanceKm, setDistanceKm] = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('discover_nearby', {
      max_distance_km: distanceKm,
      filter_genders: genders.length ? genders : null,
      min_age: 18,
      max_age: 99,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Nao deu para carregar', error.message);
      return;
    }
    setPeople((data ?? []) as DiscoveredPerson[]);
  }, [distanceKm, genders]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function connect(id: string) {
    setConnectingId(id);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from('connections').insert({
      requester_id: auth.user?.id,
      target_id: id,
    });
    setConnectingId(null);
    if (error) Alert.alert('Ops', error.message);
    else {
      Alert.alert('Enviado!', 'Se rolar reciprocidade, voces conversam.');
      setPeople((prev) => prev.filter((p) => p.id !== id));
    }
  }

  function toggleGender(g: Gender) {
    setGenders((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {GENDERS.map((g) => {
          const active = genders.includes(g.key);
          return (
            <Text
              key={g.key}
              onPress={() => toggleGender(g.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              {g.label}
            </Text>
          );
        })}
        <Text
          onPress={() => setDistanceKm((d) => (d >= 100 ? 10 : d + 30))}
          style={styles.chip}
        >
          ate {distanceKm} km
        </Text>
      </View>

      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <ProfileCard
            person={item}
            onConnect={connect}
            connecting={connectingId === item.id}
            onRemoved={(id) => setPeople((prev) => prev.filter((p) => p.id !== id))}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Ninguem por perto agora</Text>
              <Text style={styles.emptyText}>
                Ative o compartilhamento de localizacao no seu perfil e ajuste os filtros para
                encontrar gente na sua regiao.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  chip: {
    color: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
    fontSize: 14,
  },
  chipActive: { color: colors.accent, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  list: { padding: spacing.md, paddingTop: 0 },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
