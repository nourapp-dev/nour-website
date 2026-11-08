import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../../src/server/supabase/session";
import {
  normalizePresentation,
  validatePresentation,
} from "../../../../src/features/website/presentation";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const client = await createClient("admin");
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user)
    return NextResponse.json(
      { error: "authentication_required" },
      { status: 401 },
    );
  try {
    const body = await request.json();
    if (!["draft", "publish", "restore"].includes(body.action))
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    if (body.action === "publish") {
      const state = await client.rpc("website_content_state");
      if (state.error) throw state.error;
      const error = validatePresentation(
        normalizePresentation(
          state.data?.["website.home_presentation_draft"]?.value,
        ),
      );
      if (error) return NextResponse.json({ error }, { status: 422 });
    }
    const { data, error } = await client.rpc("website_content_write", {
      action: body.action,
      content:
        body.action === "draft" ? normalizePresentation(body.content) : null,
      expected_draft: body.expectedDraft,
      expected_published: body.expectedPublished,
      restore_id: body.restoreId ?? null,
    });
    if (error)
      return NextResponse.json(
        { error: error.message },
        {
          status:
            error.code === "PT409" ? 409 : error.code === "42501" ? 403 : 422,
        },
      );
    if (body.action !== "draft") {
      revalidatePath("/", "layout");
    }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "content_request_failed" },
      { status: 503 },
    );
  }
}
