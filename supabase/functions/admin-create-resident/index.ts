// Edge Function: a community administrator adds a resident from the backoffice.
// Creating Auth accounts needs the secret key, which never leaves the server.
// The caller's token is verified here (deploy with --no-verify-jwt), and the
// community admin check runs again inside service_add_resident.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

import { generatePassword, handle } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL');
const secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !secretKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve((request) =>
  handle(request, {
    async getCallerId(token) {
      const { data, error } = await admin.auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async isCommunityAdmin(callerId, communityId) {
      const { data, error } = await admin
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId)
        .eq('user_id', callerId)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },
    async findUserIdByEmail(email) {
      const { data, error } = await admin.rpc('service_user_id_by_email', { p_email: email });
      if (error) throw error;
      return (data as string | null) ?? null;
    },
    async createUser(email, password) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      return data.user.id;
    },
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    async addResident({ callerId, communityId, userId, displayName, unitId }) {
      const { error } = await admin.rpc('service_add_resident', {
        p_caller_id: callerId,
        p_community_id: communityId,
        p_user_id: userId,
        p_display_name: displayName,
        p_unit_id: unitId,
      });
      if (error) throw error;
    },
    generatePassword,
    log: (message) => console.error(message),
  }).catch((error) => {
    console.error(error);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  })
);
