"use client";

import { useEffect, useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { WorldMapLeaflet } from "@/app/dashboard/WorldMapLeaflet";

const EMPTY_IPS = [];

function getLocatedIps(externalIps) {
  const uniqueIps = new Map();

  externalIps.filter(hasCoordinates).forEach((ip, index) => {
    const key = ip.ip || `location-${ip.latitude}-${ip.longitude}-${index}`;
    if (!uniqueIps.has(key)) uniqueIps.set(key, ip);
  });

  return Array.from(uniqueIps.values());
}

function hasCoordinates(record) {
  if (record?.latitude == null || record?.longitude == null) return false;
  if (record.latitude === "" || record.longitude === "") return false;

  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export default function DomainLocationMap({ externalIps = EMPTY_IPS }) {
  const [expanded, setExpanded] = useState(false);
  const locatedIps = useMemo(() => getLocatedIps(externalIps), [externalIps]);

  useEffect(() => {
    if (!expanded) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setExpanded(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

  const expandOnMapClick = (event) => {
    if (
      event.target.closest(".leaflet-marker-icon, .leaflet-control, button, a")
    ) {
      return;
    }
    setExpanded(true);
  };

  const map = (
    <>
      <WorldMapLeaflet externalIps={locatedIps} mode="reports" />
      {locatedIps.length === 0 && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[800] rounded-lg border border-amber-500/20 bg-white/95 px-3 py-2 text-center text-xs text-slate-500 shadow-sm backdrop-blur">
          No IP location coordinates are available to plot.
        </div>
      )}
    </>
  );

  return (
    <>
      <div
        className="relative flex min-h-[360px] w-full flex-1 cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        onClick={expandOnMapClick}
        title="Click the map to expand it"
      >
        {map}
        <button
          type="button"
          aria-label="Expand domain location map"
          title="Expand map"
          className="absolute right-3 top-3 z-[801] rounded-lg border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-sm hover:bg-white"
          onClick={() => setExpanded(true)}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:p-8"
          role="presentation"
          onClick={() => setExpanded(false)}
        >
          <section
            className="relative h-[min(88vh,900px)] w-full max-w-[1500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Expanded domain location map"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="absolute inset-x-0 top-0 z-[1001] flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Domain Locations
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close expanded map"
                title="Close map"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setExpanded(false)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="absolute inset-0 pt-[58px]">{map}</div>
          </section>
        </div>
      )}
    </>
  );
}
