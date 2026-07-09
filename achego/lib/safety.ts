import { supabase } from './supabase';
import type { ReportReason } from './types';

export async function blockUser(blockedId: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: new Error('sem sessao') };
  return supabase.from('blocks').insert({ blocker_id: auth.user.id, blocked_id: blockedId });
}

export async function reportUser(reportedId: string, reason: ReportReason) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: new Error('sem sessao') };
  return supabase
    .from('reports')
    .insert({ reporter_id: auth.user.id, reported_id: reportedId, reason });
}
