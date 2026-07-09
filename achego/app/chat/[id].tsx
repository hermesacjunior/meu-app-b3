import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/Avatar';
import { ReportSheet } from '@/components/ReportSheet';
import { blockUser, reportUser } from '@/lib/safety';
import { colors, radius, spacing } from '@/components/theme';
import type { Message, ReportReason } from '@/lib/types';

export default function ChatThread() {
  const { id, name, avatar, otherId } = useLocalSearchParams<{
    id: string;
    name?: string;
    avatar?: string;
    otherId?: string;
  }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]); // mais recente primeiro
  const [text, setText] = useState('');
  const [meId, setMeId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    setMeId(auth.user?.id ?? null);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', id)
      .order('created_at', { ascending: false });
    setMessages((data ?? []) as Message[]);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Tempo real: novas mensagens desta conversa chegam e entram na lista.
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `connection_id=eq.${id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function send() {
    const body = text.trim();
    if (!body || !meId) return;
    setSending(true);
    setText('');
    const { data, error } = await supabase
      .from('messages')
      .insert({ connection_id: id, sender_id: meId, body })
      .select()
      .single();
    setSending(false);
    if (error) {
      setText(body); // devolve o texto se falhou
      return;
    }
    // Insere localmente (o evento realtime tambem chega, mas deduplicamos por id).
    if (data) {
      const msg = data as Message;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]));
    }
    // Dispara a notificacao push para o outro lado (best-effort).
    supabase.functions
      .invoke('notify-message', { body: { connection_id: id, body } })
      .catch(() => {});
  }

  async function confirmBlock() {
    setMenuOpen(false);
    if (!otherId) return;
    Alert.alert('Bloquear', `Bloquear ${name ?? 'esta pessoa'}? Voces param de se ver no app.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Bloquear',
        style: 'destructive',
        onPress: async () => {
          await blockUser(otherId);
          router.back();
        },
      },
    ]);
  }

  async function submitReport(reason: ReportReason) {
    if (!otherId) return;
    await reportUser(otherId, reason);
    setReportOpen(false);
    Alert.alert('Obrigado', 'Recebemos sua denuncia e vamos analisar.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Avatar name={name ?? '?'} url={avatar || null} size={36} />
        <Text style={styles.headerName}>{name ?? 'Conversa'}</Text>
        <View style={styles.flex} />
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={12}>
          <Text style={styles.menuDots}>⋯</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <FlatList
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            const mine = item.sender_id === meId;
            return (
              <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Voces deram match! Manda o primeiro oi 👋</Text>
            </View>
          }
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Mensagem"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            onSubmitEditing={send}
          />
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sendText}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

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
        personName={name ?? 'esta pessoa'}
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.accent, fontSize: 34, fontWeight: '400', marginRight: spacing.xs, marginTop: -4 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  headerName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  messages: { padding: spacing.md, gap: spacing.sm },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  bubbleMine: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: colors.bg, fontWeight: '500' },
  empty: { paddingVertical: spacing.xl, alignItems: 'center', transform: [{ scaleY: -1 }] },
  emptyText: { color: colors.muted, textAlign: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  sendText: { color: colors.bg, fontSize: 18, fontWeight: '700' },
  menuDots: { color: colors.muted, fontSize: 24, fontWeight: '700', paddingHorizontal: spacing.sm },
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
