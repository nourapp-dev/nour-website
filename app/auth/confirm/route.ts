import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "../../../src/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const scope = type === "invite" || type === "recovery" ? "admin" : "pilgrim";
  const destination =
    scope === "admin" ? "/admin/login/invite" : "/account/profile";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/admin/login?error=invalid_invite`);
  }

  const supabase = await createClient(scope);

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=invite_verification_failed`,
    );
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
