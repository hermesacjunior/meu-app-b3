import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Exibe a notificacao mesmo com o app aberto.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Registra o token de push do dispositivo na tabela push_tokens.
// No-op em web/simulador ou enquanto nao houver projectId do EAS configurado.
export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Mensagens',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  try {
    const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
    const projectId = extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase
      .from('push_tokens')
      .upsert({ user_id: auth.user.id, token: tokenData.data, platform: Platform.OS });
  } catch (e) {
    // Sem projectId do EAS o Expo nao emite token; segue sem push ate configurar.
    console.warn('[push] token indisponivel:', (e as Error).message);
  }
}
