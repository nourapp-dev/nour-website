import { NextResponse } from "next/server";

import { createClient } from "../../../../../src/server/supabase/session";
import { createAdminClient } from "../../../../../src/server/supabase/admin";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        {
          message: "معرّف المستخدم مطلوب.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = await createClient();

    const {
      data: { user: currentUser },
      error: currentUserError,
    } = await supabase.auth.getUser();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        {
          message: "يجب تسجيل الدخول.",
        },
        {
          status: 401,
        },
      );
    }

    if (currentUser.id === userId) {
      return NextResponse.json(
        {
          message: "لا يمكنك حذف حسابك الحالي.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: isSuperAdmin,
      error: permissionError,
    } = await supabase.rpc(
      "is_super_admin",
      {
        user_id: currentUser.id,
      },
    );

    if (permissionError) {
      return NextResponse.json(
        {
          message: `تعذر التحقق من الصلاحية: ${permissionError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          message: "ليس لديك صلاحية حذف المستخدمين.",
        },
        {
          status: 403,
        },
      );
    }

    const adminClient = createAdminClient();

    const {
      data: targetUserResult,
      error: targetUserError,
    } =
      await adminClient.auth.admin.getUserById(
        userId,
      );

    if (
      targetUserError ||
      !targetUserResult.user
    ) {
      return NextResponse.json(
        {
          message: "المستخدم غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    const targetUser =
      targetUserResult.user;

    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from("admin_profiles")
      .select(`
        id,
        full_name,
        email,
        status
      `)
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        {
          message: `تعذر تحميل بيانات المستخدم: ${profileError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    const { error: auditError } =
      await adminClient
        .from("admin_audit_logs")
        .insert({
          actor_user_id:
            currentUser.id,

          action:
            "admin_user_deleted",

          entity_type:
            "admin_user",

          entity_id:
            userId,

          old_values: {
            id: userId,

            full_name:
              profile?.full_name ??
              targetUser.user_metadata
                ?.full_name ??
              null,

            email:
              targetUser.email ??
              profile?.email ??
              null,

            status:
              profile?.status ??
              null,
          },

          new_values: {},

          metadata: {
            source:
              "admin_dashboard",
          },
        });

    if (auditError) {
      console.error(
        "Failed to write admin audit log:",
        auditError.message,
      );
    }

   

    const {
      error: authDeleteError,
    } =
      await adminClient.auth.admin.deleteUser(
        userId,
      );

    if (authDeleteError) {
      return NextResponse.json(
        {
          message: `تعذر حذف حساب المستخدم: ${authDeleteError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          "تم حذف المستخدم بنجاح.",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Delete admin user error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع.",
      },
      {
        status: 500,
      },
    );
  }
}