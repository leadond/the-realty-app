"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { MappableProperty } from "./PropertyMap";

// Leaflet's default marker icons resolve to broken relative URLs under a
// bundler. Point them at the CDN-hosted images instead — the most reliable fix
// in a Next.js context, since it needs no asset-loader config.
const ICON_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images";
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${ICON_BASE}/marker-icon-2x.png`,
  iconUrl: `${ICON_BASE}/marker-icon.png`,
  shadowUrl: `${ICON_BASE}/marker-shadow.png`,
});

const US_CENTER: [number, number] = [39.5, -98.35];

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export default function PropertyMapInner({ properties }: { properties: MappableProperty[] }) {
  const points: [number, number][] = properties.map((p) => [p.latitude, p.longitude]);

  return (
    <MapContainer
      center={points[0] ?? US_CENTER}
      zoom={points.length > 0 ? 10 : 4}
      scrollWheelZoom
      className="h-full w-full rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers points={points} />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{p.address}</p>
              <p className="text-[#58665e]">
                {p.city}, {p.state} {p.zip}
              </p>
              <p className="mt-1 font-medium">${p.price.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-wide text-[#58665e]">
                {p.status.replace(/_/g, " ")}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
