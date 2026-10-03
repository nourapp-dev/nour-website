import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authCookieName,
  authScopeForPath,
  safeAccountNext,
} from "../src/lib/supabase/auth-scope.ts";
import {
  canAccessAdmin,
  getPilgrimUser,
} from "../src/features/auth/services/account-access.ts";

test("admin, APIs and pilgrim routes select independent auth stores", () => {
  for (const p of [
    "/admin",
    "/admin/dashboard",
    "/admin/login/invite",
    "/api/admin/users",
  ])
    assert.equal(authScopeForPath(p), "admin");
  for (const p of [
    "/",
    "/account/login",
    "/programs",
    "/administrator",
    "/api/bookings",
  ])
    assert.equal(authScopeForPath(p), "pilgrim");
  assert.notEqual(
    authCookieName("https://example.supabase.co", "admin"),
    authCookieName("https://example.supabase.co", "pilgrim"),
  );
  assert.notEqual(
    authCookieName("https://example.supabase.co", "admin"),
    "sb-example-auth-token",
  );
});
test("pilgrim return paths cannot cross to administration or callbacks", () => {
  for (const p of [
    "/admin",
    "/admin/dashboard",
    "/%61dmin/dashboard",
    "/foo/../admin",
    "/api/admin/users",
    "//bad.test",
    "/\\bad.test",
    "/auth/confirm",
    "/account/login",
    "/%ZZ",
  ])
    assert.equal(safeAccountNext(p), "/account/profile", p);
  assert.equal(
    safeAccountNext("/programs/umrah?city=one#details"),
    "/programs/umrah?city=one#details",
  );
});
function mock({
  profile = null,
  roles = [],
  user = { id: "user" },
  error = null,
} = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      calls.push(table);
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        is() {
          return q;
        },
        limit: async () => ({ data: roles, error }),
        maybeSingle: async () => ({ data: profile, error }),
      };
      return q;
    },
  };
  return { client, calls };
}
test("admin access requires an active undeleted profile and an active role", async () => {
  for (const profile of [
    null,
    { status: "invited" },
    { status: "suspended" },
    { status: "active", deleted_at: "2026-01-01" },
  ])
    assert.equal(await canAccessAdmin(mock({ profile }).client, "user"), false);
  assert.equal(
    await canAccessAdmin(
      mock({ profile: { status: "active", deleted_at: null } }).client,
      "user",
    ),
    false,
  );
  assert.equal(
    await canAccessAdmin(
      mock({
        profile: { status: "active", deleted_at: null },
        roles: [{ role: { is_active: true } }],
      }).client,
      "user",
    ),
    true,
  );
  await assert.rejects(
    canAccessAdmin(
      mock({ error: new Error("database unavailable") }).client,
      "user",
    ),
  );
});
test("an administrative identity never becomes a pilgrim profile automatically", async () => {
  assert.equal(
    await getPilgrimUser(mock({ profile: { id: "user" } }).client),
    null,
  );
  assert.deepEqual(await getPilgrimUser(mock().client), { id: "user" });
  assert.equal(await getPilgrimUser(mock({ user: null }).client), null);
});
