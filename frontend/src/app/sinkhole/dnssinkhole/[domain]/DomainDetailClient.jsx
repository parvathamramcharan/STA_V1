"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  FileText,
  Globe,
  Map,
  Network,
  Search,
  Server,
  X,
} from "lucide-react";
import DomainMap from "../components/DomainMap";
import DomainPcaps from "../components/DomainPcaps";
import DomainIsp from "../components/DomainIsp";
import DomainIp from "../components/DomainIp";
import IpSearch from "../components/IpSearch";

const DOMAIN_TABS = [
  { id: "Map", icon: Map },
  { id: "PCAPs", icon: FileText },
  { id: "ISP", icon: Server },
  { id: "IP", icon: Network },
  { id: "IPSearch", icon: Search },
];

export default function DomainDetailClient({ selectedDomain, pcapSetId }) {
  const [activeTab, setActiveTab] = useState("Map");
  const [selectedIp, setSelectedIp] = useState("");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== "IPSearch") {
      setSelectedIp("");
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
      <div className="relative mx-8 mb-1 mt-2 flex items-center gap-5 overflow-hidden border border-theme bg-card px-5 py-4 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-pink-500 ring-1 ring-amber-500/20">
          <Globe size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Domain
          </p>
          <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
            {selectedDomain.host}
          </h2>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Requests
          </p>
          <p className="flex items-center gap-1.5 text-lg font-semibold tabular-nums text-green-500">
            <Activity size={15} />
            {Number(selectedDomain.request_count).toLocaleString()}
          </p>
        </div>
        <Link
          href="/sinkhole/dnssinkhole"
          title="Close"
          aria-label="Back to DNS domains"
          className="group ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 transition-all hover:border-rose-500 hover:bg-rose-500 hover:text-white"
        >
          <X
            size={18}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
        </Link>
      </div>
      <div className="mx-8 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center overflow-hidden rounded-2xl border border-blue-400/40 bg-slate-50 shadow-[0_0_0_1px_rgba(59,130,246,0.06),0_0_25px_rgba(59,130,246,0.10)]   ">
          {DOMAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex h-14 flex-1 items-center justify-center gap-2 border-r border-theme text-sm font-semibold transition-all duration-200 last:border-r-0 ${
                  isActive
                    ? "bg-blue-500/5 text-blue-500"
                    : "text-foreground hover:bg-blue-500/5 hover:text-blue-500"
                }`}
              >
                <Icon
                  size={16}
                  className={
                    isActive ? "text-blue-500" : "text-muted-foreground"
                  }
                />
                <span>{tab.id === "IPSearch" ? "IP Search" : tab.id}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-1 min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-theme bg-card p-4">
          {activeTab === "Map" && (
            <DomainMap
              selectedDomain={selectedDomain}
              setActiveTab={setActiveTab}
              setSelectedIp={setSelectedIp}
            />
          )}
          {activeTab === "PCAPs" && (
            <DomainPcaps selectedDomain={selectedDomain} setId={pcapSetId} />
          )}
          {activeTab === "ISP" && (
            <DomainIsp
              selectedDomain={selectedDomain}
              setActiveTab={setActiveTab}
              setSelectedIp={setSelectedIp}
            />
          )}
          {activeTab === "IP" && (
            <DomainIp
              selectedDomain={selectedDomain}
              setActiveTab={setActiveTab}
              setSelectedIp={setSelectedIp}
            />
          )}
          {activeTab === "IPSearch" && <IpSearch initialIp={selectedIp} />}
        </div>
      </div>
    </div>
  );
}
