import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  safeVideoLink,
  safeVideoCta,
  validateVideo,
  emptyVideo,
  durationLabel,
} from "../src/features/videos/model.ts";
import {
  resolveVideoSource,
  saveVideo,
  uploadVideo,
} from "../src/features/videos/service.ts";

test("video links normalize only trusted players and local media, never arbitrary embeds", () => {
  assert.deepEqual(safeVideoLink("https://youtu.be/abcdefghijk?autoplay=1"), {
    kind: "embed",
    url: "https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0",
  });
  assert.equal(
    safeVideoLink("https://www.youtube.com/shorts/abcdefghijk").kind,
    "embed",
  );
  assert.equal(
    safeVideoLink("https://vimeo.com/12345").url,
    "https://player.vimeo.com/video/12345?dnt=1",
  );
  assert.deepEqual(safeVideoLink("/videos/nour-teaser.mp4"), {
    kind: "native",
    url: "/videos/nour-teaser.mp4",
  });
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=abcdefghijk",
    "https://evil.test/film.mp4",
    "https://user:pass@youtube.com/watch?v=abcdefghijk",
    "//evil.test/a",
    "/videos/../private.mp4",
    "https://youtu.be/too-short",
  ])
    assert.equal(safeVideoLink(url), null, url);
  assert.equal(safeVideoCta("/programs/demo-one"), true);
  assert.equal(safeVideoCta("//evil.test"), false);
  assert.equal(durationLabel(92), "1:32");
});
test("publication requires a poster and complete bilingual titles; drafts keep a safe source", () => {
  const v = {
    ...emptyVideo(),
    title_ar: "نور آب",
    title_en: "Nour App",
    source_url: "/videos/nour-teaser.mp4",
  };
  assert.doesNotThrow(() => validateVideo(v));
  assert.throws(() => validateVideo({ ...v, status: "published" }), /poster/);
  assert.throws(() => validateVideo({ ...v, title_en: "" }), /titles/);
  assert.throws(
    () =>
      validateVideo({
        ...v,
        source_kind: "file",
        source_url: "",
        storage_path: null,
      }),
    /Upload/,
  );
  assert.doesNotThrow(() =>
    validateVideo({
      ...v,
      status: "published",
      cover_url: "/images/videos/nour-teaser.jpg",
    }),
  );
});
test("private video playback signs only the selected file, while external playback stays normalized", async () => {
  let signed = 0;
  const client = {
    storage: {
      from: (bucket) => {
        assert.equal(bucket, "videos");
        return {
          createSignedUrl: async (path, ttl) => {
            signed++;
            assert.equal(ttl, 600);
            assert.equal(path, "a/video.mp4");
            return { data: { signedUrl: "https://signed.invalid/video" } };
          },
        };
      },
    },
  };
  assert.equal(
    (
      await resolveVideoSource(client, {
        source_kind: "file",
        storage_path: "a/video.mp4",
      })
    ).url,
    "https://signed.invalid/video",
  );
  assert.equal(
    (
      await resolveVideoSource(client, {
        source_kind: "link",
        source_url: "https://youtu.be/abcdefghijk",
      })
    ).kind,
    "embed",
  );
  assert.equal(signed, 1);
  await assert.rejects(
    resolveVideoSource(client, {
      source_kind: "link",
      source_url: "https://bad.test",
    }),
    /Invalid/,
  );
});
test("uploads reject unsupported formats and oversize files before storage calls", async () => {
  let calls = 0;
  const client = {
    storage: {
      from: () => ({
        upload: async () => {
          calls++;
          return { data: {} };
        },
      }),
    },
  };
  await assert.rejects(
    uploadVideo(client, "id", { type: "application/octet-stream", size: 1 }),
    /MP4/,
  );
  await assert.rejects(
    uploadVideo(client, "id", { type: "video/mp4", size: 52428801 }),
    /50MB/,
  );
  assert.equal(calls, 0);
});
test("stale video edits are reported as conflicts instead of false success", async () => {
  const v = {
    ...emptyVideo(),
    title_ar: "فيديو",
    title_en: "Video",
    source_url: "/videos/nour-teaser.mp4",
    updated_at: "old",
  };
  const q = {
    update: () => q,
    eq: () => q,
    is: () => q,
    select: () => q,
    maybeSingle: async () => ({ data: null }),
  };
  await assert.rejects(saveVideo({ from: () => q }, v, true), /refresh/);
});
test("video database guards and RLS preserve drafts, require publishers and isolate private uploads", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;
 create schema auth;create schema storage;create schema catalogue_private;
 create table auth.users(id uuid primary key);
 insert into auth.users values ('00000000-0000-0000-0000-000000000001');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function public.current_user_has_permission(code text) returns boolean language sql stable as $$select coalesce(code=any(string_to_array(current_setting('test.permissions',true),',')),false)$$;
 grant usage on schema public,auth,storage,catalogue_private to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
 alter table storage.objects enable row level security;grant select on storage.objects to anon,authenticated;grant insert on storage.objects to authenticated;`);
    await db.exec(
      readFileSync(
        new URL(
          "../supabase/migrations/20261109173821_managed_videos.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const a = "10000000-0000-0000-0000-000000000001",
      b = "10000000-0000-0000-0000-000000000002",
      c = "10000000-0000-0000-0000-000000000003",
      d = "10000000-0000-0000-0000-000000000004";
    await db.query(
      `insert into videos(id,title_ar,title_en,source_url,cover_url,status) values ($1,'نور','Nour','/videos/nour-teaser.mp4','/images/videos/nour-teaser.jpg','published'),($2,'مسودة','Draft','/videos/nour-teaser.mp4','/images/videos/nour-teaser.jpg','draft')`,
      [a, b],
    );
    await db.query(
      `insert into videos(id,title_ar,title_en,source_kind,storage_path,cover_url,status) values ($1,'ملف','File','file','public/movie.mp4','/images/videos/nour-teaser.jpg','published'),($2,'خاص','Private','file','draft/movie.mp4','/images/videos/nour-teaser.jpg','draft')`,
      [c, d],
    );
    await db.exec(
      `insert into storage.objects(bucket_id,name) values ('videos','public/movie.mp4'),('videos','draft/movie.mp4');set role anon;`,
    );
    assert.deepEqual(
      (await db.query("select id from videos order by id")).rows.map(
        (r) => r.id,
      ),
      [a, c],
    );
    assert.deepEqual(
      (
        await db.query("select name from storage.objects order by name")
      ).rows.map((r) => r.name),
      ["public/movie.mp4"],
    );
    await assert.rejects(
      db.query("update videos set title_ar='اختراق' where id=$1", [a]),
      /permission denied/i,
    );
    await db.exec(
      `reset role;set test.uid='00000000-0000-0000-0000-000000000001';set test.permissions='website.edit';set role authenticated;`,
    );
    assert.equal((await db.query("select id from videos")).rows.length, 4);
    await db.query("update videos set title_ar='مسودة معدلة' where id=$1", [b]);
    await assert.rejects(
      db.query("update videos set status='published' where id=$1", [b]),
      /video_publish_permission_required/,
    );
    await assert.rejects(
      db.query("update videos set title_ar='تعديل منشور' where id=$1", [a]),
      /video_publish_permission_required/,
    );
    await assert.rejects(
      db.query("select set_featured_video($1)", [a]),
      /permission_denied/,
    );
    await db.exec("set test.permissions='website.edit,website.publish'");
    await db.query("select set_featured_video($1)", [a]);
    await db.query("select set_featured_video($1)", [c]);
    assert.deepEqual(
      (await db.query("select id from videos where is_featured")).rows.map(
        (r) => r.id,
      ),
      [c],
    );
    await db.query("update videos set status='hidden' where id=$1", [c]);
    assert.equal(
      (await db.query("select id from videos where is_featured")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("update videos set source_url='https://evil.test' where id=$1", [
        b,
      ]),
      /invalid_video_source/,
    );
    await assert.rejects(
      db.query(
        "update videos set source_kind='file',source_url='',storage_path=null where id=$1",
        [b],
      ),
      /check constraint/i,
    );
    await assert.rejects(
      db.query(
        "update videos set cover_url='javascript:alert(1)' where id=$1",
        [b],
      ),
      /invalid_video_cover/,
    );
    await db.exec("reset role;set role anon");
    assert.deepEqual(
      (await db.query("select id from videos")).rows.map((r) => r.id),
      [a],
    );
    assert.equal(
      (await db.query("select name from storage.objects")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
