import { redirect } from "next/navigation";
import { createClient } from "../../../../src/server/supabase/session";
import PreviewHome from "../../../../src/features/website/PreviewHome";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = {
  title: "معاينة خاصة | Private preview",
  robots: { index: false, follow: false },
};
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string;page?:string }>;
}) {
  const params = await searchParams;
  const client = await createClient("admin");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data, error } = await client.rpc("website_content_state");
  if (error)
    return (
      <p role="alert">
        تعذر تحميل المعاينة أو لا تملك صلاحيتها / Preview unavailable or
        permission denied.
      </p>
    );
  return (
    <>
      <p role="note">
        معاينة المسودة المحفوظة — غير منشورة / Saved draft preview — unpublished
      </p>
      <PreviewHome
        page={params.page}
        theme={params.theme}
        value={data["website.home_presentation_draft"]?.value}
      />
    </>
  );
}
