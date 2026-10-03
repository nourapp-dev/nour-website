import type { SupabaseClient } from "@supabase/supabase-js";

import { canAccessAdmin } from "./account-access";

export type AdminLoginInput = {
  email: string;
  password: string;
};

export async function signInAdmin(
  supabase: SupabaseClient,
  input: AdminLoginInput,
) {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error("تعذر إنشاء جلسة تسجيل الدخول.");
  }

  if (!(await canAccessAdmin(supabase, data.user.id))) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("هذا الحساب غير مخوّل للدخول إلى الإدارة.");
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function signOutAdmin(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    throw new Error(error.message);
  }
}
