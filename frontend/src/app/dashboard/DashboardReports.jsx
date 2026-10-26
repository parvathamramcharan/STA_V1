"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Globe,
  MapPin,
  Server,
  Activity,
  ArrowRight,
  Shield,
  Search,
  ChevronRight,
  Loader2,
  Database,
  Terminal,
  CheckCircle2,
  User,
  Cpu,
  AlertTriangle,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchReportsGeo,
  fetchReportsDetails,
  fetchIPScan,
  triggerExport,
} from "./dashboardApiService";
import {
  getCountryDisplayName,
  getCountryCode,
} from "@/constants/countryMapping";
import { WorldMapLeaflet } from "./WorldMapLeaflet";
import {
  compareIspNames,
  getCountryFlagClass,
  getIspDisplayName,
  getIspSearchText,
  matchesCountrySearch,
} from "./countryUtils";
import PropTypes from "prop-types";

DashboardReports.propTypes = {
  initialMode: PropTypes.string,
  pcapId: PropTypes.string,
  customFetchGeo: PropTypes.func,
  customFetchDetails: PropTypes.func,
  customTriggerExport: PropTypes.func,
  session: PropTypes.object,
};

export function DashboardReports({
  initialMode = "country",
  pcapId = null,
  customFetchGeo = null,
  customFetchDetails = null,
  customTriggerExport = null,
  session,
}) {
  const [geoData, setGeoData] = useState({
    countries: [],
    cities: [],
    isps: [],
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsData, setDetailsData] = useState([]);
  const [selectedIp, setSelectedIp] = useState(null);
  const [ipIntelligence, setIpIntelligence] = useState(null);
  const detailsRef = useRef(null);

  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingIntel, setIsLoadingIntel] = useState(false);
  const [error, setError] = useState(null);

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listPage, setListPage] = useState(1);
  const discoveryMode = initialMode;

  const listPageSize = 100;
  const detailsPageSize = 12;

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) return;

      setSelectedItem(null);
      setDetailsData([]);
      setSelectedIp(null);
      setIpIntelligence(null);
      setCurrentPage(1);
      setListPage(1);
    });

    return () => {
      isActive = false;
    };
  }, [initialMode, pcapId]);

  useEffect(() => {
    const loadGeoData = async () => {
      setIsLoadingGeo(true);
      try {
        const fetchFn = customFetchGeo || fetchReportsGeo;
        const data = await fetchFn(pcapId);
        if (data.success) {
          setGeoData({
            countries: data.data.countries || [],
            cities: data.data.cities || [],
            isps: data.data.isps || [],
          });
        }
      } catch (err) {
        console.error("Failed to load geo data:", err);
        setError("Intelligence server connection failed.");
      } finally {
        setIsLoadingGeo(false);
      }
    };
    loadGeoData();
  }, [pcapId, customFetchGeo]);

  const handleItemSelect = async (item) => {
    setSelectedItem(item);
    setDetailsData([]);
    setSelectedIp(null);
    setIpIntelligence(null);
    setCurrentPage(1);
    setIsLoadingDetails(true);
    setError(null);

    // Smooth scroll to details anchor
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 100);

    try {
      const fetchFn = customFetchDetails || fetchReportsDetails;
      const data = pcapId
        ? await fetchFn(pcapId, discoveryMode, item.name)
        : await fetchFn(discoveryMode, item.name);

      // Support both { data: [...] } and direct array responses
      const results = data.data || (Array.isArray(data) ? data : []);
      setDetailsData(results);

      if (results.length > 0) {
        handleIpSelect(results[0].ip);
      }
    } catch (err) {
      console.error("Failed to load details:", err);
      setError("Intelligence lookup failed. Please re-synchronize.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleIpSelect = async (ip) => {
    setSelectedIp(ip);
    setIsLoadingIntel(true);
    setIpIntelligence(null);

    try {
      const data = await fetchIPScan(ip);
      if (data?.success) {
        setIpIntelligence(data.data);
      }
    } catch (err) {
      console.error("IP Intelligence fetch failed:", err);
    } finally {
      setIsLoadingIntel(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedItem || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setError(null);
    try {
      // Use the PCAP-scoped export endpoint when viewing a capture report.
      if (pcapId && customTriggerExport) {
        await customTriggerExport(pcapId, discoveryMode, selectedItem.name);
      } else {
        await triggerExport(discoveryMode, selectedItem.name);
      }
      setShowPasswordModal(true);
    } catch (err) {
      console.error("Export failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Report download failed: ${message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const sortedCountries = useMemo(
    () =>
      [...geoData.countries].sort((a, b) => {
        const leftName = getCountryDisplayName(a.name);
        const rightName = getCountryDisplayName(b.name);

        return leftName.localeCompare(rightName, undefined, {
          sensitivity: "base",
        });
      }),
    [geoData.countries],
  );
  const sortedIsps = useMemo(
    () => [...geoData.isps].sort((a, b) => compareIspNames(a.name, b.name)),
    [geoData.isps],
  );
  const ispSearchIndex = useMemo(
    () =>
      sortedIsps.map((item) => ({
        item,
        searchText: getIspSearchText(item.name),
      })),
    [sortedIsps],
  );
  const matchingItems = useMemo(() => {
    if (discoveryMode === "country") {
      return sortedCountries.filter((item) =>
        matchesCountrySearch(item.name, searchQuery),
      );
    }

    const normalizedQuery = searchQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    return ispSearchIndex
      .filter(({ searchText }) => searchText.includes(normalizedQuery))
      .map(({ item }) => item);
  }, [discoveryMode, searchQuery, sortedCountries, ispSearchIndex]);
  const totalListPages = Math.max(
    1,
    Math.ceil(matchingItems.length / listPageSize),
  );
  const visibleItems = matchingItems.slice(
    (listPage - 1) * listPageSize,
    listPage * listPageSize,
  );
  const totalPages = Math.ceil(detailsData.length / detailsPageSize);
  const paginatedIps = detailsData.slice(
    (currentPage - 1) * detailsPageSize,
    currentPage * detailsPageSize,
  );
  const selectedCountryDisplayName =
    selectedItem && discoveryMode === "country"
      ? getCountryDisplayName(selectedItem.name)
      : selectedItem?.name;
  const selectedCountryFlagClass =
    selectedItem && discoveryMode === "country"
      ? getCountryFlagClass(selectedItem.name)
      : null;
  const selectedIspDisplayName =
    selectedItem && discoveryMode === "isp"
      ? getIspDisplayName(selectedItem.name)
      : selectedItem?.name;

  if (isLoadingGeo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-black text-[11px] uppercase animate-pulse">
          Aggregating Global Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Discovery Header */}
      <div className="px-10 pt-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <Globe size={19} className="text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">
                  {discoveryMode === "country" ? "Countries" : "ISPs"}
                </h2>
                <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {discoveryMode === "country"
                    ? geoData.countries.length
                    : geoData.isps.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {discoveryMode === "country"
                  ? "Geographic report coverage"
                  : "Network provider report coverage"}
              </p>
            </div>
          </div>

          <div className="relative w-full max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={`Search ${discoveryMode === "country" ? "countries" : "ISPs"}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setListPage(1);
              }}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-normal text-foreground shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
            />
          </div>
        </div>

        <div className="mt-5 border-b border-slate-200 dark:border-slate-700" />
      </div>

      {/* Country / ISP List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 max-h-[330px]">
            {visibleItems.map((item) => {
              const isCountry = discoveryMode === "country";
              const flagClass = isCountry
                ? getCountryFlagClass(item.name)
                : null;
              const displayName = isCountry
                ? getCountryDisplayName(item.name)
                : getIspDisplayName(item.name);
              const isSelected = selectedItem?.name === item.name;

              return (
                <motion.button
                  key={item.name}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleItemSelect(item)}
                  className={`group flex min-h-[62px] items-center rounded-lg border px-4 py-3 text-left transition-all duration-200 ${isSelected ? "border-blue-300 bg-blue-50/70 shadow-sm dark:border-blue-500/50 dark:bg-blue-500/10" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/70"}`}
                >
                  <div className="flex min-w-0 w-full items-center gap-3">
                    {isCountry ? (
                      flagClass ? (
                        <span
                          className={`${flagClass} shrink-0`}
                          aria-hidden="true"
                        />
                      ) : (
                        <Globe size={16} className="shrink-0 text-slate-400" />
                      )
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50 dark:bg-slate-800">
                        <Server
                          size={15}
                          className="text-slate-500 dark:text-slate-400"
                        />
                      </div>
                    )}

                    <span
                      className={`min-w-0 flex-1 truncate text-sm font-medium transition-colors ${isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"}`}
                    >
                      {displayName}
                    </span>

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-300"}`}
                    >
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </motion.button>
              );
            })}

            {matchingItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-14 text-center">
                <Search size={22} className="text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No {discoveryMode === "country" ? "countries" : "ISPs"} found
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try a different search term.
                </p>
              </div>
            )}
          </div>
          {matchingItems.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700">
              <span>
                Showing {(listPage - 1) * listPageSize + 1}-
                {Math.min(listPage * listPageSize, matchingItems.length)} of{" "}
                {matchingItems.length.toLocaleString()}
              </span>
              {totalListPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setListPage((page) => Math.max(1, page - 1))}
                    disabled={listPage === 1}
                    className="rounded border border-slate-200 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                  >
                    Previous
                  </button>
                  <span>
                    Page {listPage} of {totalListPages.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setListPage((page) => Math.min(totalListPages, page + 1))
                    }
                    disabled={listPage === totalListPages}
                    className="rounded border border-slate-200 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Selected Country Context Bar */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            ref={detailsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-10 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-7 py-5 shadow-sm scroll-mt-20 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex min-w-0 items-center gap-4">
              {selectedCountryFlagClass && (
                <span
                  className={`${selectedCountryFlagClass} shrink-0`}
                  aria-hidden="true"
                />
              )}
              <h3 className="text-2xl font-semibold text-foreground">
                {discoveryMode === "country"
                  ? selectedCountryDisplayName
                  : selectedIspDisplayName}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* MAP VIEW */}
              <button
                onClick={() => setIsMapOpen(true)}
                className="group flex h-10 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 text-[16px] font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500/20">
                  <Globe size={15} />
                </span>
                <span className="whitespace-nowrap ">Map View</span>
              </button>

              {/* DOWNLOAD REPORT */}
              <button
                onClick={handleDownloadReport}
                disabled={isGeneratingPdf}
                className="group flex h-10 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 text-[16px] font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500/20">
                  <Database
                    size={15}
                    className={isGeneratingPdf ? "animate-spin" : ""}
                  />
                </span>
                <span className="whitespace-nowrap">
                  {isGeneratingPdf ? "Generating..." : "Download Report"}
                </span>
                {isGeneratingPdf && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Geospatial Modal Overlay */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-12 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full h-full bg-card border border-theme shadow-2xl rounded-2xl overflow-hidden relative flex flex-col"
            >
              <div className="px-10 py-5 border-b border-theme bg-card flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10">
                    <Globe size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground  tracking-wide leading-none">
                      {selectedItem?.name}
                    </h2>
                    <p className="text-[12px] text-slate-500 font-bold  tracking-[0.18em] mt-2">
                      IP Geo Distribution
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMapOpen(false)}
                  className="p-3 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 relative">
                <WorldMapLeaflet
                  externalIps={detailsData}
                  mode="reports"
                  fallbackCountry={
                    discoveryMode === "country"
                      ? selectedCountryDisplayName
                      : undefined
                  }
                  reportLabel={
                    discoveryMode === "country"
                      ? selectedCountryDisplayName
                      : selectedIspDisplayName
                  }
                  reportType={discoveryMode}
                  onIpClick={(ip) => {
                    handleIpSelect(ip);
                    setIsMapOpen(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-10 grid grid-cols-1 gap-8 lg:grid-cols-12"
          >
            {/* IP List Column */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-card shadow-sm overflow-hidden flex flex-col h-full min-h-[1000px]">
                <div className="px-8 py-4 bg-slate-500/[0.02] flex items-center justify-between">
                  <span className="text-[17px]   ">Discovered IPs</span>
                  <div className="flex flex-col items-end gap-1">
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-none text-[14px]  text-blue-600 ">
                      {isLoadingDetails ? "..." : detailsData.length} Records
                      Total
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {isLoadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-slate-400 font-black text-[9px]  animate-pulse">
                        IP Searching....
                      </p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
                      <AlertTriangle className="w-8 h-8 text-rose-500" />
                      <p className="text-rose-500 font-black text-[10px] uppercase tracking-widest">
                        {error}
                      </p>
                    </div>
                  ) : detailsData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
                      <div className="p-4 bg-slate-500/5 rounded-none">
                        <Terminal className="w-8 h-8 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-slate-500 font-black text-[10px] ">
                          No Records Discovered
                        </p>
                        <p className="text-[9px]  mt-1">
                          Select a different region to begin discovery
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="">
                      {paginatedIps.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleIpSelect(item.ip)}
                          className={`w-full px-8 py-6 text-left transition-all flex items-center justify-between group cursor-pointer ${
                            selectedIp === item.ip
                              ? "bg-blue-600/10"
                              : "bg-card hover:bg-slate-500/[0.03]"
                          }`}
                        >
                          <div>
                            <div className="text-[15px] font-black ">
                              {item.ip}
                            </div>
                            <div className="text-[13px] font-bold mt-1 text-slate-500">
                              {item.isp || "Unknown Provider"}
                            </div>
                          </div>
                          <ChevronRight
                            size={18}
                            className={`transition-transform ${
                              selectedIp === item.ip
                                ? "translate-x-1 opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination Control */}
                {totalPages > 1 && (
                  <div className="p-4 bg-slate-500/5 border-t border-theme flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[12px]">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all border border-theme bg-card"
                      >
                        «
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all border border-theme bg-card"
                      >
                        ‹
                      </button>

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else {
                            if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2)
                              pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border ${
                                currentPage === pageNum
                                  ? "bg-blue-50 text-blue-600 border-blue-600 shadow-md shadow-blue-500/10"
                                  : "text-slate-500 border-theme hover:border-blue-500/30 hover:bg-slate-500/10 bg-card"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all border border-theme bg-card"
                      >
                        ›
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all border border-theme bg-card"
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Intelligence Profile Column (Matching IP Search layout) */}
            <div className="lg:col-span-9">
              <div className="flex flex-col h-full">
                {isLoadingIntel ? (
                  <div className="bg-card/30 backdrop-blur-sm border border-theme shadow-sm flex-1 flex flex-col items-center justify-center py-40 gap-6 rounded-none">
                    <div className="relative">
                      <Activity className="w-16 h-16 text-blue-600 animate-pulse" />
                      <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                    </div>
                    <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">
                      Scanning Intelligence...
                    </span>
                  </div>
                ) : ipIntelligence ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Left Column */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                      {/* Host Identity */}
                      <div className="bg-card border border-theme p-8 rounded-none relative overflow-hidden group transition-all duration-500">
                        <div
                          className={`absolute top-6 right-6 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest ${
                            ipIntelligence.status === "up"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                          }`}
                        >
                          {ipIntelligence.status || "Unknown"}
                        </div>

                        <div className="flex items-center gap-5 mb-8">
                          <div className="w-16 h-16 bg-blue-500/10 rounded-none flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <Server size={28} className="text-blue-500" />
                          </div>

                          <div className="min-w-0">
                            <div className="text-[16px] font-semibold text-slate-500 mb-0.5">
                              Host Identity
                            </div>
                            <div className="text-2xl font-bold text-foreground truncate group-hover:text-blue-500 transition-colors">
                              {ipIntelligence.ip}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <DetailRow
                            icon={Globe}
                            label="Autonomous System Number"
                            value={ipIntelligence.asn}
                            color="blue"
                          />
                          <DetailRow
                            icon={Cpu}
                            label="OS Match"
                            value={ipIntelligence.os_info?.best_match}
                            subValue={`Confidence: ${ipIntelligence.os_info?.confidence}%`}
                            color="purple"
                          />
                          <DetailRow
                            icon={Shield}
                            label="DNSBL Status"
                            value={
                              ipIntelligence.dnsbl?.listed
                                ? "Listed / At Risk"
                                : "Clean"
                            }
                            color={
                              ipIntelligence.dnsbl?.listed ? "rose" : "emerald"
                            }
                          />
                          <DetailRow
                            icon={Terminal}
                            label="rDNS / Hostname"
                            value={
                              ipIntelligence.rdns ||
                              (ipIntelligence.hostnames?.length
                                ? ipIntelligence.hostnames.join(", ")
                                : null)
                            }
                            color="indigo"
                          />
                          <DetailRow
                            icon={Zap}
                            label="Proxy Type"
                            value={ipIntelligence.proxy_type}
                            color="amber"
                          />
                        </div>
                      </div>

                      {/* Geographic Intel */}
                      <div className="bg-card border border-theme p-8 rounded-none">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-2 bg-orange-500/10 rounded-none">
                            <MapPin size={20} className="text-orange-500" />
                          </div>
                          <div className="text-[16px] font-bold text-foreground">
                            Geographic Intel
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              City / Region
                            </div>
                            <div className="text-[14px] break-words">
                              {ipIntelligence.geo?.city || "Unknown City"}
                            </div>
                          </div>

                          <div>
                            <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Country
                            </div>
                            <div className="text-[14px] break-words">
                              {ipIntelligence.geo?.country || "Unknown Country"}
                            </div>
                          </div>

                          <div>
                            <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Service Provider
                            </div>
                            <div className="text-[14px] break-words">
                              {ipIntelligence.geo?.isp || "Unknown ISP"}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-theme">
                            <div>
                              <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                                Latitude
                              </div>
                              <div className="text-[14px] break-words">
                                {ipIntelligence.geo?.latitude || "N/A"}
                              </div>
                            </div>

                            <div>
                              <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                                Longitude
                              </div>
                              <div className="text-[14px] break-words">
                                {ipIntelligence.geo?.longitude || "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                      {/* Ports & Service Detection */}
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-500/[0.05] border border-theme rounded-none shadow-sm">
                              <Activity size={24} className="text-rose-500" />
                            </div>
                            <div>
                              <h3 className="text-[14px] font-bold text-foreground">
                                Ports & Service Detection
                              </h3>
                              <p className="text-[14px] mt-0.5">
                                Active Network Services
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-none text-[10px] text-blue-600">
                              {ipIntelligence.ports?.length || 0} Ports Found
                            </div>
                          </div>
                        </div>

                        <div className="bg-card rounded-none overflow-hidden flex flex-col shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead className="bg-slate-500/5">
                                <tr>
                                  <th className="px-8 py-4 text-[14px] font-bold">
                                    Port
                                  </th>
                                  <th className="px-8 py-4 text-[14px] font-bold">
                                    Service
                                  </th>
                                  <th className="px-8 py-4 text-[14px] font-bold">
                                    Protocol
                                  </th>
                                  <th className="px-8 py-4 text-[14px] font-bold">
                                    State
                                  </th>
                                  <th className="px-8 py-4 text-[14px] font-bold">
                                    Reason
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {ipIntelligence.ports?.map((p, i) => (
                                  <tr
                                    key={i}
                                    className="group hover:bg-slate-500/5 transition-colors"
                                  >
                                    <td className="px-8 py-5">
                                      <div className="flex items-center gap-3">
                                        <span className="text-[14px] text-foreground">
                                          {p.port}
                                        </span>
                                        {p.state === "open" && (
                                          <CheckCircle2
                                            size={12}
                                            className="text-emerald-500"
                                          />
                                        )}
                                      </div>
                                    </td>

                                    <td className="px-8 py-5">
                                      <div className="text-[11px] text-blue-500 uppercase bg-blue-500/5 px-2 py-1 rounded-none border border-blue-500/10 inline-block">
                                        {p.service ||
                                          p.application ||
                                          "Unknown"}
                                      </div>
                                    </td>

                                    <td className="px-8 py-5 text-[11px] uppercase">
                                      {p.protocol}
                                    </td>

                                    <td className="px-8 py-5">
                                      <span
                                        className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-none border ${
                                          p.state === "open"
                                            ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/20"
                                            : "text-slate-400 bg-slate-500/5 border-slate-500/20"
                                        }`}
                                      >
                                        {p.state}
                                      </span>
                                    </td>

                                    <td className="px-8 py-5 text-right">
                                      <span className="text-[10px] uppercase">
                                        {p.reason || "N/A"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}

                                {(!ipIntelligence.ports ||
                                  ipIntelligence.ports.length === 0) && (
                                  <tr>
                                    <td
                                      colSpan="5"
                                      className="px-8 py-20 text-center text-xs"
                                    >
                                      No Open Ports Discovered
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Ownership Details */}
                      <div className="bg-card border border-theme p-8 rounded-none">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-2 bg-emerald-500/10 rounded-none">
                            <User size={20} className="text-emerald-500" />
                          </div>
                          <div className="text-[14px] font-bold text-foreground">
                            Ownership Details
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                          <WhoisSection
                            title="Registrant Information"
                            data={ipIntelligence.whois?.contacts?.registrant}
                          />
                          <WhoisSection
                            title="Technical Contact"
                            data={ipIntelligence.whois?.contacts?.technical}
                          />
                          <WhoisSection
                            title="Abuse Contact"
                            data={ipIntelligence.whois?.contacts?.abuse}
                          />
                          <WhoisSection
                            title="Administrative Contact"
                            data={
                              ipIntelligence.whois?.contacts?.administrative
                            }
                          />

                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-theme">
                            <WhoisField
                              label="Organization"
                              value={
                                ipIntelligence.whois?.org ||
                                ipIntelligence.whois?.name
                              }
                            />
                            <WhoisField
                              label="Network Owner"
                              value={ipIntelligence.whois?.network_owner}
                            />
                            <WhoisField
                              label="CIDR Range"
                              value={ipIntelligence.whois?.cidr}
                            />
                            <WhoisField
                              label="Registrar"
                              value={ipIntelligence.whois?.registrar}
                            />
                            <WhoisField
                              label="Registered Date"
                              value={ipIntelligence.whois?.registered}
                            />
                            <WhoisField
                              label="Top Level Domain"
                              value={ipIntelligence.whois?.tld}
                            />
                            <WhoisField
                              label="Website"
                              value={ipIntelligence.whois?.website}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border border-theme shadow-sm flex-1 flex flex-col items-center justify-center py-60 gap-4 text-center">
                    <div className="w-16 h-16 bg-slate-500/5 rounded-full flex items-center justify-center border border-theme animate-pulse">
                      <ArrowRight className="text-slate-300" size={32} />
                    </div>
                    <div className="max-w-xs">
                      <h4 className="text-[12px] font-black text-foreground uppercase tracking-[0.3em] opacity-80">
                        IP SEARCHING
                      </h4>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-card border-2 border-theme p-8 max-w-md w-full relative shadow-2xl flex flex-col items-center text-center rounded-none"
            >
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-4">
                PDF Securely Encrypted
              </h3>

              <div className="space-y-4 text-left w-full mb-8">
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed text-center">
                  To open the downloaded report, please use PDF password.
                </p>
                <div className="bg-slate-500/5 border border-theme p-4 text-[12px] font-black text-foreground/90 uppercase tracking-wider space-y-2 text-center rounded-none">
                  <div className="text-blue-500">Password Formula:</div>
                  <div className="text-[13px] lowercase font-mono bg-card px-3 py-2 border border-theme inline-block select-all whitespace-nowrap">
                    username(first 5) + @ + password(first 5)
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 italic text-center font-medium leading-normal">
                  Example: If username is <strong>admin1</strong> and password
                  is <strong>password</strong>, the PDF password is{" "}
                  <strong className="font-mono not-italic text-blue-500">
                    admin@passw
                  </strong>
                  .
                </p>
              </div>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-[12px] uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 rounded-none"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

DetailRow.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string,
  value: PropTypes.string,
  subValue: PropTypes.string,
  color: PropTypes.string,
};

function DetailRow({ icon: Icon, label, value, subValue, color }) {
  const colorMap = {
    blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
    purple: "text-purple-500 bg-purple-500/5 border-purple-500/10",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/10",
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
    indigo: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10",
    slate: "text-slate-500 bg-slate-500/5 border-slate-500/10",
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/10",
  };

  return (
    <div
      className={`flex flex-col p-6 rounded-none border ${
        colorMap[color] || colorMap.slate
      } space-y-3`}
    >
      <div className="flex items-center gap-4">
        <Icon size={30} className="shrink-0" />
        <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300">
          {label}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-[14px] dark:text-slate-400 break-all mt-1">
          {value || "N/A"}
        </div>

        {subValue && (
          <div className="text-[12px] text-slate-400 mt-0.5">{subValue}</div>
        )}
      </div>
    </div>
  );
}

WhoisSection.propTypes = {
  title: PropTypes.string,
  data: PropTypes.object,
};

function WhoisSection({ title, data }) {
  if (!data) return null;

  return (
    <div className="p-6 bg-slate-500/[0.03] border border-theme rounded-none space-y-6">
      <h4 className="text-[14px] font-semibold text-blue-500 border-b border-blue-500/10 pb-3">
        {title}
      </h4>

      <div className="space-y-4">
        <WhoisField label="Name" value={data.name} />
        <WhoisField label="Email" value={data.email} />
        <WhoisField label="Phone" value={data.phone} />
        <WhoisField label="Handle" value={data.handle} />
        <WhoisField label="Address" value={data.address} />
      </div>
    </div>
  );
}

WhoisField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
};

function WhoisField({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
        {label}
      </div>
      <div className="text-[14px] break-words">{value || "N/A"}</div>
    </div>
  );
}
