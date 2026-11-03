import { notFound } from "next/navigation";
import BeforeHome from "./BeforeHome";
export const dynamic = "force-dynamic";
export const metadata = { title: "Before restoration — local comparison only", robots: { index: false, follow: false } };
export default function BeforePage() {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_UI_PREVIEW !== "true") notFound();
  return <BeforeHome />;
}
