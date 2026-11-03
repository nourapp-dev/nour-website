"use client";
import { Component, type ReactNode } from "react";
export default class MapBoundary extends Component<{ language: "ar" | "en"; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    const ar = this.props.language === "ar";
    return <div role="alert">
      <p>{ar ? "تعذر تشغيل الخريطة. يمكنك متابعة اختيار نقطة الانطلاق واستعراض البرامج من القائمة." : "The map could not start. You can still choose an origin and browse programs from the list."}</p>
      <button type="button" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل الصفحة" : "Reload page"}</button>
    </div>;
  }
}
