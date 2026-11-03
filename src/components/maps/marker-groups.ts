export type ProjectedPoint = { id: string; x: number; y: number; destination?: boolean };
/** Group nearby unselected points in screen pixels, independent of data availability. */
export function groupMarkers<T extends ProjectedPoint>(points: T[], selectedId?: string | null, size = 64): T[][] {
  const cells = new Map<string, T[]>();
  const singles: T[][] = [];
  for (const point of points) {
    if (point.destination || point.id === selectedId) { singles.push([point]); continue; }
    const key = Math.floor(point.x / size) + ":" + Math.floor(point.y / size);
    const group = cells.get(key) ?? [];
    group.push(point); cells.set(key, group);
  }
  return [...cells.values(), ...singles];
}
