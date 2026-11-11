import type {
  SupabaseClient,
} from "@supabase/supabase-js";

export type AdminUserStatus =
  | "active"
  | "suspended"
  | "invited";

export type AdminUserRole = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
};

export type AdminUser = {
  id: string;
  displayName: string;
  email: string;
  status: AdminUserStatus;
  lastLoginAt: string | null;
  roles: AdminUserRole[];
};

export type UpdateAdminUserAccessInput = {
  userId: string;
  status: AdminUserStatus;
  roleId: string;
};

export type InviteAdminUserInput = {
  fullName: string;
  email: string;
  roleId: string;
};

type RoleRow = {
  id: string;
  key: string;
  name_ar: string;
  name_en: string;
};

export async function getCurrentUserId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(
      `تعذر التحقق من المستخدم الحالي: ${error.message}`,
    );
  }

  return data.user?.id ?? null;
}

export async function getAvailableRoles(
  supabase: SupabaseClient,
): Promise<AdminUserRole[]> {
  const {
    data,
    error,
  } = await supabase
    .from("roles")
    .select(`
      id,
      key,
      name_ar,
      name_en
    `)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `تعذر تحميل الأدوار: ${error.message}`,
    );
  }

  return (
    (data ?? []) as RoleRow[]
  ).map((role) => ({
    id: role.id,
    code: role.key,
    nameAr: role.name_ar,
    nameEn: role.name_en,
  }));
}

export async function getAdminUsers(
  _supabase: SupabaseClient,
): Promise<AdminUser[]> {
  const response = await fetch(
    "/api/admin/users",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const result = (await response.json()) as {
    users?: AdminUser[];
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      result.message ??
        "تعذر تحميل المستخدمين.",
    );
  }

  return result.users ?? [];
}

export async function updateAdminUserAccess(
  supabase: SupabaseClient,
  input: UpdateAdminUserAccessInput,
): Promise<void> {
  const {
    error,
  } = await supabase.rpc(
    "update_admin_user_access",
    {
      target_user_id:
        input.userId,
      new_status:
        input.status,
      new_role_id:
        input.roleId,
    },
  );

  if (error) {
    throw new Error(
      `تعذر تحديث المستخدم: ${error.message}`,
    );
  }
}

export async function inviteAdminUser(
  input: InviteAdminUserInput,
): Promise<void> {
  const response = await fetch(
    "/api/admin/users/invite",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  const contentType =
    response.headers.get(
      "content-type",
    );

  if (
    !contentType?.includes(
      "application/json",
    )
  ) {
    const responseText =
      await response.text();

    throw new Error(
      response.status === 404
        ? "مسار دعوة المستخدم غير موجود. تأكد من مكان ملف route.ts."
        : `أعاد السيرفر استجابة غير متوقعة: ${responseText.slice(
            0,
            120,
          )}`,
    );
  }

  const result =
    (await response.json()) as {
      message?: string;
    };

  if (!response.ok) {
    throw new Error(
      result.message ??
        "تعذر إرسال دعوة المستخدم.",
    );
  }
}

export async function deleteAdminUser(
  userId: string,
): Promise<void> {
  const response = await fetch(
    `/api/admin/users/${userId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const contentType =
    response.headers.get("content-type");

  if (
    !contentType?.includes(
      "application/json",
    )
  ) {
    throw new Error(
      "أعاد السيرفر استجابة غير متوقعة.",
    );
  }

  const result =
    (await response.json()) as {
      message?: string;
    };

  if (!response.ok) {
    throw new Error(
      result.message ??
        "تعذر حذف المستخدم.",
    );
  }
}