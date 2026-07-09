// Achego — envia notificacao push (Expo) para o outro lado de um match
// quando uma mensagem e enviada. Chamada pelo cliente apos inserir a mensagem.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Identifica o remetente pelo JWT recebido.
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const sender = userData.user;
    if (!sender) return json({ error: 'unauthorized' }, 401);

    const { connection_id, body } = await req.json();
    if (!connection_id || !body) return json({ error: 'bad request' }, 400);

    // Leituras privilegiadas com service role.
    const admin = createClient(url, service);
    const { data: conn } = await admin
      .from('connections')
      .select('requester_id, target_id, status')
      .eq('id', connection_id)
      .single();
    if (!conn || conn.status !== 'aceita') return json({ error: 'no match' }, 404);
    if (conn.requester_id !== sender.id && conn.target_id !== sender.id) {
      return json({ error: 'forbidden' }, 403);
    }

    const otherId = conn.requester_id === sender.id ? conn.target_id : conn.requester_id;

    const { data: senderProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', sender.id)
      .single();
    const { data: tokens } = await admin
      .from('push_tokens')
      .select('token')
      .eq('user_id', otherId);

    if (!tokens || tokens.length === 0) return json({ sent: 0 });

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      sound: 'default',
      title: senderProfile?.display_name ?? 'Nova mensagem',
      body: String(body).slice(0, 140),
      data: { connection_id },
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    const result = await res.json();
    return json({ sent: messages.length, result });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
