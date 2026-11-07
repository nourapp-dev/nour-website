import { Suspense } from "react";
import LocationManager from "../../../src/features/countries/LocationManager";
export default function CitiesPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <LocationManager />
    </Suspense>
  );
}
