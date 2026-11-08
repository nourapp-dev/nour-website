import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React, { act } from "react";
import { JSDOM } from "jsdom";
const repo = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
test("dialog focus stays inside on Tab and Escape restores focus to its opener", async () => {
  const dom = new JSDOM(
    '<button id="opener">Open</button><div id="root"></div>',
    { url: "http://localhost:3107/admin/applications" },
  );
  const old = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const { createRoot } = await import("react-dom/client");
  const load = loader();
  const { useModalFocus } = load(
    resolve(repo, "src/features/admin-workspace/useModalFocus.ts"),
  );
  function Dialog() {
    const [open, setOpen] = React.useState(true);
    const ref = React.useRef(null);
    useModalFocus(open, ref, () => setOpen(false));
    return open
      ? React.createElement(
          "section",
          { ref, tabIndex: -1 },
          React.createElement("button", { id: "first" }, "First"),
          React.createElement("button", { id: "last" }, "Last"),
        )
      : null;
  }
  const opener = document.getElementById("opener");
  opener.focus();
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => root.render(React.createElement(Dialog)));
    assert.equal(document.activeElement.id, "first");
    document.getElementById("last").focus();
    await act(async () =>
      document.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          key: "Tab",
          cancelable: true,
          bubbles: true,
        }),
      ),
    );
    assert.equal(document.activeElement.id, "first");
    await act(async () =>
      document.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          cancelable: true,
          bubbles: true,
        }),
      ),
    );
    assert.equal(document.activeElement.id, "last");
    await act(async () =>
      document.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          key: "Escape",
          cancelable: true,
          bubbles: true,
        }),
      ),
    );
    assert.equal(document.activeElement.id, "opener");
    assert.equal(document.getElementById("first"), null);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, {
      window: old.window,
      document: old.document,
      IS_REACT_ACT_ENVIRONMENT: old.act,
    });
  }
});
test("detail view shows preference/zero/country/reference, isolates phone direction, and denies attachment/edit controls to a reader", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost:3107/admin/applications/id",
  });
  const old = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const { createRoot } = await import("react-dom/client");
  const row = {
    id: "00000000-0000-4000-8000-000000000001",
    full_name: "Synthetic Details",
    email: "fixture@example.test",
    phone: "+966500000000",
    country: "SA",
    city: "Riyadh",
    application_kind: "talent_pool",
    career_area: "technology_product",
    opportunity_type: "freelance",
    employment_type: "other",
    work_mode: "hybrid",
    years_of_experience: 0,
    status: "new",
    assigned_to: null,
    internal_notes: null,
    cv_path: "job-applications/fixture/cv.pdf",
    privacy_accepted: true,
    created_at: "2026-11-07T00:00:00Z",
    updated_at: "2026-11-07T00:00:00Z",
    deleted_at: null,
  };
  const load = loader({
    "next/link": {
      __esModule: true,
      default: ({ children, ...props }) =>
        React.createElement("a", props, children),
    },
    "@tanstack/react-query": {
      useQuery: (options) => ({
        isPending: false,
        isError: false,
        data: options.queryKey.includes("record") ? row : [],
        refetch: () => {},
      }),
      useQueryClient: () => ({
        invalidateQueries: async () => {},
        setQueryData: () => {},
      }),
    },
    "../../core/i18n": { useLanguage: () => ({ language: "ar" }) },
    "../../core/notifications": { useToast: () => ({ showToast: () => {} }) },
    "./WorkspaceProvider": {
      useWorkspace: () => ({
        id: "reader",
        name: "Reader",
        superAdmin: false,
        permissions: ["applications.view"],
      }),
      can: (_identity, _module, action = "view") => action === "view",
    },
    "./RecordFollowups": { __esModule: true, default: () => null },
    "../../lib/supabase/client": { createClient: () => ({}) },
  });
  const Detail = load(
    resolve(repo, "src/features/admin-workspace/IntakeDetail.tsx"),
  ).default;
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () =>
      root.render(
        React.createElement(Detail, { module: "applications", id: row.id }),
      ),
    );
    assert.match(document.body.textContent, /عمل مستقل/);
    assert.match(document.body.textContent, /هجين/);
    assert.match(document.body.textContent, /السعودية/);
    assert.match(document.body.textContent, /يلزم إذن الاطلاع/);
    const phone = [...document.querySelectorAll("bdi")].find(
      (element) => element.textContent === row.phone,
    );
    assert.ok(phone);
    assert.equal(phone.dir, "ltr");
    const years = [...document.querySelectorAll(".aw-detail-grid dt")].find(
      (element) => element.textContent === "سنوات الخبرة",
    );
    assert.equal(years.nextElementSibling.textContent, "0");
    assert.equal(document.querySelector("textarea").disabled, true);
    assert.ok(document.body.textContent.includes(row.id));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, {
      window: old.window,
      document: old.document,
      IS_REACT_ACT_ENVIRONMENT: old.act,
    });
  }
});
test("protected workspace renders no private children while session verification is pending", () => {
  const { renderToStaticMarkup } = require("react-dom/server");
  const load = loader({
    "@tanstack/react-query": {
      useQuery: () => ({ isPending: true }),
      useQueryClient: () => ({}),
    },
    "../../core/i18n": { useLanguage: () => ({ language: "en" }) },
    "../../lib/supabase/client": { createClient: () => ({}) },
  });
  const Provider = load(
    resolve(repo, "src/features/admin-workspace/WorkspaceProvider.tsx"),
  ).WorkspaceProvider;
  const html = renderToStaticMarkup(
    React.createElement(
      Provider,
      null,
      React.createElement("div", null, "PRIVATE ADMIN DATA"),
    ),
  );
  assert.match(html, /Verifying your admin session/);
  assert.ok(!html.includes("PRIVATE ADMIN DATA"));
});
test("login supports password visibility, autocomplete, a submission lock, safe network errors and intended destination", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost:3107/admin/login?next=%2Fadmin%2Fapplications%3Fstatus%3Dnew",
  });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const { createRoot } = await import("react-dom/client");
  let calls = 0,
    finish,
    replaced = "";
  const load = loader({
    "next/image": {
      __esModule: true,
      default: (props) =>
        React.createElement("img", { src: props.src, alt: props.alt }),
    },
    "next/navigation": {
      useSearchParams: () => new URLSearchParams(window.location.search),
      useRouter: () => ({
        replace: (url) => {
          replaced = url;
        },
        refresh: () => {},
      }),
    },
    "../../../src/core/i18n": {
      useLanguage: () => ({ language: "en", toggleLanguage: () => {} }),
    },
    "../../../src/core/theme": { useTheme: () => ({ toggleTheme: () => {} }) },
    "../../../src/lib/supabase/client": { createClient: () => ({}) },
    "../../../src/features/auth/services/auth.service": {
      signInAdmin: async () => {
        calls++;
        return new Promise((resolve, reject) => {
          finish = { resolve, reject };
        });
      },
    },
  });
  const Page = load(resolve(repo, "app/admin/login/page.tsx")).default;
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => root.render(React.createElement(Page)));
    const email = document.querySelector("[name=email]"),
      password = document.querySelector("[name=password]");
    assert.equal(email.autocomplete, "username");
    assert.equal(password.autocomplete, "current-password");
    const input = async (field, value) =>
      act(async () => {
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        ).set.call(field, value);
        field.dispatchEvent(new window.Event("input", { bubbles: true }));
      });
    await input(email, "synthetic@example.test");
    await input(password, "synthetic-password");
    const toggle = document.querySelector('[aria-label="Show password"]');
    await act(async () => toggle.click());
    assert.equal(password.type, "text");
    assert.equal(toggle.getAttribute("aria-pressed"), "true");
    const form = document.querySelector("form");
    await act(async () => {
      form.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
      form.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    assert.equal(calls, 1);
    assert.equal(document.querySelector("button[type=submit]").disabled, true);
    await act(async () =>
      finish.reject(
        new Error("Failed to fetch: private implementation detail"),
      ),
    );
    assert.match(
      document.querySelector("[role=alert]").textContent,
      /Unable to connect/,
    );
    assert.ok(
      !document.body.textContent.includes("private implementation detail"),
    );
    assert.equal(password.value, "synthetic-password");
    await act(async () =>
      form.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
    await act(async () => finish.resolve({}));
    assert.equal(calls, 2);
    assert.equal(password.value, "");
    assert.equal(replaced, "/admin/applications?status=new");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, {
      window: previous.window,
      document: previous.document,
      IS_REACT_ACT_ENVIRONMENT: previous.act,
    });
  }
});
function loader(mocks = {}) {
  const cache = new Map();
  return function load(file) {
    const path = [file, file + ".ts", file + ".tsx", file + ".json"].find(
      existsSync,
    );
    if (!path) throw new Error(file);
    if (path.endsWith(".json")) return JSON.parse(readFileSync(path, "utf8"));
    if (cache.has(path)) return cache.get(path).exports;
    const mod = { exports: {} };
    cache.set(path, mod);
    const code = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(code, {
      module: mod,
      exports: mod.exports,
      window: globalThis.window,
      document: globalThis.document,
      URL,
      URLSearchParams,
      File: globalThis.File,
      require: (name) => {
        if (name in mocks) return mocks[name];
        if (name.startsWith(".")) return load(resolve(dirname(path), name));
        return require(name);
      },
    });
    return mod.exports;
  };
}
test("admin contracts preserve freelance, legacy values, zero, translated countries and Riyadh dates", () => {
  const load = loader();
  const c = load(resolve(repo, "src/features/admin-workspace/contracts.ts"));
  assert.equal(
    c.opportunity(
      { opportunity_type: "freelance", employment_type: "other" },
      "ar",
    ),
    "عمل مستقل",
  );
  assert.equal(c.opportunity({ employment_type: "other" }, "en"), "Other");
  assert.equal(c.label(0, "ar"), "0");
  assert.match(
    c.countryName("SA", "ar"),
    /\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629/,
  );
  assert.equal(c.countryName("ZZ", "en"), "ZZ");
  assert.equal(c.label("unrecognized_value", "en"), "unrecognized_value");
  assert.equal(
    c.statusLabel(
      { status: "approved", application_kind: "talent_pool" },
      "en",
    ),
    "Suitable for an opportunity",
  );
  assert.equal(
    c.statusLabel({ status: "approved" }, "en"),
    "Approved — legacy",
  );
  assert.equal(
    c.statusLabel({ status: "approved", partner_type: "other" }, "en"),
    "Approved partner",
  );
  assert.ok(c.dateLabel("2026-11-07T00:00:00Z", "en").includes("03:00"));
  for (const value of [
    "https://outside.test",
    "//outside.test",
    "/admin/login",
    "/account/profile",
    "/admin/%2e%2e/login",
    "/admin/\\evil",
    "/admin/%E0%A4%A",
  ])
    assert.equal(c.safeAdminNext(value), "/admin/dashboard");
  assert.equal(
    c.safeAdminNext("/admin/applications?status=new"),
    "/admin/applications?status=new",
  );
});
test("navigation and filters use actual permissions and keep sensitive search outside URL state", () => {
  const load = loader({
    "../../../lib/supabase/client": {},
    "../../lib/supabase/client": {},
  });
  const nav = load(resolve(repo, "src/features/admin-workspace/navigation.ts"));
  assert.equal(nav.routePermission("/admin/website"), "website");
  assert.equal(nav.routePermission("/admin/cities"), "countries");
  assert.equal(nav.mayView("applications", ["applications.view"]), true);
  assert.equal(nav.mayView("partners", ["applications.view"]), false);
  const d = load(resolve(repo, "src/features/admin-workspace/data.ts"));
  const f = d.filtersFrom(
    new URLSearchParams("page=-2&status=new&search=private@example.test"),
  );
  assert.equal(f.page, "1");
  assert.equal(f.status, "new");
  assert.equal(f.search, undefined);
  assert.equal(
    d.nextStatuses({ status: "new" }, "applications").includes("approved"),
    false,
  );
  assert.ok(
    d
      .nextStatuses({ status: "under_review" }, "applications")
      .includes("approved"),
  );
  assert.match(
    d.errorText({ message: "edit_conflict", code: "PT409" }, false),
    /Another person/,
  );
});
test("intake list renders accurate data and direction, synchronizes filters, and exposes direct detail routes", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost:3107/admin/applications",
  });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const { createRoot } = await import("react-dom/client");
  let replaced = "";
  let language = "ar";
  let filters = new URLSearchParams();
  const row = {
    id: "00000000-0000-4000-8000-000000000001",
    full_name: "Synthetic Applicant",
    country: "SA",
    opportunity_type: "freelance",
    employment_type: "other",
    work_mode: "hybrid",
    years_of_experience: 0,
    status: "new",
    created_at: "2026-11-07T00:00:00Z",
  };
  const identity = { id: "admin", superAdmin: true, permissions: [] };
  const load = loader({
    "next/link": {
      __esModule: true,
      default: ({ children, ...props }) =>
        React.createElement("a", props, children),
    },
    "next/navigation": {
      usePathname: () => "/admin/applications",
      useRouter: () => ({
        replace: (value) => {
          replaced = value;
        },
      }),
      useSearchParams: () => filters,
    },
    "@tanstack/react-query": {
      useQueryClient: () => ({
        getQueryData: () => undefined,
        setQueryData: () => {},
      }),
      useQuery: () => ({
        data: { items: [row], total: 21 },
        isSuccess: true,
        isPending: false,
        isError: false,
        isFetching: false,
        refetch: () => {},
      }),
    },
    "../../core/i18n": { useLanguage: () => ({ language }) },
    "./WorkspaceProvider": { useWorkspace: () => identity, can: () => true },
    "./IntakeDetail": { __esModule: true, default: () => null },
    "../../lib/supabase/client": { createClient: () => ({}) },
  });
  const List = load(
    resolve(repo, "src/features/admin-workspace/IntakeList.tsx"),
  ).default;
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () =>
      root.render(React.createElement(List, { module: "applications" })),
    );
    assert.match(document.body.textContent, /عمل مستقل/);
    assert.match(document.body.textContent, /هجين/);
    assert.match(document.body.textContent, /السعودية/);
    assert.equal(document.querySelector(".aw-reference").textContent, row.id);
    assert.ok(
      document.querySelector(`a[href^="/admin/applications/${row.id}"]`),
    );
    const selects = [...document.querySelectorAll("select")];
    await act(async () => {
      selects[0].value = "under_review";
      selects[0].dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    assert.match(replaced, /status=under_review/);
    assert.match(replaced, /page=1/);
    assert.ok(!replaced.includes("Synthetic"));
    language = "en";
    filters = new URLSearchParams("page=2&status=under_review");
    await act(async () =>
      root.render(React.createElement(List, { module: "applications" })),
    );
    assert.match(document.body.textContent, /Freelance/);
    assert.match(document.body.textContent, /Hybrid/);
    assert.match(document.body.textContent, /Saudi Arabia/);
    const next = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "Next",
    );
    assert.equal(next.disabled, true);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, {
      window: previous.window,
      document: previous.document,
      IS_REACT_ACT_ENVIRONMENT: previous.act,
    });
  }
});
