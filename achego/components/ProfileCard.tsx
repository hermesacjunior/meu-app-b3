import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { ReportSheet } from './ReportSheet';
import { blockUser, reportUser } from '@/lib/safety';
import type { ReportReason } from '@/lib/types';
import { colors, radius, spacing } from './theme';

export type DiscoveredPerson = {
  id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  region: string | null;
  relationship_status: 'solteiro' | 'recem_separado' | null;
  avatar_url: string | null;
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
  onRemoved,
}: {
  person: DiscoveredPerson;
  onConnect: (id: string) => void;
  connecting: boolean;
  onRemoved?: (id: string) => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const meta = [
    person.age ? `${person.age} anos` : null,
    person.region,
    person.distance_km != null ? `${person.distance_km} km` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  function confirmBlock() {
    setMenuOpen(false);
    Alert.alert('Bloquear', `Bloquear ${person.display_name}? Voces param de se ver no app.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Bloquear',
        style: 'destructive',
        onPress: async () => {
          await blockUser(person.id);
          onRemoved?.(person.id);
        },
      },
    ]);
  }

  async function submitReport(reason: ReportReason) {
    await reportUser(person.id, reason);
    setReportOpen(false);
    onRemoved?.(person.id);
    Alert.alert('Obrigado', 'Recebemos sua denuncia e vamos analisar.');
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}
    >
      <View style={styles.top}>
        <Avatar name={person.display_name} url={person.avatar_url} size={64} />
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} style={styles.menuBtn}>
          <Text style={styles.menuDots}>⋯</Text>
        </Pressable>
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

      {/* Menu de seguranca */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
            >
              <Text style={styles.menuText}>Denunciar</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={confirmBlock}>
              <Text style={[styles.menuText, styles.danger]}>Bloquear</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ReportSheet
        visible={reportOpen}
        personName={person.display_name}
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
      />
    </Animated.View>
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
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  menuBtn: { paddingHorizontal: spacing.sm },
  menuDots: { color: colors.muted, fontSize: 24, fontWeight: '700', marginTop: -6 },
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
  backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: spacing.xl },
  menu: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: { padding: spacing.md, alignItems: 'center' },
  menuText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  danger: { color: colors.accent },
  menuDivider: { height: 1, backgroundColor: colors.border },
});
