import "../programs/programs-ui.css";
import type { Metadata } from "next";
import GroupTripsClient from "./GroupTripsClient";
export const metadata: Metadata = { title: "رحلات المجموعات | نور آب", description: "جهّز طلب برنامج عمرة لمجموعتك حسب مدينة الانطلاق والمواعيد والخدمات المطلوبة." };
export default function GroupTripsPage() { return <GroupTripsClient/>; }
