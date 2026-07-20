"use client";

import dynamic from "next/dynamic";

export type MappableProperty = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  status: string;
  latitude: number;
  longitude: number;
};

// Leaflet references `window` at import time, which crashes during SSR. Load the
// actual map only on the client via a dynamic import with ssr disabled.
const PropertyMapInner = dynamic(() => import("./PropertyMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-[#58665e]">
      Loading map…
    </div>
  ),
});

export default function PropertyMap({ properties }: { properties: MappableProperty[] }) {
  return <PropertyMapInner properties={properties} />;
}
