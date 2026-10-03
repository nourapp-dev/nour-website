-- Reuse the existing settings permission checks and public RPC.
-- Draft JSON is never exposed by get_public_platform_settings.
insert into public.platform_settings
(setting_key,setting_group,value_type,value_json,label_ar,label_en,is_public,is_active,sort_order)
values
('website.home_presentation','general','json','{}'::jsonb,'عرض الموقع المنشور','Published website presentation',true,true,900),
('website.home_presentation_draft','general','json','{}'::jsonb,'مسودة عرض الموقع','Website presentation draft',false,true,901)
on conflict (setting_key) do nothing;
