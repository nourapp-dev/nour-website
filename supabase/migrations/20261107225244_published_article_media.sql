begin;
create policy published_article_media on public.media for select to anon,authenticated using(deleted_at is null and exists(select 1 from public.articles a where a.cover_media_id=media.id and a.status='published' and a.is_active and a.deleted_at is null and a.published_at<=now()));
notify pgrst,'reload schema';
commit;
