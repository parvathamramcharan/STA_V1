const SUMMARY_MARKER_GROUPS = [
  { id: "1-50", label: "1–50 IPs", color: "#7DA8E8", maxCount: 50 },
  { id: "51-100", label: "51–100 IPs", color: "#79C5B0", maxCount: 100 },
  { id: "101-1000", label: "101–1,000 IPs", color: "#F2CC62", maxCount: 1000 },
  {
    id: "1001-2500",
    label: "1,001–2,500 IPs",
    color: "#E9A46A",
    maxCount: 2500,
  },
  {
    id: "2501-4000",
    label: "2,501–4,000 IPs",
    color: "#D98CB5",
    maxCount: 4000,
  },
  { id: "over-4000", label: ">4,000 IPs", color: "#E57373", maxCount: Infinity },
];

export function buildSummaryMarkerGroups() {
  return SUMMARY_MARKER_GROUPS;
}

export function getSummaryMarkerGroupIndex(count, groups) {
  const value = Math.max(0, Number(count) || 0);
  const index = groups.findIndex((group) => value <= group.maxCount);
  return index < 0 ? groups.length - 1 : index;
}
