"use client";
import { createClient } from "../lib/supabase/client";
export function getSupabaseBrowserClient() {
  return createClient();
}
