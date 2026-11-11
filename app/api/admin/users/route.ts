import { NextResponse } from "next/server";

import { createClient } from "../../../../src/server/supabase/session";
import { canAccessAdmin } from "../../../../src/features/auth/services/account-access";
import { createAdminClient } from "../../../../src/server/supabase/admin";

export const dynamic = "force-dynamic";

type AdminProfileRow = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  last_login_at: string | null;
};

type RoleRow = {
  id: string;

  // البنية الحالية
  key?: string;
  name_ar?: string;
  name_en?: string;

  // دعم مؤقت للبنية القديمة إن وجدت
  code?: string;
  name?: string;
};

type AssignmentRow = {
  user_id: string;
  role_id: string;
};

export async function GET() {
  try {
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

    const permissions = await Promise.all(["users.read", "users.manage"].map(permission_code => supabase.rpc("current_user_has_permission", { permission_code })));
    if (permissions.some(result => result.error)) return NextResponse.json({ message: "تعذر التحقق من الصلاحيات." }, { status: 503 });
    if (!permissions.some(result => result.data === true) || !(await canAccessAdmin(supabase, currentUser.id))) return NextResponse.json({ message: "ليس لديك صلاحية عرض الموظفين." }, { status: 403 });

    const adminClient =
      createAdminClient();

    const {
      data: authUsersResult,
      error: authUsersError,
    } =
      await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authUsersError) {
      return NextResponse.json(
        {
          message:
            `تعذر تحميل حسابات المستخدمين: ${authUsersError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    const [
      profilesResult,
      assignmentsResult,
      rolesResult,
    ] = await Promise.all([
      adminClient
        .from("admin_profiles")
        .select(`
          id,
          full_name,
          email,
          status,
          last_login_at
        `),

      adminClient
        .from("admin_user_roles")
        .select(`
          user_id,
          role_id
        `)
        .is("deleted_at", null),

      // نستخدم * مؤقتًا حتى لا يعتمد الطلب
      // على اسم عمود قديم مخزن في PostgREST.
      adminClient
        .from("roles")
        .select("*"),
    ]);

    if (profilesResult.error) {
      return NextResponse.json(
        {
          message:
            `تعذر تحميل الملفات الإدارية: ${profilesResult.error.message}`,
        },
        {
          status: 500,
        },
      );
    }

    if (assignmentsResult.error) {
      return NextResponse.json(
        {
          message:
            `تعذر تحميل ربط الأدوار: ${assignmentsResult.error.message}`,
        },
        {
          status: 500,
        },
      );
    }

    if (rolesResult.error) {
      return NextResponse.json(
        {
          message:
            `تعذر تحميل الأدوار: ${rolesResult.error.message}`,
        },
        {
          status: 500,
        },
      );
    }

    const profiles =
      (profilesResult.data ??
        []) as AdminProfileRow[];

    const assignments =
      (assignmentsResult.data ??
        []) as AssignmentRow[];

    const availableRoles =
      (rolesResult.data ??
        []) as RoleRow[];

    const profilesById =
      new Map<string, AdminProfileRow>(
        profiles.map((profile) => [
          profile.id,
          profile,
        ]),
      );

    const rolesById =
      new Map<string, RoleRow>(
        availableRoles.map((role) => [
          role.id,
          role,
        ]),
      );

    const rolesByUser =
      new Map<string, RoleRow[]>();

    assignments.forEach((assignment) => {
      const role =
        rolesById.get(
          assignment.role_id,
        );

      if (!role) {
        return;
      }

      const currentRoles =
        rolesByUser.get(
          assignment.user_id,
        ) ?? [];

      currentRoles.push(role);

      rolesByUser.set(
        assignment.user_id,
        currentRoles,
      );
    });

    const users =
      authUsersResult.users.filter(authUser => profilesById.has(authUser.id)).map(
        (authUser) => {
          const profile =
            profilesById.get(
              authUser.id,
            );

          const userRoles =
            rolesByUser.get(
              authUser.id,
            ) ?? [];

          return {
            id: authUser.id,

            displayName:
              profile?.full_name ||
              authUser.user_metadata
                ?.full_name ||
              authUser.email
                ?.split("@")[0] ||
              "",

            email:
              authUser.email ||
              profile?.email ||
              "",

            status:
              profile?.status ??
              "invited",

            lastLoginAt:
              authUser.last_sign_in_at ??
              profile?.last_login_at ??
              null,

            roles:
              userRoles.map((role) => {
                const roleCode =
                  role.key ??
                  role.code ??
                  "";

                const fallbackName =
                  role.name ??
                  roleCode;

                return {
                  id: role.id,
                  code: roleCode,

                  nameAr:
                    role.name_ar ??
                    fallbackName,

                  nameEn:
                    role.name_en ??
                    fallbackName,
                };
              }),

            isCurrentUser:
              authUser.id ===
              currentUser.id,
          };
        },
      );

    return NextResponse.json(
      {
        users,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
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