# Managed homepage presentation

## Editor

`/admin/website` (Website & App Showcase in the sidebar) manages the hero, app showcase and download section. It requires the existing `settings.read` permission to load and `settings.manage` to save/publish; image upload uses `media.upload`. Existing server-side RPC permission checks and media RLS are retained.

- Hero: bilingual heading, description, eyebrow, optional image/alt text and informational link. Empty photo uses a Nour brand gradient/geometry treatment. Program search and booking notices retain their existing catalog and booking configuration.
- Showcase: one upright phone with uncropped portrait images, bilingual named tabs, optional illustrative-data label, keyboard navigation and horizontal swipe. Add up to eight screens, reorder, replace, hide or remove them. Removing a screen only removes its configuration; it does not delete the media file. No timer changes a screen while someone is reading it. Hiding every screen hides the section.
- Download: bilingual title/description, visibility, and official store links. Empty links render Coming soon. An optional QR code is generated locally for the first configured store (App Store, Google Play, then AppGallery). Hero and download areas contain no phone mockups.

Preview uses the same components inside an adjustable-width container, with Arabic/English switching. Save draft updates `website.home_presentation_draft`; Publish changes updates `website.home_presentation` in one existing RPC call. The newer draft is loaded on returning to the editor. The generic settings page excludes these keys to avoid exposing a second raw JSON editor. Media uploads continue to use the existing public media bucket; draft privacy applies to presentation configuration, not the underlying image URLs.

The provider refreshes published settings on new page loads and after publication in the editor; previously open visitor tabs may need reloading. No programs, departures or bookings are created by this editor. Existing screenshots are marked as an app preview with illustrative data until replaced.

## Migration and verification

`20261003170200_managed_home_presentation.sql` adds two configuration rows without overwriting existing values or changing permissions/functions. Applied to the connected website project on 2026-10-03. Anonymous RPC verification returned only the published key; draft is `is_public=false`. Do not replay historical migrations.

Tests cover normalizing missing/malformed content, preserving hidden/empty arrays and order, blocking unsafe links/unapproved image origins, validating official store hosts, separate draft/publication writes, and interactive tab/keyboard/swipe behavior. Typecheck and lint run through `npm run quality`; production is verified with `npm run build -- --webpack` and GitHub CI. Browser visual QA and live admin upload/publish acceptance are still required: this environment's browser blocks localhost. No live admin account or sample content was created for testing.

Hostinger deployment remains manual per the existing runbook. Merging code does not deploy it there. The hero photo can be uploaded later without another code deployment.


## Hero display modes

The hero defaults to the original two-phone design, including when existing settings have no `hero.mode`. The editor supports `phones` and `photo`, independent front/back phone mockups and bilingual alt text. Switching modes preserves all saved images. Phone uploads should include the device frame and a transparent background; clearing one restores its original asset. Use the existing draft/preview/publish controls to review and publish changes. Photo mode continues to use the saved hero photo.
