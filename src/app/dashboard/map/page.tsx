import { redirect } from "next/navigation";
import { MapPinned } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";
import PropertyMap, { type MappableProperty } from "@/components/PropertyMap";

export default async function MapPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const properties = await prisma.property.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      price: true,
      status: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const mappable: MappableProperty[] = properties
    .filter(
      (p): p is typeof p & { latitude: number; longitude: number } =>
        p.latitude !== null && p.longitude !== null,
    )
    .map((p) => ({
      id: p.id,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      price: p.price,
      status: p.status,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

  const missingCoords = properties.length - mappable.length;

  return (
    <UpgradeGate userTier={user.planTier} feature="map-view" featureLabel="Map View">
      <main className="min-h-screen bg-[#f7f5ef] p-6 text-[#17201b]">
        <header className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MapPinned className="text-[#17453b]" aria-hidden="true" /> Map View
          </h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Your listings plotted by location. Showing {mappable.length} of {properties.length}{" "}
            {properties.length === 1 ? "property" : "properties"}.
          </p>
        </header>

        {missingCoords > 0 && (
          <p
            className="mb-4 rounded-md border border-[#d8d1c2] bg-white px-4 py-3 text-sm text-[#58665e]"
            role="status"
          >
            {missingCoords} {missingCoords === 1 ? "property doesn't" : "properties don't"} have map
            coordinates yet, so {missingCoords === 1 ? "it isn't" : "they aren't"} shown on the map.
          </p>
        )}

        <div className="h-[70vh] overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
          {mappable.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#58665e]">
              No properties have map coordinates yet. Add latitude and longitude to a property to see
              it here.
            </div>
          ) : (
            <PropertyMap properties={mappable} />
          )}
        </div>
      </main>
    </UpgradeGate>
  );
}
