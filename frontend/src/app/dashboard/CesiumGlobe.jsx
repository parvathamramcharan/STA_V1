"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { getCountryDisplayName } from "@/constants/countryMapping";
import {
  getCountryColor,
  getCountryMarkerColor,
  getCountryDataForFeature,
  INDIA_LAND_COLOR,
  PAKISTAN_LAND_COLOR,
} from "./countryColors";

const MIN_GLOBE_ZOOM_DISTANCE = 150_000;
const MAX_GLOBE_ZOOM_DISTANCE = 30_000_000;
const GLOBE_IDLE_DELAY_MS = 2000;
const GLOBE_ROTATION_RADIANS_PER_SECOND = 0.050;
const GLOBE_DARK_BACKGROUND_COLOR = "#050B14";
const GLOBE_OCEAN_COLOR = "#8FB9CC";
const GLOBE_COUNTRY_BORDER_COLOR = "#64748B";
const INDIA_BORDER_COLOR = "#64748B";
let cesiumLoadPromise;
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

const loadCesium = () => {
  if (window.Cesium) return Promise.resolve(window.Cesium);

  if (!cesiumLoadPromise) {
    cesiumLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/cesium/Cesium.js";
      script.async = true;
      script.onload = () => {
        if (window.Cesium) {
          resolve(window.Cesium);
          return;
        }

        cesiumLoadPromise = null;
        reject(new Error("Cesium bundle loaded without exposing its API."));
      };
      script.onerror = () => {
        cesiumLoadPromise = null;
        reject(new Error(`Failed to load Cesium bundle: ${script.src}`));
      };
      document.head.appendChild(script);
    });
  }

  return cesiumLoadPromise;
};

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

export default function CesiumGlobe({
  worldCountries,
  indiaBorder,
  countryData,
  summaryMarkerGroups,
  onCountrySelect,
}) {
  const containerRef = useRef(null);
  const hoverCardRef = useRef(null);
  const viewerRef = useRef(null);
  const cesiumRef = useRef(null);
  const homeViewRef = useRef(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!worldCountries || !containerRef.current) return undefined;

    let active = true;
    let viewer;
    let resizeObserver;
    let removeIdleRotation;
    window.CESIUM_BASE_URL = "/cesium/";

    const createGlobe = async () => {
      try {
        const Cesium = await loadCesium();
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
          GLOBE_DARK_BACKGROUND_COLOR,
        );
        viewer.scene.globe.baseColor =
          Cesium.Color.fromCssColorString(GLOBE_OCEAN_COLOR);
        viewer.scene.skyBox.show = true;
        viewer.scene.sun.show = true;
        viewer.scene.moon.show = true;
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
            fill: Cesium.Color.fromCssColorString(getCountryColor({})),
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
            getCountryMarkerColor(
              properties,
              countryData,
              summaryMarkerGroups,
            ) || getCountryColor(properties),
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
              Cesium.Color.fromCssColorString(
                getCountryMarkerColor(
                  { ADMIN: "India" },
                  countryData,
                  summaryMarkerGroups,
                ) || INDIA_LAND_COLOR,
              );
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
                    width: 1,
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

        viewer.screenSpaceEventHandler.setInputAction(({ endPosition }) => {
          const picked = viewer.scene.pick(endPosition);
          const entity = picked?.id;
          const properties =
            entity?.properties?.getValue(Cesium.JulianDate.now()) || {};
          const countryName =
            entity?.name ||
            getFeatureCountryName(properties) ||
            getFeatureCountryName(entity?.properties);
          const hoverCard = hoverCardRef.current;

          if (!countryName || !hoverCard) {
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
            getCountryDisplayName(countryName);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        viewer.screenSpaceEventHandler.setInputAction(({ position }) => {
          const picked = viewer.scene.pick(position);
          if (!Cesium.defined(picked?.id)) return;

          const entity = picked.id;
          if (!entity.polygon) return;
          const properties =
            entity.properties?.getValue(Cesium.JulianDate.now()) || {};
          const countryName =
            entity.name || getFeatureCountryName(properties);
          const country = getCountryDataForFeature(
            properties.ADMIN ? properties : { ADMIN: countryName },
            countryData,
          );
          onCountrySelect?.(country || { name: countryName || "Unknown" });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        resizeObserver = new ResizeObserver(() => {
          if (!viewer.isDestroyed()) {
            viewer.resize();
            viewer.scene.requestRender();
          }
        });
        resizeObserver.observe(containerRef.current);

        const finishInitialRender = () => {
          if (!active) return;
          setIsLoading(false);
          viewer.scene.postRender.removeEventListener(finishInitialRender);
        };
        viewer.scene.postRender.addEventListener(finishInitialRender);
        viewer.scene.requestRender();
      } catch (loadError) {
        if (!active) return;
        console.error("Failed to load the offline Cesium globe:", loadError);
        if (viewer && !viewer.isDestroyed()) viewer.destroy();
        viewerRef.current = null;
        cesiumRef.current = null;
        viewer = undefined;
        setError("The offline 3D globe could not be loaded.");
        setIsLoading(false);
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
    worldCountries,
  ]);

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
      className="relative h-full w-full overflow-hidden rounded-[24px] border border-slate-700 bg-[#050B14]"
    >
      <div ref={containerRef} className="h-full w-full" />
      {isLoading && (
        <div
          className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-4 bg-[#050B14]/85 text-center backdrop-blur-[2px]"
          role="status"
          aria-busy="true"
          aria-label={
            worldCountries ? "Loading 3D globe" : "Loading world boundaries"
          }
        >
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="animate-pulse text-sm font-semibold text-slate-200">
            {worldCountries
              ? "Loading 3D Globe..."
              : "Loading local world boundaries..."}
          </p>
        </div>
      )}
      <div
        ref={hoverCardRef}
        className="pointer-events-none absolute z-10 hidden max-w-[min(15rem,calc(100%-1rem))] truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xl"
      >
        <div data-hover-country />
      </div>
      <div className="absolute bottom-4 right-3 z-10 w-40 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur sm:bottom-5 sm:right-5 sm:w-48">
        <div className="mb-1.5 text-[10px] font-semibold text-slate-600 sm:text-xs">
          Country IP count
        </div>
        <div className="flex flex-col gap-1">
          {summaryMarkerGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 text-[9px] text-slate-600 sm:text-[10px]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: group.color }}
                aria-hidden="true"
              />
              <span>{group.label}</span>
            </div>
          ))}
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/95 text-slate-700 shadow-lg transition hover:bg-blue-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:h-10 sm:w-10"
        >
          <RotateCcw size={17} aria-hidden="true" />
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
