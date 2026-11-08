"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { useLanguage } from "../../core/i18n";
export default function CountryRelations({ countryId }: { countryId: string }) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const query = useQuery({
    queryKey: ["admin", "country-relation-counts"],
    queryFn: async () => {
      const r = await createClient("admin").rpc("catalogue_country_counts");
      if (r.error) throw r.error;
      return r.data as {
        country_id: string;
        cities: number;
        published_programs: number;
      }[];
    },
    retry: false,
  });
  const row = query.data?.find((item) => item.country_id === countryId);
  return (
    <div className="aw-muted">
      {query.isPending ? (
        <span>{ar ? "تحميل الارتباطات…" : "Loading links…"}</span>
      ) : query.isError ? (
        <span>
          {ar ? "تعذر تحميل أعداد الارتباطات" : "Linked counts unavailable"}{" "}
          <button onClick={() => void query.refetch()}>
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </span>
      ) : (
        <>
          <Link href={`/admin/cities?country=${countryId}`}>
            {ar ? "مدن منشورة" : "Published cities"}:{" "}
            {new Intl.NumberFormat(language).format(row?.cities ?? 0)}
          </Link>{" "}
          ·{" "}
          <Link href={`/admin/programs?country=${countryId}`}>
            {ar ? "برامج منشورة" : "Published programs"}:{" "}
            {new Intl.NumberFormat(language).format(
              row?.published_programs ?? 0,
            )}
          </Link>
        </>
      )}
    </div>
  );
}
