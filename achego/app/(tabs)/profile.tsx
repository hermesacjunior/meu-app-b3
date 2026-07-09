import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { colors, radius, spacing } from '@/components/theme';
import type { Gender, Profile, RelationshipStatus } from '@/lib/types';

const CONSENT_VERSION = '2026-07-v1';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'mulher', label: 'Mulher' },
  { key: 'homem', label: 'Homem' },
  { key: 'nao_binario', label: 'Nao-binarie' },
  { key: 'outro', label: 'Outro' },
];

const STATUS: { key: RelationshipStatus; label: string }[] = [
  { key: 'solteiro', label: 'Solteiro(a)' },
  { key: 'recem_separado', label: 'Recem-separado(a)' },
];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
    if (data) setProfile(data as Profile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function toggleLocation(enabled: boolean) {
    if (!enabled) {
      set('location_sharing_enabled', false);
      set('latitude', null);
      set('longitude', null);
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao negada', 'Sem localizacao, a descoberta por proximidade fica off.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    set('location_sharing_enabled', true);
    set('latitude', pos.coords.latitude);
    set('longitude', pos.coords.longitude);
  }

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissao negada', 'Preciso de acesso as fotos para trocar sua imagem.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setUploading(true);
    const path = `${auth.user.id}/avatar_${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, decode(result.assets[0].base64), { contentType: 'image/jpeg', upsert: true });
    if (upErr) {
      setUploading(false);
      Alert.alert('Erro no upload', upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('id', auth.user.id);
    set('avatar_url', pub.publicUrl);
    setUploading(false);
  }

  async function save() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    if (!profile.relationship_status || !profile.gender) {
      Alert.alert('Faltou pouco', 'Informe seu genero e sua situacao para aparecer na descoberta.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url ?? null,
        gender: profile.gender,
        orientation: profile.orientation,
        relationship_status: profile.relationship_status,
        region: profile.region,
        location_sharing_enabled: profile.location_sharing_enabled ?? false,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        is_discoverable: profile.is_discoverable ?? false,
        consent_version: CONSENT_VERSION,
        consent_at: new Date().toISOString(),
      })
      .eq('id', auth.user.id);
    setSaving(false);
    if (error) Alert.alert('Erro ao salvar', error.message);
    else Alert.alert('Pronto', 'Perfil atualizado.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        <Pressable onPress={pickAvatar} disabled={uploading}>
          <Avatar name={profile.display_name ?? '?'} url={profile.avatar_url} size={104} />
          <View style={styles.avatarBadge}>
            {uploading ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <Text style={styles.avatarBadgeText}>✎</Text>
            )}
          </View>
        </Pressable>
        <Text style={styles.avatarHint}>Toque para trocar sua foto</Text>
      </View>

      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        value={profile.display_name ?? ''}
        onChangeText={(v) => set('display_name', v)}
        placeholder="Como querem te chamar"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Sobre voce</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={profile.bio ?? ''}
        onChangeText={(v) => set('bio', v)}
        placeholder="Uma linha honesta sobre voce"
        placeholderTextColor={colors.muted}
        multiline
      />

      <Text style={styles.label}>Genero</Text>
      <View style={styles.row}>
        {GENDERS.map((g) => (
          <Text
            key={g.key}
            onPress={() => set('gender', g.key)}
            style={[styles.chip, profile.gender === g.key && styles.chipActive]}
          >
            {g.label}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>Sua situacao</Text>
      <View style={styles.row}>
        {STATUS.map((s) => (
          <Text
            key={s.key}
            onPress={() => set('relationship_status', s.key)}
            style={[styles.chip, profile.relationship_status === s.key && styles.chipActive]}
          >
            {s.label}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>Regiao</Text>
      <TextInput
        style={styles.input}
        value={profile.region ?? ''}
        onChangeText={(v) => set('region', v)}
        placeholder="Cidade / bairro"
        placeholderTextColor={colors.muted}
      />

      <View style={styles.toggle}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>Aparecer na descoberta</Text>
          <Text style={styles.toggleSub}>Desligue para fazer uma pausa sem apagar sua conta.</Text>
        </View>
        <Switch
          value={profile.is_discoverable ?? false}
          onValueChange={(v) => set('is_discoverable', v)}
          trackColor={{ true: colors.accent }}
        />
      </View>

      <View style={styles.toggle}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>Descoberta por proximidade</Text>
          <Text style={styles.toggleSub}>
            Usa sua localizacao atual so para calcular distancia. So voce decide.
          </Text>
        </View>
        <Switch
          value={profile.location_sharing_enabled ?? false}
          onValueChange={toggleLocation}
          trackColor={{ true: colors.accent }}
        />
      </View>

      <View style={styles.actions}>
        <Button label="Salvar perfil" onPress={save} loading={saving} />
        <Button label="Sair" variant="ghost" onPress={() => supabase.auth.signOut()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  avatarWrap: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  avatarBadgeText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  avatarHint: { color: colors.muted, fontSize: 13, marginTop: spacing.sm },
  label: { color: colors.muted, marginTop: spacing.md, fontSize: 13, fontWeight: '600' },
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
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  toggleText: { flex: 1 },
  toggleTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  toggleSub: { color: colors.muted, fontSize: 13, marginTop: 2, lineHeight: 18 },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
});
