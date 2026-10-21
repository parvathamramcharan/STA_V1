"use client";

import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import {
  LayoutDashboard,
  FileText,
  Activity,
  Globe,
  Search,
  ChevronDown,
} from "lucide-react";

import { WorldMapLeaflet } from "./WorldMapLeaflet";
import { DashboardSummary } from "./DashboardSummary";
import { DashboardStats } from "./DashboardStats";
import TrafficDistribution from "../pcaps/[setId]/TrafficDistribution";
import { IPSearch } from "./IPSearch";
import { DashboardReports } from "./DashboardReports";

import {
  fetchGlobalMapData,
  fetchDashboardOverview,
  fetchDashboardInsights,
} from "./dashboardApiService";

DashboardClientView.propTypes = {
  session: PropTypes.object,
};

export default function DashboardClientView({ session }) {
  const [activeTab, setActiveTab] = useState("Pcap Summary");
  const [reportInitialMode, setReportInitialMode] = useState("country");

  const tabBarRef = useRef(null);

  const [data, setData] = useState(null);
  const [mapData, setMapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------
  // Read active tab from URL
  // ---------------------------------------------------------
  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");

    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  // ---------------------------------------------------------
  // Handle browser back / forward
  // ---------------------------------------------------------
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const tab = url.searchParams.get("tab");

      if (tab) {
        setActiveTab(tab);
      } else {
        setActiveTab("Pcap Summary");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // ---------------------------------------------------------
  // Dashboard data
  // ---------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        console.log("[Dashboard] Starting data fetch...");

        const [overview, insights, globalMap] = await Promise.all([
          fetchDashboardOverview().then((d) => {
            console.log("[Dashboard] Overview loaded");
            return d;
          }),

          fetchDashboardInsights().then((d) => {
            console.log("[Dashboard] Insights loaded");
            return d;
          }),

          fetchGlobalMapData().then((d) => {
            console.log("[Dashboard] Map data loaded");
            return d;
          }),
        ]);

        console.log("[Dashboard] All data received successfully");

        // -----------------------------------------------------
        // Map data
        // -----------------------------------------------------
        setMapData(globalMap.data || []);

        // -----------------------------------------------------
        // Dashboard data
        // -----------------------------------------------------
        const summary = overview.capture_summary || {};
        const traffic = overview.traffic_distribution || {};
        const trends = insights.insights_trends || {};

        setData({
          summary: {
            total_pcaps: summary.total_pcaps || 0,
            pcap_packets: summary.pcap_packets || 0,
            internal_ip_count: summary.internal_ip_count || 0,
            infected_hosts_count: summary.infected_hosts_count || 0,
            external_ip_count: summary.external_ip_count || 0,
            duration_seconds: summary.duration_seconds || 0,
            bytes: summary.bytes || 0,
            connections: summary.connections || 0,
            ftp_sessions_count: summary.ftp_sessions_count || 0,
            file_size: summary.file_size || 0,
          },

          traffic_distribution: traffic,

          stats_details: {
            top_active_ips: trends.top_active_ips || [],
            top_countries: trends.top_countries || [],
            top_cities: trends.top_cities || [],
            top_isps: trends.top_isps || [],
            infected_hosts:
              summary.infected_hosts || trends.infected_hosts || [],
          },
        });
      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // ---------------------------------------------------------
  // Scroll to tab navigation
  //
  // The tab bar sits below the main header.
  // When a tab is clicked, immediately bring the tab bar
  // into its sticky position.
  // ---------------------------------------------------------
  const scrollToTabBar = () => {
    if (!tabBarRef.current) return;

    const headerOffset = 56;

    const elementTop =
      tabBarRef.current.getBoundingClientRect().top + window.pageYOffset;

    window.scrollTo({
      top: Math.max(0, elementTop - headerOffset),
      behavior: "auto",
    });
  };

  // ---------------------------------------------------------
  // Tab change
  // ---------------------------------------------------------
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);

    window.history.pushState({}, "", url);

    /*
     * Scroll immediately after changing the active tab.
     *
     * requestAnimationFrame gives React one render cycle
     * before calculating the tab bar position.
     */
    requestAnimationFrame(() => {
      scrollToTabBar();
    });
  };

  // ---------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------
  const tabs = [
    {
      id: "Pcap Summary",
      icon: LayoutDashboard,
    },
    {
      id: "Traffic Distribution",
      icon: Activity,
    },
    {
      id: "IP Search",
      icon: Search,
    },
    {
      id: "Pcap Insights",
      icon: Globe,
    },
    {
      id: "Reports",
      icon: FileText,
    },
  ];

  // ---------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------
  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

        <p className="animate-pulse text-sm font-bold text-slate-500">
          Fetching Data...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="space-y-0 pb-10">
      {/* =====================================================
          WORLD MAP
          ===================================================== */}
      <div className="mx-6 mt-4 h-[clamp(500px,68vh,680px)] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(71,85,105,0.14),0_2px_10px_rgba(71,85,105,0.06)] dark:border-slate-700/70 dark:bg-slate-900 dark:shadow-[0_20px_50px_rgba(2,6,23,0.38)]">
        <WorldMapLeaflet
          mode="summary"
          countryData={mapData}
          title="Overall IP Geo Distribution"
        />
      </div>

      {/* =====================================================
          TAB NAVIGATION
          =====================================================

          IMPORTANT:
          - Sticky below the main header
          - Opaque background prevents charts from showing
            through the navigation
          - z-index keeps it above all dashboard content
          ===================================================== */}
      <div
        ref={tabBarRef}
        className="sticky top-14 z-30 w-full bg-white py-4  dark:bg-slate-950"
      >
        <div className="mx-6">
          {/* -------------------------------------------------
              Main navigation shell
              ------------------------------------------------- */}
          <div
            className="
              relative
              flex
              w-full
              overflow-visible
              rounded-2xl
              border
              border-blue-400/40
              bg-slate-50
              shadow-[0_0_0_1px_rgba(59,130,246,0.06),0_0_25px_rgba(59,130,246,0.10)]

              dark:border-blue-400/25
              dark:bg-slate-900
              dark:shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_0_30px_rgba(59,130,246,0.12)]
            "
          >
            {/* -------------------------------------------------
                Subtle top highlight
                ------------------------------------------------- */}
            <div
              className="
                pointer-events-none
                absolute
                left-6
                right-6
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-blue-400/60
                to-transparent
                dark:via-blue-400/40
              "
            />

            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;

              // =================================================
              // REPORTS TAB
              // =================================================
              if (tab.id === "Reports") {
                return (
                  <div key={tab.id} className="group relative flex-1">
                    <button
                      onClick={() => {
                        handleTabChange("Reports");
                        setReportInitialMode("country");
                      }}
                      className={`
                        relative
                        flex
                        h-14
                        w-full
                        items-center
                        justify-center
                        gap-2.5
                        px-4
                        text-[15px]
                        font-semibold
                        transition-all
                        duration-200

                        ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                        }
                      `}
                    >
                      {/* Reports icon */}
                      <FileText
                        size={16}
                        strokeWidth={2}
                        className={`
                          transition-all
                          duration-200

                          ${
                            isActive
                              ? "text-blue-500 drop-shadow-[0_0_7px_rgba(59,130,246,0.7)]"
                              : "text-blue-500/80 group-hover:text-blue-500 dark:text-blue-400/80 dark:group-hover:text-blue-400"
                          }
                        `}
                      />

                      {/* Reports label */}
                      <span>Reports</span>

                      {/* Dropdown arrow */}
                      <ChevronDown
                        size={14}
                        className={`
                          transition-all
                          duration-200

                          ${
                            isActive
                              ? "text-blue-500"
                              : "text-blue-500/80 group-hover:text-blue-500 dark:text-blue-400/80 dark:group-hover:text-blue-400"
                          }
                        `}
                      />

                      {/* Active indicator */}
                      {isActive && (
                        <div
                          className="
                            absolute
                            bottom-0
                            left-6
                            right-6
                            h-[2px]
                            rounded-full
                            bg-blue-500
                            shadow-[0_0_8px_rgba(59,130,246,0.8)]
                          "
                        />
                      )}
                    </button>

                    {/* =================================================
                        REPORT DROPDOWN
                        ================================================= */}
                    <div
                      className="
                        invisible
                        absolute
                        left-1/2
                        top-[calc(100%+8px)]
                        z-50
                        w-[260px]
                        -translate-x-1/2
                        translate-y-1
                        rounded-xl
                        border
                        border-blue-300/40
                        bg-white
                        p-2
                        opacity-0
                        shadow-[0_20px_50px_rgba(15,23,42,0.18)]
                        backdrop-blur-xl
                        transition-all
                        duration-200

                        group-hover:visible
                        group-hover:translate-y-0
                        group-hover:opacity-100

                        dark:border-blue-400/25
                        dark:bg-slate-900
                        dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]
                      "
                    >
                      {/* Dropdown heading */}
                      <div className="px-3 pb-2 pt-1">
                        <p
                          className="
                            text-[11px]
                            font-bold
                            uppercase
                            tracking-[0.15em]
                            text-slate-400
                            dark:text-slate-500
                          "
                        >
                          Explore reports by
                        </p>
                      </div>

                      {/* -------------------------------------------------
                          Countries
                          ------------------------------------------------- */}
                      <button
                        onClick={() => {
                          handleTabChange("Reports");
                          setReportInitialMode("country");
                        }}
                        className={`
                          flex
                          w-full
                          items-center
                          rounded-lg
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          font-semibold
                          transition-all

                          ${
                            reportInitialMode === "country"
                              ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                              : "text-slate-600 hover:bg-blue-500/5 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                          }
                        `}
                      >
                        Countries
                      </button>

                      {/* -------------------------------------------------
                          ISPs
                          ------------------------------------------------- */}
                      <button
                        onClick={() => {
                          handleTabChange("Reports");
                          setReportInitialMode("isp");
                        }}
                        className={`
                          mt-1
                          flex
                          w-full
                          items-center
                          rounded-lg
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          font-semibold
                          transition-all

                          ${
                            reportInitialMode === "isp"
                              ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                              : "text-slate-600 hover:bg-blue-500/5 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                          }
                        `}
                      >
                        ISPs
                      </button>
                    </div>
                  </div>
                );
              }

              // =================================================
              // NORMAL TABS
              // =================================================
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    relative
                    flex
                    h-14
                    flex-1
                    items-center
                    justify-center
                    gap-2.5
                    px-4
                    text-[15px]
                    font-semibold
                    transition-all
                    duration-200

                    ${
                      index < tabs.length - 1
                        ? "border-r border-blue-200/40 dark:border-blue-400/15"
                        : ""
                    }

                    ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                    }
                  `}
                >
                  {/* Tab icon */}
                  <tab.icon
                    size={16}
                    strokeWidth={2}
                    className={`
                      transition-all
                      duration-200

                      ${
                        isActive
                          ? "text-blue-500 drop-shadow-[0_0_7px_rgba(59,130,246,0.7)]"
                          : "text-slate-400 dark:text-slate-500"
                      }
                    `}
                  />

                  {/* Tab label */}
                  <span>{tab.id}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <div
                      className="
                        absolute
                        bottom-0
                        left-6
                        right-6
                        h-[2px]
                        rounded-full
                        bg-blue-500
                        shadow-[0_0_8px_rgba(59,130,246,0.8)]
                      "
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================
          TAB CONTENT
          ===================================================== */}
      <div className="min-h-[calc(100vh-112px)]">
        {/* -----------------------------------------------------
            PCAP SUMMARY
            ----------------------------------------------------- */}
        {activeTab === "Pcap Summary" && (
          <DashboardSummary data={data.summary} />
        )}

        {/* -----------------------------------------------------
            TRAFFIC DISTRIBUTION
            ----------------------------------------------------- */}
        {activeTab === "Traffic Distribution" && (
          <div className="mx-6">
            <TrafficDistribution data={data.traffic_distribution} />
          </div>
        )}

        {/* -----------------------------------------------------
            IP SEARCH
            ----------------------------------------------------- */}
        {activeTab === "IP Search" && <IPSearch />}

        {/* -----------------------------------------------------
            PCAP INSIGHTS
            ----------------------------------------------------- */}
        {activeTab === "Pcap Insights" && (
          <DashboardStats stats={data.stats_details} />
        )}

        {/* -----------------------------------------------------
            REPORTS
            ----------------------------------------------------- */}
        {activeTab === "Reports" && (
          <DashboardReports initialMode={reportInitialMode} session={session} />
        )}
      </div>
    </div>
  );
}
