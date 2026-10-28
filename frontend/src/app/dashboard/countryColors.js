import { getSummaryMarkerGroupIndex } from "./summaryMarkerColors";
import {
  getCountryCode,
  getCountryDisplayName,
} from "@/constants/countryMapping";

const COUNTRY_COLORS = [
  "#D18468",
  "#87B991",
  "#8FAFDC",
  "#CE8FBA",
  "#DDBB4F",
  "#65B8B3",
  "#A48CD0",
  "#D1A174",
];

export const INDIA_LAND_COLOR = "#F4C542";
export const PAKISTAN_LAND_COLOR = "#8FAFDC";

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
const ISO2_KEYS = [
  "ISO_A2_EH",
  "iso_a2_eh",
  "ISO_A2",
  "iso_a2",
  "WB_A2",
  "wb_a2",
];

const normalizeCountryName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export function getCountryDataForFeature(properties = {}, countryData = []) {
  const featureNames = NAME_KEYS.map((key) => properties?.[key])
    .filter((name) => typeof name === "string" && name)
    .flatMap((name) => [name, getCountryDisplayName(name)])
    .map(normalizeCountryName)
    .filter(Boolean);
  if (!featureNames.length || !countryData.length) return null;

  const featureIso2 = ISO2_KEYS.map((key) =>
    String(properties?.[key] || "").toUpperCase(),
  ).find((code) => /^[A-Z]{2}$/.test(code));
  if (featureIso2) {
    const countryByCode = countryData.find(
      (entry) => getCountryCode(entry.name)?.toUpperCase() === featureIso2,
    );
    if (countryByCode) return countryByCode;
  }

  const countryNames = countryData.map((entry) => ({
    entry,
    names: [entry.name, getCountryDisplayName(entry.name)]
      .map(normalizeCountryName)
      .filter(Boolean),
  }));
  const exactMatches = countryNames.filter(({ names }) =>
    names.some((name) => featureNames.includes(name)),
  );
  if (exactMatches.length === 1) return exactMatches[0].entry;

  const partialMatches = countryNames.filter(({ names }) =>
    names.some((name) =>
      featureNames.some(
        (featureName) =>
          Math.min(name.length, featureName.length) >= 8 &&
          (name.includes(featureName) || featureName.includes(name)),
      ),
    ),
  );
  return partialMatches.length === 1 ? partialMatches[0].entry : null;
}

export function getCountryMarkerColor(
  properties = {},
  countryData = [],
  groups = [],
) {
  if (!groups.length) return null;
  const country = getCountryDataForFeature(properties, countryData);
  const count = Number(country?.count);
  if (!Number.isFinite(count) || count <= 0) return null;

  const groupIndex = getSummaryMarkerGroupIndex(count, groups);
  return groups[groupIndex]?.color || null;
}

export function getCountryColor(properties = {}) {
  const isoCode = String(
    properties.iso_a3 || properties.ISO_A3 || properties.adm0_a3 || "",
  ).toUpperCase();
  const countryName = normalizeCountryName(
    NAME_KEYS.map((key) => properties[key]).find(
      (value) => typeof value === "string" && value,
    ),
  );

  if (isoCode === "IND" || countryName === "india") return INDIA_LAND_COLOR;
  if (isoCode === "PAK" || countryName === "pakistan") {
    return PAKISTAN_LAND_COLOR;
  }

  const identity =
    isoCode ||
    NAME_KEYS.map((key) => properties[key]).find(
      (value) => typeof value === "string" && value,
    ) ||
    "";
  let hash = 0;
  for (const character of String(identity)) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return COUNTRY_COLORS[hash % COUNTRY_COLORS.length];
}
