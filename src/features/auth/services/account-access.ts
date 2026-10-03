import type { SupabaseClient } from "@supabase/supabase-js";

// Authorization comes from protected database rows, never user-editable metadata.
export async function hasAdminIdentity(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("admin_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function canAccessAdmin(client: SupabaseClient, userId: string) {
  const { data: profile, error } = await client
    .from("admin_profiles")
    .select("id,status,deleted_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile || profile.status !== "active" || profile.deleted_at)
    return false;
  const { data: roles, error: rolesError } = await client
    .from("admin_user_roles")
    .select("role:roles!inner(is_active,deleted_at)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("role.is_active", true)
    .is("role.deleted_at", null)
    .limit(1);
  if (rolesError) throw rolesError;
  return Boolean(roles?.length);
}

export async function getPilgrimUser(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  if (await hasAdminIdentity(client, data.user.id)) return null;
  return data.user;
}
