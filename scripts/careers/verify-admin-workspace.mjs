import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [
        line.slice(0, i),
        line
          .slice(i + 1)
          .trim()
          .replace(/^(["'])(.*)\1$/, "$2"),
      ];
    }),
);
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(
  ["localhost", "127.0.0.1"].includes(url.hostname) && url.port === "54331",
);
const service = createClient(url.origin, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const account = JSON.parse(
  readFileSync(".next-ui-preview/local-admin-account.json", "utf8"),
);
const cookieStore = new Map();
const admin = createServerClient(
  url.origin,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookieOptions: {
      name: `nour-${url.hostname.split(".")[0]}-admin-auth-v1`,
      secure: false,
      path: "/",
    },
    cookies: {
      getAll: () => [...cookieStore].map(([name, value]) => ({ name, value })),
      setAll: (values) =>
        values.forEach(({ name, value }) => cookieStore.set(name, value)),
    },
  },
);
const login = await admin.auth.signInWithPassword({
  email: account.email,
  password: account.password,
});
assert.ifError(login.error);
const run = crypto.randomUUID();
const createdUsers = [];
const createdRoles = [];
const records = [];
const partnerRecords = [];
let cvPath;
const rpc = async (client, name, args) => {
  const r = await client.rpc(name, args);
  assert.ifError(r.error);
  return r.data;
};
const user = async (role) => {
  const email = `workspace-${crypto.randomUUID()}@example.test`,
    password = `Test!${randomBytes(20).toString("base64url")}`;
  const r = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.ifError(r.error);
  createdUsers.push(r.data.user.id);
  if (role) {
    assert.ifError(
      (
        await service.from("admin_profiles").insert({
          id: r.data.user.id,
          email,
          full_name: "Synthetic workspace reviewer",
          status: "active",
        })
      ).error,
    );
    assert.ifError(
      (
        await service
          .from("admin_user_roles")
          .insert({ user_id: r.data.user.id, role_id: role })
      ).error,
    );
  }
  const cookies = new Map();
  const client = createServerClient(
    url.origin,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        name: `nour-${url.hostname.split(".")[0]}-admin-auth-v1`,
        secure: false,
        path: "/",
      },
      cookies: {
        getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
        setAll: (values) =>
          values.forEach(({ name, value }) => cookies.set(name, value)),
      },
    },
  );
  assert.ifError(
    (await client.auth.signInWithPassword({ email, password })).error,
  );
  return { id: r.data.user.id, client, cookies };
};
const headers = (cookies) => ({
  cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
});
try {
  assert.notEqual(env.NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED, "true");
  const pausedBooking = await fetch("http://localhost:3107/api/bookings", {
    method: "POST",
    headers: {
      origin: "http://localhost:3107",
      "content-type": "application/json",
    },
    body: "{}",
  });
  assert.equal(pausedBooking.status, 503);
  assert.equal((await pausedBooking.json()).code, "website_booking_paused");
  const roleDefinitions = await rpc(admin, "workspace_roles", {});
  assert.ok(roleDefinitions.roles.some((item) => item.key === "super_admin"));
  assert.ok(
    roleDefinitions.permissions.some(
      (item) => item.key === "applications.attachments",
    ),
  );
  assert.ifError(
    (
      await admin
        .from("audit_logs")
        .select("id,actor_id,action,entity_type,entity_id,created_at")
        .limit(1)
    ).error,
  );
  const usersApi = await fetch("http://localhost:3107/api/admin/users", {
    headers: headers(cookieStore),
  });
  assert.equal(usersApi.status, 200);
  const usersResult = await usersApi.json();
  assert.ok(Array.isArray(usersResult.users));
  const page = await fetch("http://localhost:3107/admin/login");
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(!html.includes("aw-sidebar") && !html.includes("ISSA"));
  assert.ok(page.headers.get("content-security-policy").includes(url.origin));
  for (const path of [
    "/admin/dashboard",
    "/admin/applications",
    "/admin/partners",
    "/admin/tasks",
    "/admin/notifications",
    "/admin/activity",
    "/admin/search",
    "/admin/users",
  ]) {
    const r = await fetch(`http://localhost:3107${path}`, {
      headers: headers(cookieStore),
      redirect: "manual",
    });
    assert.equal(r.status, 200, path);
    assert.match(r.headers.get("cache-control"), /no-store|no-cache/);
    assert.equal(r.headers.get("pragma"), "no-cache");
  }
  const role = await rpc(admin, "workspace_save_role", {
    target_role: null,
    role_key: `qa_${run.replaceAll("-", "").slice(0, 20)}`,
    name_ar: "دور اختبار معزول",
    name_en: "Synthetic isolated role",
    permission_keys: ["applications.view"],
  });
  createdRoles.push(role);
  const reader = await user(role);
  const outsider = await user(null);
  assert.equal(
    (
      await fetch("http://localhost:3107/admin/partners", {
        headers: headers(reader.cookies),
        redirect: "manual",
      })
    ).status,
    403,
  );
  assert.ok(
    [302, 307].includes(
      (
        await fetch("http://localhost:3107/admin/applications", {
          headers: headers(outsider.cookies),
          redirect: "manual",
        })
      ).status,
    ),
  );
  assert.ok(
    (
      await reader.client.rpc("workspace_save_role", {
        target_role: role,
        role_key: "unauthorized",
        name_ar: "No",
        name_en: "No",
        permission_keys: ["applications.manage"],
      })
    ).error,
  );
  const input = {
    submissionKey: run,
    applicationKind: "talent_pool",
    careerArea: "technology_product",
    opportunityType: "freelance",
    employmentType: "other",
    workMode: "hybrid",
    fullName: "Synthetic Workspace E2E",
    email: "workspace-e2e@example.test",
    phone: "+966500000000",
    country: "SA",
    city: "Riyadh",
    yearsOfExperience: 0,
    linkedinUrl: "https://www.linkedin.com/in/example",
    portfolioUrl: "https://example.test/work",
    message: "Synthetic verification only",
    privacyAccepted: true,
  };
  const body = new FormData();
  body.set("input", JSON.stringify(input));
  body.set(
    "cv",
    new File(["%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n"], "synthetic.pdf", {
      type: "application/pdf",
    }),
  );
  const response = await fetch("http://localhost:3107/api/applications/join", {
    method: "POST",
    headers: { origin: "http://localhost:3107" },
    body,
  });
  assert.equal(response.status, 201);
  const result = await response.json();
  records.push(result.id);
  let data = await rpc(admin, "workspace_list", {
    module: "applications",
    filters: {
      search: "workspace-e2e@example.test",
      opportunity: "freelance",
      page: "1",
    },
  });
  assert.equal(data.total, 1);
  let row = data.items[0];
  assert.equal(row.opportunity_type, "freelance");
  assert.equal(row.employment_type, "other");
  assert.equal(row.work_mode, "hybrid");
  assert.equal(row.country, "SA");
  assert.equal(row.years_of_experience, 0);
  assert.equal(row.id, result.id);
  cvPath = row.cv_path;
  const detail = await fetch(
    `http://localhost:3107/admin/applications/${row.id}`,
    { headers: headers(cookieStore), redirect: "manual" },
  );
  assert.equal(detail.status, 200);
  assert.ok(
    (
      await reader.client.rpc("workspace_update", {
        module: "applications",
        record_id: row.id,
        expected_updated_at: row.updated_at,
        patch: { internal_notes: "forbidden" },
      })
    ).error,
  );
  assert.ok(
    (
      await reader.client.storage
        .from("application-files")
        .createSignedUrl(cvPath, 60)
    ).error,
  );
  assert.ok(
    (
      await reader.client.rpc("workspace_export", {
        module: "applications",
        filters: {},
      })
    ).error,
  );
  assert.ok(
    (
      await admin.rpc("workspace_update", {
        module: "applications",
        record_id: row.id,
        expected_updated_at: row.updated_at,
        patch: { status: "approved" },
      })
    ).error,
  );
  const oldVersion = row.updated_at;
  const exported = await rpc(admin, "workspace_export", {
    module: "applications",
    filters: { search: "workspace-e2e@example.test" },
  });
  assert.equal(exported.items.length, 1);
  assert.equal(exported.items[0].email, undefined);
  assert.equal(exported.items[0].cv_path, undefined);
  assert.equal(exported.items[0].internal_notes, undefined);
  await rpc(admin, "workspace_save_role", {
    target_role: role,
    role_key: `qa_${run.replaceAll("-", "").slice(0, 20)}`,
    name_ar: "Synthetic isolated role",
    name_en: "Synthetic isolated role",
    permission_keys: [
      "applications.view",
      "applications.status",
      "applications.archive",
    ],
  });
  assert.ok(
    (
      await reader.client
        .from("job_applications")
        .update({ full_name: "Unauthorized edit" })
        .eq("id", row.id)
        .select("id")
    ).error,
  );
  row = await rpc(admin, "workspace_update", {
    module: "applications",
    record_id: row.id,
    expected_updated_at: row.updated_at,
    patch: {
      status: "under_review",
      internal_notes: "Synthetic internal note",
      assigned_to: reader.id,
    },
  });
  assert.equal(row.internal_notes, "Synthetic internal note");
  assert.equal(row.assigned_to, reader.id);
  const conflict = await admin.rpc("workspace_update", {
    module: "applications",
    record_id: row.id,
    expected_updated_at: oldVersion,
    patch: { internal_notes: "stale overwrite" },
  });
  assert.ok(conflict.error, "Stale update was accepted");
  assert.match(conflict.error.message, /edit_conflict/);
  const task = await rpc(admin, "workspace_save_task", {
    task_id: null,
    module: "applications",
    record_id: row.id,
    title: "Synthetic follow-up",
    assignee: reader.id,
    due_at: null,
    next_status: "open",
    expected_updated_at: null,
  });
  const taskRow = await reader.client
    .from("admin_followups")
    .select("*")
    .eq("id", task)
    .single();
  assert.ifError(taskRow.error);
  assert.equal(taskRow.data.due_at, null);
  await rpc(reader.client, "workspace_save_task", {
    task_id: task,
    module: "applications",
    record_id: row.id,
    title: taskRow.data.title,
    assignee: reader.id,
    due_at: null,
    next_status: "done",
    expected_updated_at: taskRow.data.updated_at,
  });
  row = await rpc(admin, "workspace_update", {
    module: "applications",
    record_id: row.id,
    expected_updated_at: row.updated_at,
    patch: { status: "contacted" },
  });
  assert.ok(row.last_contacted_at);
  const events = await reader.client
    .from("admin_intake_events")
    .select("event,changes")
    .eq("record_id", row.id);
  assert.ifError(events.error);
  assert.ok(events.data.some((e) => e.event === "created"));
  assert.ok(events.data.some((e) => e.event === "assigned"));
  assert.ok(events.data.some((e) => e.event === "task_created"));
  assert.ok(events.data.some((e) => e.event === "task_updated"));
  assert.ok(!JSON.stringify(events.data).includes("Synthetic internal note"));
  const notices = await reader.client
    .from("admin_notifications")
    .select("*")
    .eq("record_id", row.id);
  assert.ifError(notices.error);
  assert.ok(notices.data.length >= 2);
  assert.equal(
    new Set(notices.data.map((n) => n.event_id)).size,
    notices.data.length,
  );
  await rpc(reader.client, "workspace_read_notification", {
    notification_id: notices.data[0].id,
  });
  assert.ifError(
    (await admin.storage.from("application-files").createSignedUrl(cvPath, 60))
      .error,
  );
  assert.ok(
    (
      await reader.client
        .from("admin_intake_events")
        .update({ event: "tampered" })
        .eq("record_id", row.id)
    ).error,
  );
  await rpc(admin, "workspace_update", {
    module: "applications",
    record_id: row.id,
    expected_updated_at: row.updated_at,
    patch: { status: "archived", deleted_at: new Date().toISOString() },
  });
  data = await rpc(admin, "workspace_list", {
    module: "applications",
    filters: { search: "workspace-e2e@example.test" },
  });
  assert.equal(data.total, 0);
  data = await rpc(admin, "workspace_list", {
    module: "applications",
    filters: { search: "workspace-e2e@example.test", archived: "true" },
  });
  assert.equal(data.total, 1);
  row = await rpc(admin, "workspace_update", {
    module: "applications",
    record_id: row.id,
    expected_updated_at: data.items[0].updated_at,
    patch: { status: "under_review", deleted_at: null },
  });
  assert.equal(row.deleted_at, null);
  const partnerId = await rpc(outsider.client, "submit_partner_interest", {
    input: {
      submission_key: crypto.randomUUID(),
      partnership_track: "international",
      terms_accepted: true,
      company_name: "Synthetic Workspace Partner",
      contact_name: "Synthetic Contact",
      contact_role: "Director",
      email: "workspace-partner@example.test",
      phone: "+966500000000",
      country: "SA",
      headquarters_country: "GB",
      city: "Riyadh",
      company_description: "Synthetic partner verification only",
      website_url: "https://example.test",
      service_types: [],
      served_countries: ["SA"],
    },
  });
  partnerRecords.push(partnerId);
  let partner = (
    await rpc(admin, "workspace_list", {
      module: "partners",
      filters: { search: "workspace-partner@example.test" },
    })
  ).items[0];
  assert.equal(partner.headquarters_country, "GB");
  assert.equal(partner.partnership_track, "international");
  assert.ok(
    (
      await reader.client.rpc("workspace_list", {
        module: "partners",
        filters: {},
      })
    ).error,
  );
  for (const status of [
    "under_review",
    "qualifying",
    "final_review",
    "contracting",
  ])
    partner = await rpc(admin, "workspace_update", {
      module: "partners",
      record_id: partnerId,
      expected_updated_at: partner.updated_at,
      patch: { status },
    });
  assert.ok(
    (
      await admin.rpc("workspace_update", {
        module: "partners",
        record_id: partnerId,
        expected_updated_at: partner.updated_at,
        patch: { status: "approved" },
      })
    ).error,
  );
  partner = await rpc(admin, "workspace_update", {
    module: "partners",
    record_id: partnerId,
    expected_updated_at: partner.updated_at,
    patch: {
      status: "approved",
      contract_reference: "LOCAL-QA-CONTRACT",
      country_annex_reference: "LOCAL-QA-ANNEX",
      approval_notice_reference: "LOCAL-QA-NOTICE",
      operational_active: true,
    },
  });
  assert.equal(partner.operational_active, true);
  assert.ok(partner.status_history.length >= 5);
  const partnerEvents = await admin
    .from("admin_intake_events")
    .select("id")
    .eq("module", "partners")
    .eq("record_id", partnerId);
  assert.ifError(partnerEvents.error);
  assert.ok(partnerEvents.data.length >= 6);
  await reader.client.auth.signOut({ scope: "local" });
  const deniedAfterLogout = await fetch(
    "http://localhost:3107/admin/applications",
    { headers: headers(reader.cookies), redirect: "manual" },
  );
  assert.ok([302, 307].includes(deniedAfterLogout.status));
  console.log(
    "PASS: Auth frame isolation; CSP; protected routes; actual submission/reference; freelance/hybrid/SA/zero; private attachment permission; filtering; minimal export; notes; assignment; task completion; immutable audit; notifications; conflict rejection; status transitions; archive/restore; narrow permission enforcement; role escalation denial; international partner qualification/contract/annex/approval; logout.",
  );
} finally {
  if (cvPath)
    assert.ifError(
      (await service.storage.from("application-files").remove([cvPath])).error,
    );
  for (const id of [...records, ...partnerRecords]) {
    assert.match(id, /^[0-9a-f-]{36}$/i);
    execFileSync(
      "docker",
      [
        "exec",
        "supabase_db_nour-intake-local",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-q",
        "-c",
        `delete from public.admin_followups where record_id='${id}';delete from public.admin_intake_events where record_id='${id}';delete from public.job_applications where id='${id}';delete from public.partner_applications where id='${id}';`,
      ],
      { stdio: "pipe" },
    );
  }
  for (const id of createdUsers)
    assert.ifError((await service.auth.admin.deleteUser(id)).error);
  for (const id of createdRoles) {
    assert.match(id, /^[0-9a-f-]{36}$/i);
    execFileSync(
      "docker",
      [
        "exec",
        "supabase_db_nour-intake-local",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-q",
        "-c",
        `delete from public.admin_audit_logs where entity_id='${id}';delete from public.role_permissions where role_id='${id}';delete from public.roles where id='${id}';`,
      ],
      { stdio: "pipe" },
    );
  }
  await admin.auth.signOut({ scope: "local" });
  console.log(
    "Removed only this run’s synthetic users, roles, records, files and follow-ups. No credentials printed.",
  );
}
