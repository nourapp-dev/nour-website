import { notFound } from "next/navigation";
import PreviewControls from "./PreviewControls";
export const dynamic = "force-dynamic";
export const metadata = { title: "Local UI review", robots: { index: false, follow: false } };
export default function UiPreview() {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_UI_PREVIEW !== "true") notFound();
  return <PreviewControls />;
}
