import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radius, spacing } from './theme';

export type DiscoveredPerson = {
  id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  region: string | null;
  relationship_status: 'solteiro' | 'recem_separado' | null;
  distance_km: number | null;
};

const statusLabel: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  recem_separado: 'Recem-separado(a)',
};

export function ProfileCard({
  person,
  onConnect,
  connecting,
}: {
  person: DiscoveredPerson;
  onConnect: (id: string) => void;
  connecting: boolean;
}) {
  const meta = [
    person.age ? `${person.age} anos` : null,
    person.region,
    person.distance_km != null ? `${person.distance_km} km` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{person.display_name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{person.display_name}</Text>
      {!!meta && <Text style={styles.meta}>{meta}</Text>}
      {person.relationship_status && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{statusLabel[person.relationship_status]}</Text>
        </View>
      )}
      {!!person.bio && <Text style={styles.bio}>{person.bio}</Text>}
      <View style={styles.action}>
        <Button label="Quero conhecer" onPress={() => onConnect(person.id)} loading={connecting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.accent, fontSize: 26, fontWeight: '700' },
  name: { color: colors.text, fontSize: 20, fontWeight: '700' },
  meta: { color: colors.muted, marginTop: spacing.xs, fontSize: 14 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  badgeText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  bio: { color: colors.text, marginTop: spacing.md, fontSize: 15, lineHeight: 21 },
  action: { marginTop: spacing.md },
});
