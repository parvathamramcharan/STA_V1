"use client";

import { useEffect, useRef, useState } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";

const MARKER_SIZE = 5;
const MARKER_VISIBLE_DURATION_SECONDS = 10;
const MARKER_HIDDEN_DURATION_SECONDS = 1;
const MIN_GLOBE_ZOOM_DISTANCE = 150_000;
const MAX_GLOBE_ZOOM_DISTANCE = 30_000_000;
const GLOBE_IDLE_DELAY_MS = 2000;
const GLOBE_ROTATION_RADIANS_PER_SECOND = 0.050;
const MARKER_COLOR_STOPS = [
  "#4338CA",
  "#2563EB",
  "#0891B2",
  "#16A34A",
  "#EAB308",
  "#EA580C",
  "#B91C1C",
];
const GLOBE_BACKGROUND_COLOR = "#F8FAFC";
const GLOBE_DARK_BACKGROUND_COLOR = "#050B14";
const MARKER_OUTLINE_COLOR = "#FFFFFF";
const MARKER_OUTLINE_WIDTH = 1.5;
// const GLOBE_OCEAN_COLOR = "#B8D0DA";
const GLOBE_OCEAN_COLOR = "#8FB9CC";
const GLOBE_COUNTRY_BORDER_COLOR = "#75838A";
const INDIA_LAND_COLOR = "#F4C542";
const INDIA_BORDER_COLOR = "#8A6415";
const PAKISTAN_LAND_COLOR = "#8FAFDC";

// const COUNTRY_COLORS = [
//   "#D99A82",
//   "#9FC7A5",
//   "#A9BDDF",
//   "#D7A7C9",
//   "#E4C66F",
//   "#80C5C1",
//   "#B5A4D8",
//   "#D9B18C",
// ];
const COUNTRY_COLORS = [
  "#D18468", // Richer terracotta
  "#87B991", // Richer sage green
  "#8FAFDC", // Richer blue
  "#CE8FBA", // Richer dusty pink
  "#DDBB4F", // Richer golden yellow
  "#65B8B3", // Richer teal
  "#A48CD0", // Richer lavender
  "#D1A174", // Richer sand
];
const NAME_KEYS = [
  "ADMIN",
  "admin",
  "NAME",
  "name",
  "NAME_LONG",
  "name_long",
  "SOVEREIGNT",
  "sovereignt",
  "name_en",
];

const normalizeCountryName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getFeatureCountryName = (properties) =>
  NAME_KEYS.map((key) => properties?.[key]).find(
    (value) => typeof value === "string" && value,
  );

const isIndiaFeature = (feature) => {
  const properties = feature?.properties || {};
  const isoCode = String(
    properties.iso_a3 ||
      properties.ISO_A3 ||
      properties.adm0_a3 ||
      "",
  ).toUpperCase();
  return (
    isoCode === "IND" ||
    normalizeCountryName(getFeatureCountryName(properties)) === "india"
  );
};

const getCountryColor = (properties) => {
  const isoCode = String(
    properties.iso_a3 || properties.ISO_A3 || properties.adm0_a3 || "",
  ).toUpperCase();
  const countryName = normalizeCountryName(getFeatureCountryName(properties));

  if (isoCode === "IND" || countryName === "india") return INDIA_LAND_COLOR;
  if (isoCode === "PAK" || countryName === "pakistan") {
    return PAKISTAN_LAND_COLOR;
  }

  const identity = isoCode || getFeatureCountryName(properties) || "";
  let hash = 0;
  for (const character of String(identity)) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return COUNTRY_COLORS[hash % COUNTRY_COLORS.length];
};

function findCountryData(featureName, countryData) {
  const normalizedFeatureName = normalizeCountryName(featureName);
  if (!normalizedFeatureName) return null;

  return (
    countryData.find(
      (entry) => {
        const normalizedEntryName = normalizeCountryName(entry.name);
        return (
          normalizedEntryName &&
          (normalizedEntryName === normalizedFeatureName ||
            normalizedEntryName.includes(normalizedFeatureName) ||
            normalizedFeatureName.includes(normalizedEntryName))
        );
      },
    ) || null
  );
}

