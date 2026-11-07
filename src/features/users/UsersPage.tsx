"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";
import RolePanel from "../admin-workspace/RolePanel";

import {
  deleteAdminUser,
  getAdminUsers,
  getAvailableRoles,
  getCurrentUserId,
  inviteAdminUser,
  updateAdminUserAccess,
  type AdminUser,
  type AdminUserStatus,
} from "./services";

type UserDraft = {
  status: AdminUserStatus;
  roleId: string;
};

export default function UsersPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const queryClient = useQueryClient();

  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [userPendingDelete, setUserPendingDelete] =
    useState<AdminUser | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const usersQuery = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => getAdminUsers(supabase),
  });

  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => getAvailableRoles(supabase),
  });

  const currentUserQuery = useQuery({
    queryKey: ["current-admin-user"],
    queryFn: () => getCurrentUserId(supabase),
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminUserAccess.bind(null, supabase),
    onSuccess: async () => {
      setDrafts({});
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: inviteAdminUser,
    onSuccess: async () => {
      setInviteEmail("");
      setInviteRoleId("");
      setIsInviteOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: async () => {
      setUserPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const isLoading =
    usersQuery.isLoading ||
    rolesQuery.isLoading ||
    currentUserQuery.isLoading;

  const getDraft = (user: AdminUser): UserDraft =>
    drafts[user.id] ?? {
      status: user.status,
      roleId: user.roles[0]?.id ?? "",
    };

  const updateDraft = (
    user: AdminUser,
    values: Partial<UserDraft>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [user.id]: {
        ...getDraft(user),
        ...values,
      },
    }));
  };

  const handleSave = (user: AdminUser) => {
    const draft = getDraft(user);

    if (!draft.roleId) return;

    updateMutation.mutate({
      userId: user.id,
      status: draft.status,
      roleId: draft.roleId,
    });
  };

  const handleInviteSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const email = inviteEmail.trim();
    if (!email || !inviteRoleId) return;

    inviteMutation.mutate({
      email,
      roleId: inviteRoleId,
    });
  };

  const closeInviteModal = () => {
    if (inviteMutation.isPending) return;
    setIsInviteOpen(false);
    inviteMutation.reset();
  };

  const closeDeleteModal = () => {
    if (deleteMutation.isPending) return;
    setUserPendingDelete(null);
    deleteMutation.reset();
  };

  return (
    <section className="nr-dashboard">
      <RolePanel />
      <div className="nr-dashboard-heading">
        <div>
          <span className="nr-dashboard-kicker">
            {isArabic ? "إدارة النظام" : "System Management"}
          </span>

          <h1>
            {isArabic
              ? "المستخدمون والصلاحيات"
              : "Users and Permissions"}
          </h1>

          <p>
            {isArabic
              ? "إدارة مستخدمي لوحة التحكم وحالاتهم وأدوارهم."
              : "Manage admin users, statuses, and roles."}
          </p>
        </div>

        <button
          type="button"
          className="nr-button"
          onClick={() => {
            inviteMutation.reset();
            setIsInviteOpen(true);
          }}
        >
          {isArabic ? "دعوة مستخدم" : "Invite User"}
        </button>
      </div>

      {updateMutation.isSuccess && (
        <div className="nr-state nr-state-success">
          <strong>
            {isArabic
              ? "تم تحديث المستخدم بنجاح."
              : "User updated successfully."}
          </strong>
        </div>
      )}

      {updateMutation.isError && (
        <div className="nr-state">
          <strong>
            {isArabic ? "تعذر تحديث المستخدم" : "Unable to update user"}
          </strong>
          <p>
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : isArabic
                ? "حدث خطأ غير متوقع."
                : "An unexpected error occurred."}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="nr-state">
          <strong>
            {isArabic ? "جاري تحميل المستخدمين..." : "Loading users..."}
          </strong>
        </div>
      ) : usersQuery.isError ? (
        <div className="nr-state">
          <strong>
            {isArabic ? "تعذر تحميل المستخدمين" : "Unable to load users"}
          </strong>
          <p>
            {usersQuery.error instanceof Error
              ? usersQuery.error.message
              : isArabic
                ? "حدث خطأ غير متوقع."
                : "An unexpected error occurred."}
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="nr-state">
          <strong>{isArabic ? "لا يوجد مستخدمون" : "No users found"}</strong>
        </div>
      ) : (
        <div className="nr-users-table-wrap">
          <table className="nr-users-table">
            <thead>
              <tr>
                <th>{isArabic ? "الاسم" : "Name"}</th>
                <th>{isArabic ? "البريد الإلكتروني" : "Email"}</th>
                <th>{isArabic ? "الحالة" : "Status"}</th>
                <th>{isArabic ? "الدور" : "Role"}</th>
                <th>{isArabic ? "آخر دخول" : "Last Login"}</th>
                <th>{isArabic ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const draft = getDraft(user);
                const isCurrentUser = currentUserQuery.data === user.id;

                return (
                  <tr key={user.id}>
                    <td>
                      {user.displayName ||
                        (isArabic ? "بدون اسم" : "No name")}

                      {isCurrentUser && (
                        <small className="nr-current-user-label">
                          {isArabic ? " حسابك" : " Your account"}
                        </small>
                      )}
                    </td>

                    <td>
                      {user.email ||
                        (isArabic ? "غير متوفر" : "Unavailable")}
                    </td>

                    <td>
                      <select
                        className="nr-input"
                        value={draft.status}
                        disabled={isCurrentUser}
                        onChange={(event) =>
                          updateDraft(user, {
                            status: event.target.value as AdminUserStatus,
                          })
                        }
                      >
                        <option value="active">
                          {isArabic ? "نشط" : "Active"}
                        </option>
                        <option value="suspended">
                          {isArabic ? "موقوف" : "Suspended"}
                        </option>
                        <option value="invited">
                          {isArabic ? "مدعو" : "Invited"}
                        </option>
                      </select>
                    </td>

                    <td>
                      <select
                        className="nr-input"
                        value={draft.roleId}
                        disabled={isCurrentUser}
                        onChange={(event) =>
                          updateDraft(user, {
                            roleId: event.target.value,
                          })
                        }
                      >
                        <option value="">
                          {isArabic ? "اختر الدور" : "Select role"}
                        </option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {isArabic ? role.nameAr : role.nameEn}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString(
                            isArabic ? "ar-SA" : "en-GB",
                          )
                        : isArabic
                          ? "لم يسجل الدخول"
                          : "Never logged in"}
                    </td>

                    <td>
                      <div className="nr-user-actions">
                        <button
                          type="button"
                          className="nr-button"
                          disabled={
                            isCurrentUser ||
                            !draft.roleId ||
                            updateMutation.isPending ||
                            deleteMutation.isPending
                          }
                          onClick={() => handleSave(user)}
                        >
                          {updateMutation.isPending
                            ? isArabic
                              ? "جارٍ الحفظ..."
                              : "Saving..."
                            : isArabic
                              ? "حفظ"
                              : "Save"}
                        </button>

                        <button
                          type="button"
                          className="nr-button-danger"
                          disabled={
                            isCurrentUser ||
                            deleteMutation.isPending
                          }
                          onClick={() => {
                            deleteMutation.reset();
                            setUserPendingDelete(user);
                          }}
                        >
                          {isArabic ? "حذف" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {userPendingDelete && (
        <div
          className="nr-modal-backdrop"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            className="nr-modal nr-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="nr-modal-heading">
              <div>
                <h2 id="delete-user-title">
                  {isArabic ? "حذف المستخدم" : "Delete User"}
                </h2>

                <p>
                  {isArabic
                    ? "سيتم حذف الحساب وملفه الإداري وأدواره نهائيًا."
                    : "The account, profile, and roles will be permanently deleted."}
                </p>
              </div>

              <button
                type="button"
                className="nr-modal-close"
                aria-label={isArabic ? "إغلاق" : "Close"}
                disabled={deleteMutation.isPending}
                onClick={closeDeleteModal}
              >
                ×
              </button>
            </div>

            <div className="nr-delete-user-summary">
              <strong>
                {userPendingDelete.displayName ||
                  (isArabic ? "بدون اسم" : "No name")}
              </strong>

              <span>{userPendingDelete.email}</span>
            </div>

            {deleteMutation.isError && (
              <div className="nr-state">
                <strong>
                  {isArabic
                    ? "تعذر حذف المستخدم"
                    : "Unable to delete user"}
                </strong>

                <p>
                  {deleteMutation.error instanceof Error
                    ? deleteMutation.error.message
                    : isArabic
                      ? "حدث خطأ غير متوقع."
                      : "An unexpected error occurred."}
                </p>
              </div>
            )}

            <div className="nr-modal-actions">
              <button
                type="button"
                className="nr-button-secondary"
                disabled={deleteMutation.isPending}
                onClick={closeDeleteModal}
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </button>

              <button
                type="button"
                className="nr-button-danger"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(userPendingDelete.id)
                }
              >
                {deleteMutation.isPending
                  ? isArabic
                    ? "جارٍ الحذف..."
                    : "Deleting..."
                  : isArabic
                    ? "تأكيد الحذف"
                    : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isInviteOpen && (
        <div
          className="nr-modal-backdrop"
          role="presentation"
          onClick={closeInviteModal}
        >
          <div
            className="nr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-user-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="nr-modal-heading">
              <div>
                <h2 id="invite-user-title">
                  {isArabic ? "دعوة مستخدم إداري" : "Invite Admin User"}
                </h2>
                <p>
                  {isArabic
                    ? "أدخل البريد الإلكتروني وحدد الدور."
                    : "Enter the email and select a role."}
                </p>
              </div>

              <button
                type="button"
                className="nr-modal-close"
                aria-label={isArabic ? "إغلاق" : "Close"}
                disabled={inviteMutation.isPending}
                onClick={closeInviteModal}
              >
                ×
              </button>
            </div>

            <form
              className="nr-user-invite-form"
              onSubmit={handleInviteSubmit}
            >
              <label>
                <span>{isArabic ? "البريد الإلكتروني" : "Email"}</span>
                <input
                  type="email"
                  className="nr-input"
                  value={inviteEmail}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  disabled={inviteMutation.isPending}
                  onChange={(event) => setInviteEmail(event.target.value)}
                />
              </label>

              <label>
                <span>{isArabic ? "الدور" : "Role"}</span>
                <select
                  className="nr-input"
                  value={inviteRoleId}
                  required
                  disabled={inviteMutation.isPending}
                  onChange={(event) => setInviteRoleId(event.target.value)}
                >
                  <option value="">
                    {isArabic ? "اختر الدور" : "Select role"}
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {isArabic ? role.nameAr : role.nameEn}
                    </option>
                  ))}
                </select>
              </label>

              {inviteMutation.isError && (
                <div className="nr-state">
                  <strong>
                    {isArabic
                      ? "تعذر إرسال الدعوة"
                      : "Unable to send invitation"}
                  </strong>
                  <p>
                    {inviteMutation.error instanceof Error
                      ? inviteMutation.error.message
                      : isArabic
                        ? "حدث خطأ غير متوقع."
                        : "An unexpected error occurred."}
                  </p>
                </div>
              )}

              <div className="nr-modal-actions">
                <button
                  type="button"
                  className="nr-button-secondary"
                  disabled={inviteMutation.isPending}
                  onClick={closeInviteModal}
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>

                <button
                  type="submit"
                  className="nr-button"
                  disabled={
                    inviteMutation.isPending ||
                    !inviteEmail.trim() ||
                    !inviteRoleId
                  }
                >
                  {inviteMutation.isPending
                    ? isArabic
                      ? "جارٍ الإرسال..."
                      : "Sending..."
                    : isArabic
                      ? "إرسال الدعوة"
                      : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
