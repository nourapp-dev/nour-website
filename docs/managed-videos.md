# Managed video showcase

Homepage placement: after featured programs. The section hides when no published homepage videos exist. One featured video appears prominently, followed by up to three other videos. `/videos` offers category/search filtering and incremental display. Native portrait videos retain their full frame. Players mount only after a visitor requests a video; no autoplay is enabled.

## Administration

`/admin/videos` uses existing `website.edit` and `website.publish` permissions. It supports bilingual titles/descriptions/button labels, covers from the media library, category, duration, orientation, sort order, homepage visibility, preview, draft/published/hidden state, one featured homepage video, trash and restoration as draft. Editing a published video requires publishing permission. Concurrent stale edits report a conflict.

Section title, description and visibility use the existing versioned workflow at `/admin/website` → Videos. No existing presentation data is overwritten.

Sources: trusted YouTube/Vimeo links, local site video assets, and MP4/WebM uploads up to 50 MiB. Files upload to the private `videos` bucket. Only published, undeleted video objects can be signed by public visitors; previews require content permissions. Signed playback URLs expire after ten minutes. Already issued URLs can continue working until expiry after a video is hidden. Replaced/abandoned uploads remain private and are not automatically permanently deleted.

Homepage video rows are independent of section drafts: publishing a video affects its publication immediately; editing section copy/visibility requires the normal website draft/publish flow.

## Security and validation

The additive migration `20261109173821_managed_videos.sql` was applied to the website project. It creates the RLS-protected table, private bucket, scoped storage policies, publishing guard and transactional single-featured-video function. No security-definer function or new administrative role is introduced. Existing booking flags are unchanged.

Player sources are normalized to fixed YouTube privacy-enhanced and Vimeo endpoints; arbitrary iframes/HTML are rejected. CSP allows only those additional frame origins. Buttons only link to approved internal routes. Files validate MIME and size before upload, and the bucket enforces both restrictions.

The first campaign video is the owner's existing Nour App cinematic teaser, compressed to 720×1280 H.264/AAC with fast start and stored in the private video bucket. Its poster is a frame from the same video, managed in the existing image library. Campaign media files are not distributed in the source repository. Video bytes are loaded only after opening the player.

Tests cover source validation, upload limits, optimistic edit conflicts, actual migration execution with RLS/roles in isolated PGlite, public/private storage reads, publishing permissions, featured selection, lazy player mounting, close/retry behavior, bilingual UI, and empty/error/filter states. Run `npm run quality`, `npm test`, and `npm run build -- --webpack`.
