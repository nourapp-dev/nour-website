import { NextResponse } from "next/server";

import { createClient } from "../../../../../src/lib/supabase/server";
import { createAdminClient } from "../../../../../src/lib/supabase/admin";

type InviteUserBody = {
  email?: string;
  roleId?: string;
  fullName?: string;
};

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is missing.");
  }

  return configuredUrl.replace(/\/+$/, "");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      return NextResponse.json(
        {
          message: "يجب تسجيل الدخول.",
        },
        {
          status: 401,
        },
      );
    }

    const { data: canManageUsers, error: permissionError } = await supabase.rpc(
      "current_user_has_permission",
      {
        permission_code: "users.manage",
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

    if (!canManageUsers) {
      return NextResponse.json(
        {
          message: "ليس لديك صلاحية دعوة المستخدمين.",
        },
        {
          status: 403,
        },
      );
    }

    const body = (await request.json()) as InviteUserBody;

    const email = body.email?.trim().toLowerCase();

    const roleId = body.roleId?.trim();

    if (!email || !roleId) {
      return NextResponse.json(
        {
          message: "البريد الإلكتروني والدور مطلوبان.",
        },
        {
          status: 400,
        },
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          message: "البريد الإلكتروني غير صالح.",
        },
        {
          status: 400,
        },
      );
    }

    const fullName =
      body.fullName?.trim() || email.split("@")[0]?.trim() || "Admin User";

    const adminClient = createAdminClient();

    const { data: role, error: roleError } = await adminClient
      .from("roles")
      .select(
        `
        id,
        key,
        name_ar,
        name_en
      `,
      )
      .eq("id", roleId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (roleError) {
      return NextResponse.json(
        {
          message: `تعذر التحقق من الدور: ${roleError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          message: "الدور المحدد غير موجود أو غير نشط.",
        },
        {
          status: 400,
        },
      );
    }

    const siteUrl = getSiteUrl();
    const inviteRedirectUrl = `${siteUrl}/admin/login/invite`;

    const { data: invitation, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteRedirectUrl,
        data: {
          full_name: fullName,
          admin_role_id: role.id,
          admin_role_key: role.key,
        },
      });

    if (inviteError) {
      return NextResponse.json(
        {
          message: `تعذر إرسال الدعوة: ${inviteError.message}`,
        },
        {
          status: 400,
        },
      );
    }

    const invitedUser = invitation.user;

    if (!invitedUser) {
      return NextResponse.json(
        {
          message: "تم إرسال الدعوة ولكن لم يتم إنشاء المستخدم.",
        },
        {
          status: 500,
        },
      );
    }

    const now = new Date().toISOString();

    const { error: profileError } = await adminClient
      .from("admin_profiles")
      .upsert(
        {
          id: invitedUser.id,
          email,
          full_name: fullName,
          status: "invited",
          updated_at: now,
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      await adminClient.auth.admin.deleteUser(invitedUser.id);

      return NextResponse.json(
        {
          message: `تعذر إنشاء الملف الإداري: ${profileError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    const { error: clearRolesError } = await adminClient
      .from("admin_user_roles")
      .update({
        deleted_at: now,
        updated_at: now,
      })
      .eq("user_id", invitedUser.id)
      .is("deleted_at", null);

    if (clearRolesError) {
      await adminClient
        .from("admin_profiles")
        .delete()
        .eq("id", invitedUser.id);

      await adminClient.auth.admin.deleteUser(invitedUser.id);

      return NextResponse.json(
        {
          message: `تعذر تجهيز أدوار المستخدم: ${clearRolesError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    const { error: assignmentError } = await adminClient
      .from("admin_user_roles")
      .upsert(
        {
          user_id: invitedUser.id,
          role_id: role.id,
          assigned_by: currentUser.id,
          deleted_at: null,
          updated_at: now,
        },
        {
          onConflict: "user_id,role_id",
        },
      );

    if (assignmentError) {
      await adminClient
        .from("admin_profiles")
        .delete()
        .eq("id", invitedUser.id);

      await adminClient.auth.admin.deleteUser(invitedUser.id);

      return NextResponse.json(
        {
          message: `تعذر ربط الدور بالمستخدم: ${assignmentError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        message: "تم إرسال الدعوة وربط الدور بنجاح.",
        user: {
          id: invitedUser.id,
          email,
          fullName,
          roleId: role.id,
          roleKey: role.key,
          roleNameAr: role.name_ar,
          roleNameEn: role.name_en,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
      },
      {
        status: 500,
      },
    );
  }
}
