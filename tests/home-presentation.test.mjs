import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultPresentation,
  normalizePresentation,
  safeLink,
  safeImage,
  storeLink,
  validatePresentation,
  savePresentation,
  PRESENTATION_KEY,
  DRAFT_KEY,
} from "../src/features/website/presentation.ts";
const config = () => structuredClone(defaultPresentation);
test("empty configuration uses defaults and leaves the hero photo and store links empty", () => {
  const result = normalizePresentation({});
  assert.equal(result.hero.image, "");
  assert.equal(result.download.appStore, "");
  assert.equal(result.showcase.screens.length, 5);
  assert.ok(result.showcase.screens.every((s) => s.preview));
  assert.equal(validatePresentation(result), null);
});
test("explicit empty and hidden screens are preserved without resurrecting defaults", () => {
  const value = config();
  value.showcase.screens = [];
  value.showcase.visible = false;
  value.download.visible = false;
  const result = normalizePresentation(value);
  assert.deepEqual(result.showcase.screens, []);
  assert.equal(result.showcase.visible, false);
  assert.equal(result.download.visible, false);
});
test("screen order, translated labels and preview visibility survive normalization", () => {
  const value = config();
  value.showcase.screens.reverse();
  value.showcase.screens[0].title.en = "Journey";
  value.showcase.screens[0].visible = false;
  value.showcase.screens[1].preview = false;
  const result = normalizePresentation(value);
  assert.equal(result.showcase.screens[0].id, "trip");
  assert.equal(result.showcase.screens[0].title.en, "Journey");
  assert.equal(result.showcase.screens[0].visible, false);
  assert.equal(result.showcase.screens[1].preview, false);
});
test("unsafe links and external image hosts are rejected", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.test",
    "https://user:secret@evil.test",
    "/\\evil.test",
    "https://evil.test/\n",
  ])
    assert.equal(safeLink(url), "");
  assert.equal(safeLink("#programs"), "#programs");
  assert.equal(safeLink("/programs"), "/programs");
  assert.equal(
    safeImage("/images/app-screens/home.png"),
    "/images/app-screens/home.png",
  );
  assert.equal(safeImage("https://evil.test/p.png"), "");
  assert.equal(safeImage("/images/../api/admin/users"), "");
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  try {
    assert.ok(
      safeImage(
        "https://project.supabase.co/storage/v1/object/public/media/website/a.png",
      ),
    );
    assert.equal(
      safeImage(
        "https://project.supabase.co/storage/v1/object/private/media/a.png",
      ),
      "",
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  }
});
test("store links require the matching official store host", () => {
  assert.ok(
    storeLink("https://apps.apple.com/sa/app/example/id123", "appStore"),
  );
  assert.equal(
    storeLink("https://apps.apple.com.evil.test/app/123", "appStore"),
    "",
  );
  assert.equal(
    storeLink("https://play.google.com/store/apps/details?id=x", "appStore"),
    "",
  );
});
test("malformed public configuration is normalized safely", () => {
  for (const value of [
    null,
    [],
    3,
    "invalid",
    { showcase: { screens: [null, 7, {}] } },
  ])
    assert.doesNotThrow(() => normalizePresentation(value));
  const result = normalizePresentation({
    hero: { href: "javascript:alert(1)" },
    showcase: { screens: [] },
  });
  assert.equal(result.hero.href, "");
});
test("saving a draft never writes the published setting; publishing uses a single RPC", async () => {
  const calls = [];
  const client = {
    async rpc(name, args) {
      calls.push({ name, args });
      return { error: null };
    },
  };
  await savePresentation(client, config(), false);
  assert.equal(calls[0].args.p_setting_key, DRAFT_KEY);
  await savePresentation(client, config(), true);
  assert.equal(calls[1].args.p_setting_key, PRESENTATION_KEY);
  assert.equal(calls.length, 2);
  assert.ok(calls.every((c) => c.name === "update_platform_setting"));
});
test("invalid publishing stops before network writes and permission failures propagate", async () => {
  let calls = 0;
  const client = {
    async rpc() {
      calls++;
      return { error: new Error("permission denied") };
    },
  };
  const invalid = config();
  invalid.download.googlePlay = "javascript:alert(1)";
  await assert.rejects(savePresentation(client, invalid, true));
  assert.equal(calls, 0);
  await assert.rejects(
    savePresentation(client, config(), true),
    /permission denied/,
  );
  assert.equal(calls, 1);
});


test("legacy hero settings restore phones while retaining the saved photo", () => {
  const result = normalizePresentation({ hero: { image: "/images/site/front-view.png" } });
  assert.equal(result.hero.mode, "phones");
  assert.equal(result.hero.image, "/images/site/front-view.png");
  assert.equal(result.hero.frontImage, defaultPresentation.hero.frontImage);
  assert.equal(result.hero.backImage, defaultPresentation.hero.backImage);
});

test("both hero modes retain custom phone images and reject unsafe uploads", () => {
  const value = config();
  value.hero.frontImage = "/images/app-screens/packages.png";
  value.hero.backImage = "/images/app-screens/trip.png";
  value.hero.image = "/images/site/front-view.png";
  for (const mode of ["photo", "phones"]) {
    value.hero.mode = mode;
    const result = normalizePresentation(value);
    assert.deepEqual(result.hero, value.hero);
    assert.equal(validatePresentation(result), null);
  }
  value.hero.frontImage = "https://untrusted.example/phone.png";
  assert.ok(validatePresentation(value));
  assert.equal(normalizePresentation(value).hero.frontImage, defaultPresentation.hero.frontImage);
});