export default function CesiumGlobe({
  worldCountries,
  indiaBorder,
  countryData,
  summaryMarkers,
  onCountrySelect,
}) {
  const containerRef = useRef(null);
  const hoverCardRef = useRef(null);
  const viewerRef = useRef(null);
  const cesiumRef = useRef(null);
  const homeViewRef = useRef(null);
  const [error, setError] = useState("");
  const [darkBackground, setDarkBackground] = useState(false);
  const darkBackgroundRef = useRef(darkBackground);

  useEffect(() => {
    darkBackgroundRef.current = darkBackground;
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || viewer.isDestroyed() || !Cesium) return;

    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(
      darkBackground ? GLOBE_DARK_BACKGROUND_COLOR : GLOBE_BACKGROUND_COLOR,
    );
    viewer.scene.requestRender();
  }, [darkBackground]);

  useEffect(() => {
    if (!worldCountries || !containerRef.current) return undefined;

    let active = true;
    let viewer;
    let resizeObserver;
    let removeIdleRotation;
    window.CESIUM_BASE_URL = "/cesium/";

    const createGlobe = async () => {
      try {
        const Cesium = await import("cesium");
        if (!active || !containerRef.current) return;

        cesiumRef.current = Cesium;
        Cesium.Ion.defaultAccessToken = "";
        viewer = new Cesium.Viewer(containerRef.current, {
          baseLayer: false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          animation: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          navigationHelpButton: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          fullscreenButton: false,
          shouldAnimate: false,
          requestRenderMode: false,
        });

        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(
          darkBackgroundRef.current
            ? GLOBE_DARK_BACKGROUND_COLOR
            : GLOBE_BACKGROUND_COLOR,
        );
        viewer.scene.globe.baseColor =
          Cesium.Color.fromCssColorString(GLOBE_OCEAN_COLOR);
        viewer.scene.skyBox.show = false;
        viewer.scene.sun.show = false;
        viewer.scene.moon.show = false;
        viewer.scene.globe.showGroundAtmosphere = false;
        viewer.scene.skyAtmosphere.show = false;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance =
          MIN_GLOBE_ZOOM_DISTANCE;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance =
          MAX_GLOBE_ZOOM_DISTANCE;
        homeViewRef.current = {
          destination: Cesium.Cartesian3.fromDegrees(78, 22, 24500000),
          orientation: {
            heading: 0,
            pitch: -Cesium.Math.PI_OVER_TWO,
            roll: 0,
          },
        };
        viewer.camera.setView(homeViewRef.current);
        viewerRef.current = viewer;

        let lastInteractionAt = performance.now();
        let previousFrameAt = null;
        const noteInteraction = () => {
          lastInteractionAt = performance.now();
        };
        const trackPointerDrag = (event) => {
          if (event.buttons) noteInteraction();
        };
        const interactionTarget = containerRef.current;
        interactionTarget.addEventListener("pointerdown", noteInteraction);
        interactionTarget.addEventListener("pointermove", trackPointerDrag);
        interactionTarget.addEventListener("wheel", noteInteraction, {
          passive: true,
        });
        interactionTarget.addEventListener("touchstart", noteInteraction, {
          passive: true,
        });
        interactionTarget.addEventListener("keydown", noteInteraction);
        const rotateWhenIdle = () => {
          const now = performance.now();
          if (previousFrameAt === null) {
            previousFrameAt = now;
            return;
          }
          const deltaSeconds = Math.min((now - previousFrameAt) / 1000, 0.1);
          previousFrameAt = now;
          if (now - lastInteractionAt >= GLOBE_IDLE_DELAY_MS) {
            viewer.camera.rotateRight(
              GLOBE_ROTATION_RADIANS_PER_SECOND * deltaSeconds,
            );
          }
        };
        viewer.scene.postRender.addEventListener(rotateWhenIdle);
        removeIdleRotation = () => {
          viewer.scene.postRender.removeEventListener(rotateWhenIdle);
          interactionTarget.removeEventListener("pointerdown", noteInteraction);
          interactionTarget.removeEventListener(
            "pointermove",
            trackPointerDrag,
          );
          interactionTarget.removeEventListener("wheel", noteInteraction);
          interactionTarget.removeEventListener("touchstart", noteInteraction);
          interactionTarget.removeEventListener("keydown", noteInteraction);
        };

        const globeBorderColor = Cesium.Color.fromCssColorString(
          GLOBE_COUNTRY_BORDER_COLOR,
        );
        const dataSource = await Cesium.GeoJsonDataSource.load(
          worldCountries,
          {
            clampToGround: false,
            stroke: globeBorderColor,
            strokeWidth: 1,
            fill: Cesium.Color.fromCssColorString(COUNTRY_COLORS[0]),
          },
        );
        if (!active) return;

        const propertiesTime = Cesium.JulianDate.now();
        let needsAntarcticaFallback = false;

        dataSource.entities.values.forEach((entity) => {
          if (!entity.polygon) return;

          const properties = entity.properties?.getValue(propertiesTime) || {};
          const countryName = getFeatureCountryName(properties);
          const hierarchy = entity.polygon.hierarchy.getValue(propertiesTime);
          if (
            normalizeCountryName(countryName) === "antarctica" &&
            hierarchy?.positions.length > 500
          ) {
            entity.polygon.show = false;
            needsAntarcticaFallback = true;
            return;
          }

          entity.polygon.material = Cesium.Color.fromCssColorString(
            getCountryColor(properties),
          );
          entity.polygon.height = 12000;
          entity.polygon.outline = !isIndiaFeature({ properties });
          entity.polygon.outlineColor = globeBorderColor;
        });

        viewer.dataSources.add(dataSource);
        if (indiaBorder) {
          const indiaDataSource = await Cesium.GeoJsonDataSource.load(
            indiaBorder,
            {
              clampToGround: false,
              stroke: Cesium.Color.TRANSPARENT,
              strokeWidth: 0,
              fill: Cesium.Color.fromCssColorString(INDIA_LAND_COLOR),
            },
          );
          if (!active) return;

          indiaDataSource.entities.values.forEach((entity) => {
            entity.name = "India";
            if (!entity.polygon) return;
            entity.polygon.material =
              Cesium.Color.fromCssColorString(INDIA_LAND_COLOR);
            entity.polygon.height = 14000;
            entity.polygon.outline = false;
          });
          viewer.dataSources.add(indiaDataSource);

          const indiaLineFeatures = Array.isArray(indiaBorder.features)
            ? indiaBorder.features
            : [];
          indiaLineFeatures.forEach((feature, featureIndex) => {
            const geometry = feature.geometry;
            const polygons =
              geometry?.type === "Polygon"
                ? [geometry.coordinates]
                : geometry?.type === "MultiPolygon"
                  ? geometry.coordinates
                  : [];

            polygons.forEach((polygon, polygonIndex) => {
              polygon.forEach((ring, ringIndex) => {
                const positions = Cesium.Cartesian3.fromDegreesArrayHeights(
                  ring.flatMap(([longitude, latitude]) => [
                    longitude,
                    latitude,
                    14010,
                  ]),
                );
                viewer.entities.add({
                  id: `india-boundary-${featureIndex}-${polygonIndex}-${ringIndex}`,
                  name: "India",
                  polyline: {
                    positions,
                    width: 1.25,
                    arcType: Cesium.ArcType.RHUMB,
                    material: Cesium.Color.fromCssColorString(
                      INDIA_BORDER_COLOR,
                    ),
                  },
                });
              });
            });
          });
        }

        if (needsAntarcticaFallback) {
          viewer.entities.add({
            id: "offline-antarctica-outline-fallback",
            name: "Antarctica",
            position: Cesium.Cartesian3.fromDegrees(0, -84, 12000),
            ellipse: {
              semiMajorAxis: 2300000,
              semiMinorAxis: 1400000,
              height: 12000,
              material: Cesium.Color.fromCssColorString(INDIA_LAND_COLOR),
              outline: true,
              outlineColor:
                Cesium.Color.fromCssColorString(INDIA_BORDER_COLOR),
              outlineWidth: 2,
            },
          });
        }

        const markerEntries = new Map();
        const markerBlinkStart = performance.now();
        const maxMarkerCount = Math.max(
          1,
          ...summaryMarkers.map(({ entry }) => Number(entry.count) || 0),
        );
        const markerColors = MARKER_COLOR_STOPS.map((color) =>
          Cesium.Color.fromCssColorString(color),
        );
        const getMarkerColor = (count) => {
          const ratio =
            Math.log1p(Math.max(0, count)) / Math.log1p(maxMarkerCount);
          const scaledRatio = ratio * (markerColors.length - 1);
          const lowerIndex = Math.min(
            Math.floor(scaledRatio),
            markerColors.length - 2,
          );
          return Cesium.Color.lerp(
            markerColors[lowerIndex],
            markerColors[lowerIndex + 1],
            scaledRatio - lowerIndex,
            new Cesium.Color(),
          );
        };
        summaryMarkers.forEach(({ entry, lat, lng }, index) => {
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          const id = `summary-marker-${index}`;
          markerEntries.set(id, entry);
          const blinkPhase =
            ((index * 0.61803398875) % 1) *
            (MARKER_VISIBLE_DURATION_SECONDS + MARKER_HIDDEN_DURATION_SECONDS);
          const markerVisible = new Cesium.CallbackProperty(() => {
            const elapsed = (performance.now() - markerBlinkStart) / 1000;
            const cycleDuration =
              MARKER_VISIBLE_DURATION_SECONDS +
              MARKER_HIDDEN_DURATION_SECONDS;
            const cyclePosition = (elapsed + blinkPhase) % cycleDuration;
            return cyclePosition < MARKER_VISIBLE_DURATION_SECONDS;
          }, false);
          viewer.entities.add({
            id,
            position: Cesium.Cartesian3.fromDegrees(lng, lat, 80000),
            point: {
              pixelSize: MARKER_SIZE,
              color: getMarkerColor(Number(entry.count) || 0),
              outlineColor: Cesium.Color.fromCssColorString(
                MARKER_OUTLINE_COLOR,
              ),
              outlineWidth: MARKER_OUTLINE_WIDTH,
              show: markerVisible,
            },
          });
        });

        viewer.screenSpaceEventHandler.setInputAction(({ endPosition }) => {
          const picked = viewer.scene.pick(endPosition);
          const markerEntry = markerEntries.get(picked?.id?.id);
          const entity = picked?.id;
          const properties =
            entity?.properties?.getValue(Cesium.JulianDate.now()) || {};
          const countryName =
            entity?.name ||
            getFeatureCountryName(properties) ||
            getFeatureCountryName(entity?.properties);
          const hoveredCountryName = markerEntry?.name || countryName;
          const hoverCard = hoverCardRef.current;

          if (!hoveredCountryName || !hoverCard) {
            viewer.canvas.style.cursor = "";
            if (hoverCard) hoverCard.style.display = "none";
            return;
          }

          viewer.canvas.style.cursor = "pointer";
          hoverCard.style.display = "block";
          const left = Math.min(
            endPosition.x + 14,
            viewer.canvas.clientWidth - hoverCard.offsetWidth - 8,
          );
          const top = Math.min(
            endPosition.y + 14,
            viewer.canvas.clientHeight - hoverCard.offsetHeight - 8,
          );
          hoverCard.style.left = `${Math.max(8, left)}px`;
          hoverCard.style.top = `${Math.max(8, top)}px`;
          hoverCard.querySelector("[data-hover-country]").textContent =
            hoveredCountryName;
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        viewer.screenSpaceEventHandler.setInputAction(({ position }) => {
          const picked = viewer.scene.pick(position);
          if (!Cesium.defined(picked?.id)) return;

          const markerEntry = markerEntries.get(picked.id.id);
          if (markerEntry) {
            onCountrySelect?.(markerEntry);
            return;
          }

          const entity = picked.id;
          if (!entity.polygon) return;
          const properties =
            entity.properties?.getValue(Cesium.JulianDate.now()) || {};
          const countryName =
            entity.name || getFeatureCountryName(properties);
          const country = findCountryData(countryName, countryData);
          if (country) onCountrySelect?.(country);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        resizeObserver = new ResizeObserver(() => {
          if (!viewer.isDestroyed()) {
            viewer.resize();
            viewer.scene.requestRender();
          }
        });
        resizeObserver.observe(containerRef.current);
      } catch (loadError) {
        if (!active) return;
        console.error("Failed to load the offline Cesium globe:", loadError);
        if (viewer && !viewer.isDestroyed()) viewer.destroy();
        viewerRef.current = null;
        cesiumRef.current = null;
        viewer = undefined;
        setError("The offline 3D globe could not be loaded.");
      }
    };

    createGlobe();

    return () => {
      active = false;
      removeIdleRotation?.();
      resizeObserver?.disconnect();
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
      cesiumRef.current = null;
    };
  }, [
    countryData,
    indiaBorder,
    onCountrySelect,
    summaryMarkers,
    worldCountries,
  ]);

  if (!worldCountries) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC] text-sm font-medium text-slate-600">
        Loading local world boundaries…
      </div>
    );
  }

  const zoomBy = (factor) => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || viewer.isDestroyed() || !Cesium) return;

    const camera = viewer.camera;
    const { longitude, latitude, height } = camera.positionCartographic;
    const nextHeight = Math.min(
      MAX_GLOBE_ZOOM_DISTANCE,
      Math.max(MIN_GLOBE_ZOOM_DISTANCE, height * factor),
    );
    if (nextHeight === height) return;

    camera.setView({
      destination: Cesium.Cartesian3.fromRadians(
        longitude,
        latitude,
        nextHeight,
      ),
      orientation: {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      },
    });
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[24px] border ${
        darkBackground
          ? "border-slate-700 bg-[#050B14]"
          : "border-slate-200 bg-[#F8FAFC]"
      }`}
    >
      <div ref={containerRef} className="h-full w-full" />
      <div
        ref={hoverCardRef}
        className="pointer-events-none absolute z-10 hidden max-w-[min(15rem,calc(100%-1rem))] truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xl"
      >
        <div data-hover-country />
      </div>
      <div
        className="absolute bottom-16 left-4 z-30 inline-flex rounded-lg border border-slate-300 bg-white/95 p-1 shadow-lg backdrop-blur sm:bottom-16 sm:left-5"
        role="group"
        aria-label="Globe background"
      >
        <button
          type="button"
          aria-pressed={!darkBackground}
          onClick={() => setDarkBackground(false)}
          className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-colors sm:text-xs ${
            !darkBackground
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          White
        </button>
        <button
          type="button"
          aria-pressed={darkBackground}
          onClick={() => setDarkBackground(true)}
          className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-colors sm:text-xs ${
            darkBackground
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Black
        </button>
      </div>
      <div className="absolute bottom-4 right-3 z-10 w-40 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur sm:bottom-5 sm:right-5 sm:w-48">
        <div className="mb-1.5 text-[10px] font-semibold text-slate-600 sm:text-xs">
          IP count
        </div>
        <div
          className="h-2 rounded-full"
          style={{
            background: `linear-gradient(to right, ${MARKER_COLOR_STOPS.join(", ")})`,
          }}
          aria-hidden="true"
        />
        <div className="mt-1 flex justify-between text-[9px] text-slate-500 sm:text-[10px]">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
      <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 sm:right-5">
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => zoomBy(0.65)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/95 text-xl font-semibold text-slate-700 shadow-lg transition hover:bg-blue-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:h-10 sm:w-10"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => zoomBy(1 / 0.65)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/95 text-xl font-semibold text-slate-700 shadow-lg transition hover:bg-blue-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:h-10 sm:w-10"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Reset globe view"
          title="Reset globe view"
          onClick={() => {
            if (viewerRef.current && homeViewRef.current) {
              viewerRef.current.camera.flyTo({
                ...homeViewRef.current,
                duration: 0.6,
              });
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/95 text-[10px] font-bold text-slate-700 shadow-lg transition hover:bg-blue-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:h-10 sm:w-10"
        >
          HOME
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="absolute inset-x-4 bottom-4 rounded-lg bg-rose-950/90 px-4 py-3 text-sm text-white"
        >
          {error}
        </div>
      )}
    </div>
  );
}
