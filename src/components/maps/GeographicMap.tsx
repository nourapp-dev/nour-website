"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { validCoordinates } from "../../features/journeys/coordinates";

export type MapPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  available?: boolean;
  destination?: boolean;
};
type Props = {
  points: MapPoint[];
  selectedId?: string | null;
  mode?: "saudi" | "world";
  onSelect?: (id: string) => void;
  onPosition?: (latitude: number, longitude: number) => void;
  route?: boolean;
  label: string;
};
export default function GeographicMap({
  points,
  selectedId,
  mode = "saudi",
  onSelect,
  onPosition,
  route = false,
  label,
}: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const callbacks = useRef({ onSelect, onPosition });
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    callbacks.current = { onSelect, onPosition };
  }, [onSelect, onPosition]);
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    void import("leaflet")
      .then((L) => {
        if (disposed || !element.current) return;
        const instance = L.map(element.current, {
          scrollWheelZoom: false,
          minZoom: 2,
          maxZoom: 18,
          worldCopyJump: true,
        }).setView([24, 44], 5);
        map.current = instance;
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
          .on("tileerror", () => {
            if (!disposed) setTileError(true);
          })
          .addTo(instance);
        instance.on("click", (event: Leaflet.LeafletMouseEvent) =>
          callbacks.current.onPosition?.(
            Number(event.latlng.lat.toFixed(6)),
            Number(event.latlng.lng.toFixed(6)),
          ),
        );
        resize = new ResizeObserver(() => instance.invalidateSize());
        resize.observe(element.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setTileError(true);
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    let disposed = false;
    let layer: Leaflet.LayerGroup | undefined;
    void import("leaflet").then((L) => {
      if (disposed || !map.current) return;
      layer = L.layerGroup().addTo(map.current);
      const valid = points.filter((p) =>
        validCoordinates(p.latitude, p.longitude),
      );
      valid.forEach((point) => {
        const name = document.createElement("span");
        name.textContent = point.name;
        const active = point.id === selectedId;
        const icon = L.divIcon({
          className: "nour-geo-marker",
          html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${point.destination || active ? "#ffc313" : point.available ? "#176fe8" : "#64748b"};border:3px solid white;box-shadow:0 2px 9px #102b4580"></span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const marker = L.marker([point.latitude, point.longitude], {
          icon,
          title: point.name,
          alt: point.name,
          draggable: Boolean(callbacks.current.onPosition),
        })
          .addTo(layer!)
          .bindTooltip(name, {
            permanent: point.destination || active,
            direction: "top",
          });
        marker.on("click", () => callbacks.current.onSelect?.(point.id));
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          callbacks.current.onPosition?.(
            Number(p.lat.toFixed(6)),
            Number(p.lng.toFixed(6)),
          );
        });
      });
      const from = valid.find((p) => p.id === selectedId),
        to = valid.find((p) => p.destination);
      if (route && from && to && from.id !== to.id)
        L.polyline(
          [
            [from.latitude, from.longitude],
            [to.latitude, to.longitude],
          ],
          { color: "#d69800", weight: 3, dashArray: "7 8" },
        ).addTo(layer);
      if (from) {
        if (route && to)
          map.current.fitBounds(
            [
              [from.latitude, from.longitude],
              [to.latitude, to.longitude],
            ],
            { padding: [48, 48], maxZoom: 7, animate: false },
          );
        else
          map.current.setView(
            [from.latitude, from.longitude],
            callbacks.current.onPosition ? map.current.getZoom() : 5,
            { animate: false },
          );
      } else
        map.current.setView(
          mode === "saudi" ? [24, 44] : [22, 20],
          mode === "saudi" ? 5 : 2,
          { animate: false },
        );
    });
    return () => {
      disposed = true;
      layer?.remove();
    };
  }, [ready, points, selectedId, mode, route]);
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        minHeight: 260,
        isolation: "isolate",
      }}
    >
      <div
        ref={element}
        aria-label={label}
        style={{ height: "100%", minHeight: 260, borderRadius: 18 }}
      />
      {tileError ? (
        <p
          role="status"
          style={{
            position: "absolute",
            bottom: 28,
            left: 10,
            right: 10,
            zIndex: 1000,
            background: "#fff",
            color: "#263b52",
            padding: 8,
            borderRadius: 8,
          }}
        >
          تعذر تحميل بعض أجزاء الخريطة. يمكنك استخدام قائمة المواقع أدناه. / Map
          tiles unavailable; use the location list.
        </p>
      ) : null}
    </div>
  );
}
