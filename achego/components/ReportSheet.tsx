import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radius, spacing } from './theme';
import { REPORT_REASONS, type ReportReason } from '@/lib/types';

type Props = {
  visible: boolean;
  personName: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => Promise<void> | void;
};

export function ReportSheet({ visible, personName, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!reason) return;
    setSending(true);
    await onSubmit(reason);
    setSending(false);
    setReason(null);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Denunciar {personName}</Text>
          <Text style={styles.subtitle}>
            Sua denuncia e sigilosa. A pessoa nao e avisada.
          </Text>
          <View style={styles.reasons}>
            {REPORT_REASONS.map((r) => (
              <Text
                key={r}
                onPress={() => setReason(r)}
                style={[styles.chip, reason === r && styles.chipActive]}
              >
                {r}
              </Text>
            ))}
          </View>
          <Button label="Enviar denuncia" onPress={submit} loading={sending} disabled={!reason} />
          <Button label="Cancelar" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: spacing.sm },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
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
});
