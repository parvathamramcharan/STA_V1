"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Search,
  Filter,
  HardDrive,
  Clock,
  Activity,
  Hash,
  ArrowUp,
  ArrowDown,
  Shield,
  Globe,
  Shuffle,
  X,
  ChevronDown,
  FileText,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import CaptureSummary from "./CaptureSummary";
import TrafficDistribution from "./TrafficDistribution";
import PcapInsights from "./PcapInsights";
import { IPSearch } from "@/app/dashboard/IPSearch";
import {
  fetchPcapOverview,
  fetchPcapInsights,
  fetchPcapTimeline,
  fetchPcapConnections,
  fetchPcapGeoReport,
  fetchPcapDetails,
  fetchPcapMap,
  triggerPcapExport,
} from "./apiService";
import PropTypes from "prop-types";
import { DashboardReports } from "../../dashboard/DashboardReports";
import dynamic from "next/dynamic";
const WorldMapLeaflet = dynamic(
  () =>
    import("../../dashboard/WorldMapLeaflet").then(
      (mod) => mod.WorldMapLeaflet,
    ),
  { ssr: false },
);

export function formatBytes(bytes, precision = 2) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(precision)) +
    " " +
    sizes[i]
  );
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const ANTIGRAVITY_SPRING = {
  type: "spring",
  stiffness: 140,
  damping: 20,
  mass: 0.8,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.94,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...ANTIGRAVITY_SPRING,
      opacity: { duration: 0.4 },
    },
  },
  hover: {
    y: -10,
    scale: 1.02,
    transition: {
      ...ANTIGRAVITY_SPRING,
      stiffness: 240,
      damping: 18,
    },
  },
  floating: {
    y: [0, -4, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const StatItem = memo(({ label, value, icon: Icon, color, isSelected }) => {
  const colorMap = {
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    orange: "text-orange-500",
    purple: "text-purple-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
    slate: "text-slate-500",
  };
  const iconColor = colorMap[color] || "text-slate-400";

  return (
    <motion.div layout="position" className="flex items-center gap-3 h-9">
      <div
        className={`flex items-center justify-center shrink-0 transition-colors ${isSelected ? "text-white" : iconColor}`}
      >
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <div
          className={`text-[16px] font-bold font-sans tabular-nums leading-tight truncate ${isSelected ? "text-white" : "text-foreground"}`}
        >
          {value}
        </div>
        <div
          className={`text-[11px] font-semibold font-sans uppercase tracking-wide leading-none mt-1 whitespace-nowrap ${isSelected ? "text-blue-100/60" : "text-slate-500 dark:text-slate-400"}`}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
});

StatItem.displayName = "StatItem";

StatItem.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.elementType,
  color: PropTypes.string,
  isSelected: PropTypes.bool,
};

const PcapCard = memo(({ file, isSelected, onClick }) => {
  return (
    <motion.div
      layout
      initial="hidden"
      animate={["visible", "floating"]}
      exit="hidden"
      whileHover="hover"
      variants={cardVariants}
      key={file.pcap_id}
      onClick={onClick}
      className={`relative flex flex-col min-h-[270px] cursor-pointer border-2 rounded-xl p-5 pt-8 justify-start gap-5 overflow-hidden transition-colors duration-300 will-change-transform transform-gpu ${
        isSelected
          ? "bg-blue-600 border-blue-600 ring-2 ring-blue-600 shadow-2xl shadow-blue-500/30 z-20"
          : `bg-slate-500/[0.01] border-blue-400/40 shadow-blue-500/10 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 z-10`
      }`}
    >
      {/* <div className="relative z-10 flex flex-col items-start text-left gap-1.5 h-[72px]"> */}
      <div className="relative z-10 flex flex-col gap-1.5 h-[60px]">
        <span
          className={`font-bold text-[10px] uppercase tracking-[0.12em] whitespace-nowrap ${isSelected ? "text-blue-100/70" : "text-blue-600/70 dark:text-slate-400"}`}
        >
          PCAP File :
        </span>
        <div className="pr-2">
          <div
            className={`font-sans font-bold text-[15px] leading-[1.35] line-clamp-2 tracking-tight h-[36px] ${isSelected ? "text-white" : "text-foreground"}`}
            title={file.filename}
          >
            {file.filename}
          </div>
        </div>
      </div>

      {/* Telemetry Matrix */}
      <div className="relative z-10 grid grid-cols-2 gap-x-3 gap-y-9 pt-1">
        <StatItem
          label="Size"
          useEffect
          value={formatBytes(file.size)}
          icon={HardDrive}
          color="slate"
          isSelected={isSelected}
        />
        <StatItem
          label="Packets"
          value={file.packets.toLocaleString()}
          icon={Activity}
          color="emerald"
          isSelected={isSelected}
        />
        <StatItem
          label="Duration"
          value={formatDuration(file.duration)}
          icon={Clock}
          color="amber"
          isSelected={isSelected}
        />
        <StatItem
          label="External IPs"
          value={file.ip_count}
          icon={Hash}
          color="purple"
          isSelected={isSelected}
        />
      </div>
    </motion.div>
  );
});

PcapCard.displayName = "PcapCard";

PcapCard.propTypes = {
  file: PropTypes.shape({
    pcap_id: PropTypes.string,
    infected_host: PropTypes.string,
    filename: PropTypes.string,
    size: PropTypes.number,
    packets: PropTypes.number,
    duration: PropTypes.number,
    ip_count: PropTypes.number,
  }),
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
};

const TABS = [
  { id: "Pcap Summary", icon: LayoutDashboard, color: "blue" },
  { id: "IP Geomap", icon: Globe, color: "emerald" },
  { id: "Traffic Distribution", icon: Activity, color: "purple" },
  { id: "Pcap Insights", icon: Zap, color: "amber" },
  { id: "Reports", icon: FileText, color: "slate" },
  { id: "IP Search", icon: Search, color: "rose" },
];

export default function PcapClientView({ setId, initialResponse, session }) {
  // console.log("actual setId:", setId);
  // console.log("Initial response received:", initialResponse);
  // console.log("session:", session);
  const [pcapMode, setPcapMode] = useState(true);
  const initialData = initialResponse.data || [];
  const stats = initialResponse.repository_stats || {};

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Random");
  const [sortOrder, setSortOrder] = useState("desc");
  const [randomSeed, setRandomSeed] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Optimized Cache Matrix
  const [dataCache, setDataCache] = useState({});
  // console.log("DATA CACHE:", dataCache);
  const [selectedPcapId, setSelectedPcapId] = useState(null);
  const [activeTab, setActiveTab] = useState("Pcap Summary");
  const selectedFile =
    initialData.find((f) => f.pcap_id === selectedPcapId) || null;
  const [urlInitialized, setUrlInitialized] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    const pcap = url.searchParams.get("pcap");
    const tab = url.searchParams.get("tab");
    console.log("first useffect called  (reading urls)");

    if (pcap) {
      setSelectedPcapId(pcap);
    }
    if (tab) {
      setActiveTab(tab);
    }
    setUrlInitialized(true); // I read the url and got pcap and tab
  }, []);

  //same runs initilay once after page started , here it registers and unregister event listerners
  //such that when an event(click an next  button) this is an event  ...will  be called and such that popstate execute
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const pcap = url.searchParams.get("pcap");
      const tab = url.searchParams.get("tab");
      setSelectedPcapId(pcap);
      setActiveTab(tab || "Pcap Summary");
      console.log("pop state executed");
    };
    window.addEventListener("popstate", handlePopState);
    console.log("pop state listener added");
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const [overviewData, setOverviewData] = useState(null);
  const [connectionsData, setConnectionsData] = useState(null);
  const [connectionsPagination, setConnectionsPagination] = useState(null);
  const [connectionsPage, setConnectionsPage] = useState(1);
  const [insightsData, setInsightsData] = useState(null);
  const [mapData, setMapData] = useState([]);
  const [timelineData, setTimelineData] = useState(null);
  const [reportInitialMode, setReportInitialMode] = useState("country");
  const [timeFilter, setTimeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleCardClick = useCallback((pcapId, isSelected) => {
    const url = new URL(window.location.href);

    if (isSelected) {
      setSelectedPcapId(null);
      setActiveTab("Pcap Summary");
      url.searchParams.delete("pcap");
      url.searchParams.delete("tab");
    } else {
      setSelectedPcapId(pcapId);
      setActiveTab("Pcap Summary");
      url.searchParams.set("pcap", pcapId);
      url.searchParams.set("tab", "Pcap Summary");
    }

    window.history.pushState({}, "", url);
    // console.log("Card clicked, URL updated:", url.toString());
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", url);
    // console.log("Tab changed to:", tabId);
  }, []);

  //purpose : when selected pcap changes  , load the requested data and store in the react state
  //  it runs when selected pcap file changes or data caches changes
  // it first checks data present in cache or not , if yes use it else fetch it ,store and use
  useEffect(() => {
    if (!selectedFile) {
      setOverviewData(null);
      setConnectionsData(null);
      return;
    }

    const loadData = async () => {
      const cacheKey = `pcap-core-${selectedFile.pcap_id}`;
      if (dataCache[cacheKey]) {
        setOverviewData(dataCache[cacheKey].overview);
        setTimelineData(dataCache[cacheKey].timeline);
        return;
      }

      setIsLoadingDetails(true);
      setApiError(null);
      try {
        const [overview, timeline] = await Promise.all([
          fetchPcapOverview(selectedFile.pcap_id),
          fetchPcapTimeline(selectedFile.pcap_id),
        ]);
        setOverviewData(overview);
        setTimelineData(timeline);
        setDataCache((prev) => ({
          ...prev,
          [cacheKey]: { overview, timeline },
        }));
      } catch (err) {
        console.error("Data load failed:", err);
        setApiError(
          "Unable to connect to analysis server. Please try again later.",
        );
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadData();
  }, [selectedFile?.pcap_id, dataCache]);

  // Reset connections state when PCAP changes
  useEffect(() => {
    if (selectedFile) {
      setConnectionsPage(1);
      setConnectionsData(null);
      setConnectionsPagination(null);
      setTimeFilter("");
    }
  }, [selectedFile?.pcap_id]);

  useEffect(() => {
    if (
      !selectedFile ||
      (activeTab !== "Pcap Insights" && activeTab !== "IP Geomap")
    )
      return;
    if (insightsData && insightsData.pcap_id === selectedFile.pcap_id) return;

    const loadInsights = async () => {
      setIsLoadingDetails(true);
      try {
        const data = await fetchPcapInsights(selectedFile.pcap_id);
        setInsightsData({ ...data, pcap_id: selectedFile.pcap_id });
      } catch (err) {
        console.error("Insights load failed:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadInsights();
  }, [selectedFile?.pcap_id, activeTab]);

  // Load per-pcap map data from the backend map endpoint when IP Geomap tab is active
  useEffect(() => {
    if (!selectedFile || activeTab !== "IP Geomap") return;

    const loadMap = async () => {
      try {
        const mapResp = await fetchPcapMap(selectedFile.pcap_id);
        // mapResp may be an object with `external_ips` or a list directly
        const ips = Array.isArray(mapResp)
          ? mapResp
          : mapResp.external_ips || mapResp.data || [];
        setMapData(ips);
      } catch (err) {
        console.error("Map load failed:", err);
        setMapData([]);
      }
    };

    loadMap();
  }, [selectedFile?.pcap_id, activeTab]);

  useEffect(() => {
    if (!selectedFile || activeTab !== "Pcap Summary") return;

    const loadConnections = async () => {
      const cacheKey = `pcap-conn-${selectedFile.pcap_id}-${connectionsPage}-${timeFilter}`;
      if (dataCache[cacheKey]) {
        setConnectionsData(dataCache[cacheKey].data);
        setConnectionsPagination(dataCache[cacheKey].pagination);
        return;
      }

      setIsLoadingConnections(true);
      try {
        const response = await fetchPcapConnections(
          selectedFile.pcap_id,
          connectionsPage,
          timeFilter,
        );

        // Robust data extraction
        let rawData = response.data || response.connections || response;
        if (rawData && !Array.isArray(rawData) && typeof rawData === "object") {
          rawData =
            rawData.connections || rawData.data || rawData.results || [];
        }
        const data = Array.isArray(rawData) ? rawData : [];

        // Prioritize API pagination if available
        let pagination = response.pagination || response.meta || null;

        if (!pagination) {
          // Fallback to overview data or local count
          const total =
            overviewData?.capture_summary?.connections || data.length;
          pagination = {
            total: total,
            total_pages: Math.ceil(total / 100),
            page: connectionsPage,
            limit: 100,
          };
        } else if (
          overviewData?.capture_summary?.connections &&
          pagination.total < overviewData.capture_summary.connections
        ) {
          // If API says fewer than summary, but summary is reliable, we can use summary for total
          // but only if we trust the API is returning a subset
          pagination.total = overviewData.capture_summary.connections;
          pagination.total_pages = Math.ceil(
            pagination.total / (pagination.limit || 100),
          );
        }

        setConnectionsData(data);
        setConnectionsPagination(pagination);
        setDataCache((prev) => ({ ...prev, [cacheKey]: { data, pagination } }));
      } catch (err) {
        console.error("Connections load failed:", err);
      } finally {
        setIsLoadingConnections(false);
      }
    };

    loadConnections();
  }, [selectedFile?.pcap_id, connectionsPage, timeFilter, activeTab]);

  const [selectedIpForSearch, setSelectedIpForSearch] = useState("");

  const handleIpClick = useCallback((ip) => {
    setActiveTab("IP Search");
    if (ip) {
      setSelectedIpForSearch(ip);
    }
  }, []);

  const sortedData = useMemo(() => {
    const filteredData = initialData.filter((item) =>
      item.filename.toLowerCase().includes(search.toLowerCase()),
    );

    // Apply date range filtering when set
    const filteredAndDated = filteredData.filter((item) => {
      if (!dateFrom && !dateTo) return true;

      const itemStartDate = item.start_time
        ? item.start_time.slice(0, 10)
        : null;
      const itemEndDate = item.end_time ? item.end_time.slice(0, 10) : null;
      if (!itemStartDate && !itemEndDate) return false;

      const fromDate = dateFrom || null;
      const toDate = dateTo || null;

      const fromOK =
        !fromDate ||
        (itemStartDate
          ? itemStartDate >= fromDate
          : itemEndDate
            ? itemEndDate >= fromDate
            : false);
      const toOK =
        !toDate ||
        (itemEndDate
          ? itemEndDate <= toDate
          : itemStartDate
            ? itemStartDate <= toDate
            : false);

      return fromOK && toOK;
    });

    const result = [...filteredAndDated];
    const orderMultiplier = sortOrder === "asc" ? 1 : -1;

    if (filter === "Random") {
      result.sort((a, b) => {
        const seedA =
          (Number.parseInt(a.pcap_id.substring(0, 4), 16) || 0) + randomSeed;
        const seedB =
          (Number.parseInt(b.pcap_id.substring(0, 4), 16) || 0) + randomSeed;
        return Math.sin(seedA) - Math.sin(seedB);
      });
    }
    if (filter === "Size")
      result.sort((a, b) => (a.size - b.size) * orderMultiplier);
    if (filter === "Duration")
      result.sort((a, b) => (a.duration - b.duration) * orderMultiplier);
    if (filter === "Packets")
      result.sort((a, b) => (a.packets - b.packets) * orderMultiplier);
    if (filter === "Date") {
      result.sort((a, b) => {
        const aDate = a.start_time || a.end_time || "";
        const bDate = b.start_time || b.end_time || "";
        return (new Date(aDate) - new Date(bDate)) * orderMultiplier;
      });
    }
    if (filter === "External IPs")
      result.sort((a, b) => (a.ip_count - b.ip_count) * orderMultiplier);

    return result;
  }, [initialData, search, dateFrom, dateTo, filter, sortOrder, randomSeed]);

  const handleFilterClick = (label) => {
    if (label === "Random") {
      setFilter("Random");
      setRandomSeed((prev) => prev + 1);
      return;
    }

    if (filter === label) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setFilter(label);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const FilterBtn = ({ label }) => {
    const isActive = filter === label;
    return (
      <button
        onClick={() => handleFilterClick(label)}
        className={`flex items-center gap-1.5 px-3 py-1.5 font-sans rounded-md border transition-all ${
          isActive
            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
            : "bg-card border-theme  hover:text-foreground hover:bg-slate-500/5"
        }`}
      >
        {label}
        {isActive &&
          (label === "Random" ? (
            <Shuffle
              size={14}
              className="text-white animate-in zoom-in duration-300"
            />
          ) : sortOrder === "asc" ? (
            <ArrowUp size={14} className="text-white" />
          ) : (
            <ArrowDown size={14} className="text-white" />
          ))}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 pb-10">
      {!selectedFile && (
        <>
          <div className="flex items-center justify-between shrink-0 p t-1">
            <h1 className="text-[22px] font-bold tracking-tight font-sans text-foreground flex items-center gap-3 ml-6">
              {setId == 1 && "PCAP Set 1"}
              {setId == 2 && "Sinkhole Packets"}
              <span className="text-amber-500 text-sm font-sans  bg-amber-500/10 px-3 py-1 rounded-none border border-amber-500/20">
                {stats.total_pcaps || initialData.length} Files
              </span>
              {stats.repository_size && (
                <span className="text-blue-500 text-sm font-medium bg-blue-500/10 px-3 py-1 rounded-none border border-blue-500/20">
                  {formatBytes(stats.repository_size)} Total
                </span>
              )}
              {stats.observed_ips && (
                <span className="text-emerald-500 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-none border border-emerald-500/20">
                  {/* {stats.observed_ips.toLocaleString()} External IPs */}
                  {stats.observed_ips.toLocaleString("en-US")} External IPs
                </span>
              )}

              {setId == 2 && (
                <Link
                  href="/pcaps/set-2/dnssinkhole"
                  className="group relative inline-flex items-center gap-2 px-3 py-1.5
             text-sm font-semibold text-red-500
             border border-red-500/30
             bg-red-500/[0.04]
             hover:bg-red-500/[0.08]
             hover:border-red-500/50
             transition-all duration-200"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>

                  <span>DNS Sinkholing</span>
                </Link>
              )}
            </h1>

            <div className="relative w-[600px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search pcap files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-card border border-theme rounded-none text-[13px] font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-theme shadow-sm shrink-0">
            <div className="flex items-center gap-1.5">
              <Filter size={15} className="text-slate-400 mx-1.5" />
              <FilterBtn label="Random" />
              <FilterBtn label="Size" />
              <FilterBtn label="Duration" />
              <FilterBtn label="Packets" />
              <FilterBtn label="External IPs" />
              <FilterBtn label="Date" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-card rounded-md px-2 py-1 border border-theme">
                <label className="text-[12px] font-medium text-slate-500 font-sans">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className=" font-sans px-2 py-1 bg-transparent border border-transparent rounded-md"
                  placeholder="dd/mm/yyyy"
                />
                <label className="text-[12px] font-medium text-slate-500 font-sans">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className=" font-sans px-2 py-1 bg-transparent border border-transparent rounded-md"
                  placeholder="dd/mm/yyyy"
                />
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-sans rounded-md border transition-all bg-card border-theme  hover:text-foreground hover:bg-slate-500/5`}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="px-4 text-[11px] font-black text-foreground uppercase tracking-widest border-l border-theme ml-2">
              <span className="text-blue-600">
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, sortedData.length)}
              </span>{" "}
              <span className=" px-1 normal-case font-sans">of</span>{" "}
              <span className="text-foreground fomt-serif">
                {sortedData.length}
              </span>{" "}
              PCAPs
            </div>
          </div>

          <div
            className={`transition-all duration-500 ease-in-out overflow-y-auto pr-2 pb-2 overflow-x-hidden custom-scrollbar ${
              selectedFile ? "h-[32vh]" : "h-[78vh]"
            }`}
          >
            <LayoutGroup>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-2"
                style={{ contain: "layout paint" }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {sortedData
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage,
                    )
                    .map((file, idx) => {
                      const isSelected = selectedFile?.pcap_id === file.pcap_id;

                      return (
                        <PcapCard
                          key={file.pcap_id}
                          file={file}
                          isSelected={isSelected}
                          onClick={() =>
                            handleCardClick(file.pcap_id, isSelected)
                          }
                        />
                      );
                    })}
                </AnimatePresence>
              </motion.div>
            </LayoutGroup>

            {/* Pagination UI */}
            {sortedData.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-all ${
                    currentPage === 1
                      ? "text-slate-300 border-slate-100 cursor-not-allowed"
                      : "text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({
                    length: Math.ceil(sortedData.length / itemsPerPage),
                  }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === Math.ceil(sortedData.length / itemsPerPage) ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[36px] h-9 px-2 rounded-lg border text-sm font-bold transition-all ${
                            currentPage === pageNum
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-600 shadow-sm"
                              : "bg-card border-theme text-slate-500 hover:border-blue-500 hover:text-blue-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span key={pageNum} className="px-1 text-slate-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        Math.ceil(sortedData.length / itemsPerPage),
                        prev + 1,
                      ),
                    )
                  }
                  disabled={
                    currentPage === Math.ceil(sortedData.length / itemsPerPage)
                  }
                  className={`p-2 rounded-lg border transition-all ${
                    currentPage === Math.ceil(sortedData.length / itemsPerPage)
                      ? "text-slate-300 border-slate-100 cursor-not-allowed"
                      : "text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full min-w-0 bg-background"
          >
            <div className="w-full overflow-hidden">
              <div className="mx-6 mt-4 flex items-center overflow-visible rounded-2xl border border-blue-400/40 bg-slate-50 shadow-[0_0_0_1px_rgba(59,130,246,0.06),0_0_25px_rgba(59,130,246,0.10)] dark:border-blue-400/25 dark:bg-slate-900 dark:shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_0_30px_rgba(59,130,246,0.12)]">
                <div className="flex min-w-0 flex-1 items-center overflow-visible">
                  {TABS.map((tab) => {
                    if (tab.id === "Reports") {
                      return (
                        <div key={tab.id} className="flex-1 relative group">
                          <button
                            onClick={() => {
                              handleTabChange("Reports");
                              setReportInitialMode("country");
                            }}
                            className={`relative flex w-full h-14 items-center justify-center gap-2.5 px-4 text-[15px] font-semibold transition-all duration-200 border-r border-blue-200/40 dark:border-blue-400/15 ${
                              activeTab === "Reports"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                            }`}
                          >
                            <tab.icon
                              size={16}
                              strokeWidth={2}
                              className={`transition-all duration-200 ${
                                activeTab === "Reports"
                                  ? "text-blue-500 drop-shadow-[0_0_7px_rgba(59,130,246,0.7)]"
                                  : "text-slate-400 dark:text-slate-500"
                              }`}
                            />

                            <span>Reports</span>

                            <ChevronDown
                              size={14}
                              className={`transition-all duration-200 ${
                                activeTab === "Reports"
                                  ? "text-blue-500"
                                  : "text-blue-500/80 group-hover:text-blue-500 dark:text-blue-400/80 dark:group-hover:text-blue-400"
                              }`}
                            />

                            {activeTab === "Reports" && (
                              <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            )}
                          </button>

                          <div className="invisible absolute left-1/2 top-[calc(100%+8px)] z-50 w-[260px] -translate-x-1/2 translate-y-1 rounded-xl border border-blue-300/40 bg-white p-2 opacity-0 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-blue-400/25 dark:bg-slate-900 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                            <div className="px-3 pb-2 pt-1">
                              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                Explore reports by
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                handleTabChange("Reports");
                                setReportInitialMode("country");
                              }}
                              className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                                reportInitialMode === "country"
                                  ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                  : "text-slate-600 hover:bg-blue-500/5 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                              }`}
                            >
                              Countries
                            </button>

                            <button
                              onClick={() => {
                                handleTabChange("Reports");
                                setReportInitialMode("isp");
                              }}
                              className={`mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                                reportInitialMode === "isp"
                                  ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                  : "text-slate-600 hover:bg-blue-500/5 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                              }`}
                            >
                              ISPs
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={tab.id}

                        onClick={() => handleTabChange(tab.id)}
                        className={`relative flex h-14 flex-1 items-center justify-center gap-2.5 whitespace-nowrap px-4 text-[15px] font-semibold font-sans transition-all duration-200 border-r border-blue-200/40 dark:border-blue-400/15 last:border-r-0 ${
                          activeTab === tab.id
                            ? "text-blue-600 bg-blue-500/5 dark:text-blue-400"
                            : "text-slate-700 hover:text-blue-600 hover:bg-blue-500/5 dark:text-slate-300 dark:hover:text-blue-400"
                        }`}
                      >
                        <tab.icon
                          size={14}
                          className={
                            activeTab === tab.id
                              ? "text-blue-600"
                              : "text-slate-800 dark:text-slate-400"
                          }
                        />
                        {tab.id}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  // onClick={() => setSelectedPcapId(null)}
                  onClick={() => handleCardClick(selectedFile.pcap_id, true)}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-r-2xl border-l border-blue-200/40 bg-rose-500/5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white dark:border-blue-400/15"
                >
                  <X
                    size={20}
                    className="group-hover:rotate-90 transition-transform duration-300"
                  />
                </button>
              </div>

              <div className="max-h-[calc(100vh-190px)] overflow-y-auto custom-scrollbar pb-6">
                <div className="flex flex-col">
                  <div className="mx-6 mt-4 mb-2 rounded-xl border border-blue-200/60 bg-slate-50 px-6 py-4 shadow-sm dark:border-blue-400/15 dark:bg-slate-900">
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-[11px] font-semibold  tracking-[0.16em] text-blue-600/70 dark:text-blue-400/70">
                        PCAP Filename
                      </span>
                      <span
                        className="font-sans text-[15px] font-semibold leading-6 text-foreground break-all"
                        title={selectedFile.filename}
                      >
                        {selectedFile.filename}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 pt-2">
                    {isLoadingDetails ? (
                      <div className="p-8 space-y-8 animate-pulse">
                        <div className="grid grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-36 bg-slate-500/5 rounded-none border border-slate-200"
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="h-64 bg-slate-500/5 rounded-none border border-slate-200" />
                          <div className="h-64 bg-slate-500/5 rounded-none border border-slate-200" />
                        </div>
                        <div className="h-80 bg-slate-500/5 rounded-none border border-slate-200" />
                      </div>
                    ) : apiError ? (
                      <div className="flex items-center justify-center h-48 text-rose-500 font-bold bg-rose-500/5 rounded-2xl border border-rose-500/10">
                        {apiError}
                      </div>
                    ) : activeTab === "Pcap Summary" && overviewData ? (
                      <CaptureSummary
                        overviewData={overviewData}
                        connectionsData={connectionsData}
                        timelineData={timelineData}
                        connectionsPagination={connectionsPagination}
                        connectionsPage={connectionsPage}
                        setConnectionsPage={setConnectionsPage}
                        timeFilter={timeFilter}
                        setTimeFilter={setTimeFilter}
                        isLoadingConnections={isLoadingConnections}
                        onIpClick={handleIpClick}
                        pcapId={selectedFile?.pcap_id}
                        onTimelineClick={(from, to) => {
                          setDateFrom(from);
                          setDateTo(to);
                          setCurrentPage(1);
                        }}
                      />
                    ) : activeTab === "Traffic Distribution" && overviewData ? (
                      <TrafficDistribution
                        data={overviewData.traffic_distribution}
                      />
                    ) : activeTab === "Pcap Insights" && insightsData ? (
                      <PcapInsights
                        data={insightsData}
                        onIpClick={handleIpClick}
                      />
                    ) : activeTab === "IP Geomap" ? (
                      <div className="h-[750px] w-full rounded-none overflow-hidden border border-theme relative group shadow-2xl transition-colors bg-card">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_70%)] pointer-events-none z-10" />
                        <WorldMapLeaflet
                          mode="pcap"
                          externalIps={mapData}
                          onIpClick={handleIpClick}
                        />
                      </div>
                    ) : activeTab === "IP Search" ? (
                      <IPSearch
                        initialIp={selectedIpForSearch}
                        onScanComplete={() => setSelectedIpForSearch("")}
                      />
                    ) : activeTab === "Reports" && selectedFile ? (
                      <DashboardReports
                        pcapId={selectedFile.pcap_id}
                        initialMode={reportInitialMode}
                        customFetchGeo={fetchPcapGeoReport}
                        customFetchDetails={fetchPcapDetails}
                        customTriggerExport={triggerPcapExport}
                        session={session}
                      />
                    ) : (
                      <div className="bg-slate-500/5 border border-theme border-dashed rounded-[3rem] flex items-center justify-center text-slate-500 h-[500px] font-black text-xs uppercase tracking-widest opacity-40">
                        Detailed {activeTab} widgets under construction
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

PcapClientView.propTypes = {
  setId: PropTypes.string,
  initialResponse: PropTypes.shape({
    data: PropTypes.array,
    repository_stats: PropTypes.object,
  }),
  session: PropTypes.object,
};
