> Historical reference / مرجع تاريخي: this document describes its stated audit/schema date, not the current deployed state. No live re-audit or schema verification was performed on 2026-11-03. See [release readiness](release-readiness.md) and [database documentation](Database.md).

NourApp Platform — Database ER Diagram

Document version: 0.1Release: 1.0 — FoundationMilestone: AlphaStatus: Draft for reviewLast updated: 2026-07-24

1. Foundation ER Diagram

erDiagram
    AUTH_USERS ||--|| ADMIN_PROFILES : "has profile"

    ADMIN_PROFILES ||--o{ ADMIN_PROFILE_ROLES : "assigned"
    ROLES ||--o{ ADMIN_PROFILE_ROLES : "contains"

    ROLES ||--o{ ROLE_PERMISSIONS : "grants"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "included"

    ADMIN_PROFILES ||--o{ MEDIA : "uploads"
    ADMIN_PROFILES ||--o{ FEATURE_FLAGS : "updates"
    ADMIN_PROFILES ||--o{ SITE_SETTINGS : "updates"
    ADMIN_PROFILES ||--o{ AUDIT_LOGS : "performs"

    MEDIA ||--o{ ADMIN_PROFILES : "avatar"
    MEDIA ||--o{ COUNTRIES : "flag"

    COUNTRIES ||--o{ PROGRAMS : "source market"
    PROGRAM_CATEGORIES ||--o{ PROGRAMS : "classifies"

    PROGRAMS ||--o{ PROGRAM_IMAGES : "has"
    MEDIA ||--o{ PROGRAM_IMAGES : "used by"

    PROGRAMS ||--o{ PROGRAM_INCLUSIONS : "includes"
    PROGRAMS ||--o{ PROGRAM_EXCLUSIONS : "excludes"
    PROGRAMS ||--o{ PROGRAM_ITINERARY_DAYS : "contains"

    PROGRAMS ||--o{ PROGRAM_COUNTRY_AVAILABILITY : "available in"
    COUNTRIES ||--o{ PROGRAM_COUNTRY_AVAILABILITY : "supports"

2. Approved Decisions

Staff members may have multiple roles.

Arabic and English are supported in Release 1.0.

Interactive-map coordinates use percentages from 0 to 100.

One authorized administrator may publish content.

Media can be reused across multiple records.

UUID is used for all primary identifiers.

Soft deletion is the default for business and content records.

Public content must be active, published, and not deleted.

3. Core Identity Tables

admin_profiles

id uuid PK = auth.users.id
full_name text
email text
avatar_media_id uuid FK -> media.id
status text
last_login_at timestamptz
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz

roles

id uuid PK
key text UNIQUE
name_ar text
name_en text
description_ar text
description_en text
is_system boolean
created_at timestamptz
updated_at timestamptz

Initial role keys:

super_admin
admin
content_manager
operations_manager
viewer

permissions

id uuid PK
key text UNIQUE
module text
action text
name_ar text
name_en text
description_ar text
description_en text
created_at timestamptz
updated_at timestamptz

admin_profile_roles

id uuid PK
admin_profile_id uuid FK
role_id uuid FK
assigned_by uuid FK -> admin_profiles.id
created_at timestamptz
UNIQUE(admin_profile_id, role_id)

role_permissions

id uuid PK
role_id uuid FK
permission_id uuid FK
created_at timestamptz
UNIQUE(role_id, permission_id)

4. Foundation Content Tables

media

id uuid PK
bucket text
path text
file_name text
mime_type text
size_bytes bigint
width integer
height integer
alt_ar text
alt_en text
uploaded_by uuid FK -> admin_profiles.id
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz
UNIQUE(bucket, path)

site_settings

id uuid PK
key text UNIQUE
value_json jsonb
group_key text
is_public boolean
updated_by uuid FK -> admin_profiles.id
created_at timestamptz
updated_at timestamptz

feature_flags

id uuid PK
key text UNIQUE
name_ar text
name_en text
description_ar text
description_en text
is_enabled boolean
environment text
updated_by uuid FK -> admin_profiles.id
created_at timestamptz
updated_at timestamptz

audit_logs

id uuid PK
actor_id uuid FK -> admin_profiles.id
action text
entity_type text
entity_id uuid
old_data jsonb
new_data jsonb
ip_address inet
user_agent text
created_at timestamptz

5. Countries and Map

countries

id uuid PK
code text UNIQUE
name_ar text
name_en text
slug text UNIQUE
title_ar text
title_en text
description_ar text
description_en text
flag_media_id uuid FK -> media.id
map_x numeric CHECK 0..100
map_y numeric CHECK 0..100
marker_tone text
is_destination boolean
is_active boolean
publication_status text
sort_order integer
published_at timestamptz
published_by uuid FK -> admin_profiles.id
created_by uuid FK -> admin_profiles.id
updated_by uuid FK -> admin_profiles.id
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz

Public visibility:

publication_status = published
AND is_active = true
AND deleted_at IS NULL

6. Programs

program_categories

id uuid PK
key text UNIQUE
name_ar text
name_en text
description_ar text
description_en text
is_active boolean
sort_order integer
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz

programs

id uuid PK
country_id uuid FK -> countries.id
category_id uuid FK -> program_categories.id
slug text UNIQUE
name_ar text
name_en text
summary_ar text
summary_en text
description_ar text
description_en text
base_price numeric
currency_code char(3)
duration_days integer
duration_nights integer
is_featured boolean
is_active boolean
publication_status text
sort_order integer
published_at timestamptz
published_by uuid FK -> admin_profiles.id
created_by uuid FK -> admin_profiles.id
updated_by uuid FK -> admin_profiles.id
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz

program_images

id uuid PK
program_id uuid FK
media_id uuid FK
is_cover boolean
sort_order integer
created_at timestamptz

program_inclusions

id uuid PK
program_id uuid FK
title_ar text
title_en text
sort_order integer
created_at timestamptz
updated_at timestamptz

program_exclusions

id uuid PK
program_id uuid FK
title_ar text
title_en text
sort_order integer
created_at timestamptz
updated_at timestamptz

program_itinerary_days

id uuid PK
program_id uuid FK
day_number integer
title_ar text
title_en text
description_ar text
description_en text
created_at timestamptz
updated_at timestamptz
UNIQUE(program_id, day_number)

program_country_availability

id uuid PK
program_id uuid FK
country_id uuid FK
is_active boolean
created_at timestamptz
updated_at timestamptz
UNIQUE(program_id, country_id)

7. Migration Order

001_foundation_identity_and_access
002_media_settings_and_feature_flags
003_audit_logging
004_countries_and_world_map
005_program_categories_and_programs
006_program_content_and_availability

Each migration must include:

Tables

Foreign keys

Constraints

Indexes

Triggers

RLS enablement

Initial policies

Seed records where required