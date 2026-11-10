import type { SupabaseClient } from "@supabase/supabase-js";

// Public page rendering must not wait indefinitely on an optional settings RPC.
// Preserve the existing fallback when the maintenance service is unavailable.
export async function readMaintenanceMode(
  supabase: Pick<SupabaseClient, "rpc">,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc("get_maintenance_mode")
      .abortSignal(AbortSignal.timeout(3_000));
    return !error && data === true;
  } catch {
    return false;
  }
}
