"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { validCoordinates } from "../../features/journeys/coordinates";
const GeographicMap = dynamic(() => import("./GeographicMap"), { ssr: false });
export default function CoordinatePicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lon: number) => void;
}) {
  const points = useMemo(
    () =>
      validCoordinates(latitude, longitude)
        ? [
            {
              id: "pin",
              name: "الموقع / Location",
              latitude: Number(latitude),
              longitude: Number(longitude),
            },
          ]
        : [],
    [latitude, longitude],
  );
  return (
    <div>
      <p>
        اضغط على الخريطة أو اسحب الدبوس لتحديد الموقع. / Click or drag to set
        location.
      </p>
      <div style={{ height: 280 }}>
        <GeographicMap
          points={points}
          selectedId="pin"
          onPosition={onChange}
          label="معاينة الإحداثيات"
        />
      </div>
    </div>
  );
}
