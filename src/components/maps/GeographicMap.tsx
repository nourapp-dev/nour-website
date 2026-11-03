"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { validCoordinates } from "../../features/journeys/coordinates";
import { groupMarkers } from "./marker-groups";

export type MapPoint = {
  id: string; name: string; latitude: number; longitude: number;
  available?: boolean; destination?: boolean;
};
type Props = {
  points: MapPoint[];
  selectedId?: string | null;
  mode?: "saudi" | "world";
  onSelect?: (id: string) => void;
  onPosition?: (latitude: number, longitude: number) => void;
  route?: boolean;
  label: string;
  language?: "ar" | "en";
  cluster?: boolean;
};
export default function GeographicMap({
  points, selectedId, mode = "saudi", onSelect, onPosition,
  route = false, label, language = "ar", cluster = false,
}: Props) {
  const ar = language === "ar";
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const callbacks = useRef({ onSelect, onPosition });
  const lastView = useRef("");
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { callbacks.current = { onSelect, onPosition }; }, [onSelect, onPosition]);
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    let instance: Leaflet.Map | undefined;
    let timer: number | undefined;
    void import("leaflet").then(L => {
      if (disposed || !element.current) return;
      instance = L.map(element.current, {
        scrollWheelZoom: false, minZoom: 2, maxZoom: 18, worldCopyJump: true,
        zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false,
      }).setView([24, 44], 5);
      map.current = instance;
      lastView.current = "";
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      // Slow or blocked tiles must not hide the list or wait indefinitely.
      tiles.on("loading", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => { if (!disposed) setTileError(true); }, 12000);
      }).on("load", () => window.clearTimeout(timer))
        .on("tileerror", () => { if (!disposed) setTileError(true); }).addTo(instance);
      instance.on("click", (event: Leaflet.LeafletMouseEvent) =>
        callbacks.current.onPosition?.(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6))));
      if (typeof ResizeObserver !== "undefined") {
        resize = new ResizeObserver(() => instance?.invalidateSize());
        resize.observe(element.current);
      }
      setReady(true);
    }).catch(() => { if (!disposed) setTileError(true); });
    return () => {
      disposed = true; window.clearTimeout(timer); resize?.disconnect();
      instance?.remove(); map.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;
    let disposed = false;
    let layer: Leaflet.LayerGroup | undefined;
    let draw: (() => void) | undefined;
    void import("leaflet").then(L => {
      if (disposed) return;
      layer = L.layerGroup().addTo(instance);
      const valid = points.filter(p => validCoordinates(p.latitude, p.longitude));
      const from = valid.find(p => p.id === selectedId);
      const to = valid.find(p => p.destination);
      // Refetches and language changes do not undo the visitor's zoom/pan.
      const view = [mode, selectedId, from?.latitude, from?.longitude, route].join(":");
      if (lastView.current !== view) {
        if (from && route && to) {
          instance.fitBounds([[from.latitude, from.longitude], [to.latitude, to.longitude]], { padding: [48, 48], maxZoom: 7, animate: false });
        } else if (from) {
          instance.setView([from.latitude, from.longitude], callbacks.current.onPosition ? instance.getZoom() : 5, { animate: false });
        } else instance.setView(mode === "saudi" ? [24, 44] : [22, 20], mode === "saudi" ? 5 : 2, { animate: false });
        lastView.current = view;
      }
      const selectMarker = (marker: Leaflet.Marker, action: () => void, selectable: boolean, active = false) => {
        if (!selectable) return;
        marker.on("click", action);
        const node = marker.getElement();
        if (node) {
          node.setAttribute("role", "button");
          node.setAttribute("aria-pressed", String(active));
          // Leaflet already handles Enter; Space needs button behavior.
          node.addEventListener("keydown", event => {
            if (event.key === " ") { event.preventDefault(); event.stopPropagation(); action(); }
          });
        }
      };
      draw = () => {
        if (disposed || !layer) return;
        layer.clearLayers();
        const projected = valid.map(point => {
          const pixel = instance.project([point.latitude, point.longitude], instance.getZoom());
          return { ...point, x: pixel.x, y: pixel.y };
        });
        const groups = cluster && !callbacks.current.onPosition && instance.getZoom() < 12
          ? groupMarkers(projected, selectedId) : projected.map(point => [point]);
        for (const group of groups) {
          if (group.length > 1) {
            const lat = group.reduce((sum, point) => sum + point.latitude, 0) / group.length;
            const lon = group.reduce((sum, point) => sum + point.longitude, 0) / group.length;
            const title = ar ? group.length + " مواقع — كبّر الخريطة أو اختر من القائمة" : group.length + " locations — zoom in or choose from the list";
            const icon = L.divIcon({
              className: "nour-geo-marker",
              html: '<span style="display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#176fe8;color:#fff;border:3px solid white;font:bold 16px Cairo,sans-serif">' + group.length + "</span>",
              iconSize: [44, 44], iconAnchor: [22, 22],
            });
            const marker = L.marker([lat, lon], { icon, title, alt: title }).addTo(layer);
            selectMarker(marker, () => instance.setView([lat, lon], Math.min(instance.getZoom() + 2, 12), { animate: false }), true);
            continue;
          }
          const point = group[0];
          const active = point.id === selectedId;
          const color = point.destination || active ? "#ffc313" : cluster || point.available ? "#176fe8" : "#64748b";
          const icon = L.divIcon({
            className: "nour-geo-marker",
            html: '<span style="display:grid;place-items:center;width:44px;height:44px"><span style="display:block;width:20px;height:20px;border-radius:50%;background:' + color + ';border:3px solid white;box-shadow:0 2px 9px #102b4580"></span></span>',
            iconSize: [44, 44], iconAnchor: [22, 22],
          });
          const name = document.createElement("span");
          name.textContent = point.name;
          const marker = L.marker([point.latitude, point.longitude], {
            icon, title: point.name, alt: point.name,
            draggable: Boolean(callbacks.current.onPosition),
          }).addTo(layer).bindTooltip(name, { permanent: point.destination || active, direction: "top" });
          selectMarker(marker, () => callbacks.current.onSelect?.(point.id), Boolean(callbacks.current.onSelect) && !point.destination, active);
          marker.on("dragend", () => {
            const p = marker.getLatLng();
            callbacks.current.onPosition?.(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
          });
        }
        if (route && from && to && from.id !== to.id)
          L.polyline([[from.latitude, from.longitude], [to.latitude, to.longitude]], { color: "#d69800", weight: 3, dashArray: "7 8" }).addTo(layer);
      };
      draw(); instance.on("zoomend", draw);
      const zoom = instance.getContainer().querySelectorAll(".leaflet-control-zoom a");
      zoom.forEach((control, index) => {
        const text = index === 0 ? (ar ? "تكبير" : "Zoom in") : (ar ? "تصغير" : "Zoom out");
        control.setAttribute("aria-label", text); control.setAttribute("title", text);
      });
    }).catch(() => { if (!disposed) setTileError(true); });
    return () => { disposed = true; if (draw) instance.off("zoomend", draw); layer?.remove(); };
  }, [ready, points, selectedId, mode, route, ar, cluster]);
  return (
    <div style={{ position: "relative", height: "100%", minHeight: 260, isolation: "isolate" }}>
      <div ref={element} role="region" aria-label={label} style={{ height: "100%", minHeight: 260, borderRadius: 18 }} />
      {!ready && !tileError && <p role="status" style={{ position: "absolute", top: 12, insetInline: 12, color: "#112b45" }}>{ar ? "جارٍ تحميل الخريطة…" : "Loading map…"}</p>}
      {tileError && (
        <div role="status" dir={ar ? "rtl" : "ltr"} style={{
          position: "absolute", bottom: 28, left: 10, right: 10, zIndex: 1000,
          background: "#fff", color: "#263b52", padding: 12, borderRadius: 8, lineHeight: 1.7,
        }}>
          <p style={{ margin: "0 0 8px" }}>{onPosition
            ? ar ? "تعذر تحميل الخريطة. يمكنك إعادة المحاولة أو استخدام حقول الإحداثيات." : "The map could not load. Retry or use the coordinate fields."
            : ar ? "تعذر تحميل الخريطة بالكامل. قائمة نقاط الانطلاق والبرامج ما زالت متاحة." : "The map could not fully load. The origin list and programs are still available."}</p>
          <button type="button" style={{ minHeight: 44, font: "inherit", cursor: "pointer" }}
            onClick={() => { setReady(false); setTileError(false); setAttempt(value => value + 1); }}>
            {ar ? "إعادة تحميل الخريطة" : "Retry map"}
          </button>
        </div>
      )}
    </div>
  );
}
