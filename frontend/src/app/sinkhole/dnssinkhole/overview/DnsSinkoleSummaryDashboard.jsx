"use client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  FileText,
  ArrowLeftRight,
  Radio,
  Server,
  Flag,
  MapPin,
  Building2,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getCountryFlagClass } from "@/app/dashboard/countryUtils";
import DomainLocationMap from "./DomainLocationMap";
const COLORS = ["#1677ff", "#a435f0", "#10b981", "#f59e0b"];
function SummaryCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <div
          className={`rounded-xl p-3 ${color} flex items-center justify-center`}
        >
          <Icon size={24} />
        </div>

        <div className="min-w-0">
          <p className="text-sm">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {(value ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Icon size={20} className="text-blue-600" />
        {title}
      </h2>

      {children}
    </section>
  );
}

function CountryDonut({ countries, totalDomains }) {
  const chartData = countries.map((country) => ({
    name: country.country,
    value: Number(country.domain_count ?? 0),
  }));

  return (
    <div className="relative h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip formatter={(value, name) => [`${value} domains`, name]} />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">
          {totalDomains ?? 0}
        </span>
        <span className="text-xs text-slate-500">Domains</span>
      </div>
    </div>
  );
}

export default function DnsSinkoleSummaryDashboard({
  pcapSetId,
  dnsdataSummary,
}) {
  const router = useRouter();
  const data = dnsdataSummary?.data ?? dnsdataSummary;

  if (!data) {
    return (
      <div className="p-6 text-center text-slate-500">
        No DNS Sinkhole summary available.
      </div>
    );
  }

  const domains = data.top_active_domains ?? [];
  const countries = data.top_countries ?? [];
  const isps = data.top_isps ?? [];

  const maxRequests = Math.max(
    ...domains.map((domain) => Number(domain.request_count ?? 0)),
    1,
  );

  const totalCountryDomains = countries.reduce(
    (sum, country) => sum + Number(country.domain_count ?? 0),
    0,
  );

  return (
    <div className="h-[calc(100vh-56px)] overflow-y-auto bg-slate-50 px-4 py-3">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-5">
        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              DNS Sinkhole Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Summary of DNS requests, domains, IPs, countries and ISPs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/sinkhole/dnssinkhole")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label="Go back to DNS Sinkhole domains"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </header>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          <SummaryCard
            title="Total Domains"
            value={data.domain_count}
            description="Unique domains observed"
            icon={Globe}
            color="bg-blue-100 text-blue-600"
          />

          <SummaryCard
            title="PCAP Files"
            value={data.pcap_count}
            description="Processed PCAP files"
            icon={FileText}
            color="bg-emerald-100 text-emerald-600"
          />

          <SummaryCard
            title="Total DNS Requests"
            value={data.request_count}
            description="DNS requests captured"
            icon={ArrowLeftRight}
            color="bg-orange-100 text-orange-600"
          />

          <SummaryCard
            title="External IPs"
            value={data.external_ip_count}
            description="Unique external IPs"
            icon={Radio}
            color="bg-purple-100 text-purple-600"
          />

          <SummaryCard
            title="Internal IPs"
            value={data.internal_ip_count}
            description="Unique internal IPs"
            icon={Server}
            color="bg-pink-100 text-pink-600"
          />
        </div>

        {/* MAIN DASHBOARD */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
          {/* TOP ACTIVE DOMAINS */}
          <Panel title="Top Active Domains" icon={Globe}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <th className="px-2 py-3">#</th>
                    <th className="px-2 py-3">Domain</th>
                    <th className="px-2 py-3">Requests</th>
                  </tr>
                </thead>

                <tbody>
                  {domains.slice(0, 10).map((domain, index) => (
                    // <tr
                    //   key={domain.host}
                    //   className="border-b border-slate-100 last:border-0"
                    // >
                      <tr
                        key={domain.host}
                        onClick={() =>
                          (window.location.href = `/sinkhole/dnssinkhole/${encodeURIComponent(domain.host)}`)
                        }
                        className="cursor-pointer border-b border-slate-100 last:border-0 transition-colors hover:bg-blue-50"
                      >
                      <td className="px-2 py-3 text-slate-500">{index + 1}</td>

                      <td
                        className="max-w-[150px] truncate px-2 py-3 font-medium"
                        title={domain.host}
                      >
                        {domain.host}
                      </td>

                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 font-semibold">
                            {domain.request_count}
                          </span>

                          <div className="h-2 min-w-[30px] flex-1 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{
                                width: `${
                                  (Number(domain.request_count ?? 0) /
                                    maxRequests) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {domains.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-slate-500"
                      >
                        No domains available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* TOP COUNTRIES */}
          <Panel title="Top Countries by Domains" icon={Flag}>
            <CountryDonut
              countries={countries}
              totalDomains={data.domain_count}
            />

            <div className="mt-3 space-y-4">
              {countries.map((country, index) => {
                const percentage =
                  totalCountryDomains > 0
                    ? (Number(country.domain_count ?? 0) /
                        totalCountryDomains) *
                      100
                    : 0;
                const flagClass = getCountryFlagClass(country.country);

                return (
                  <div key={country.country}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        {flagClass ? (
                          <span
                            className={flagClass}
                            role="img"
                            aria-label={`${country.country} flag`}
                          />
                        ) : (
                          <Globe size={16} aria-hidden="true" />
                        )}
                        <span className="font-semibold">{country.country}</span>
                      </span>

                      <span className="font-semibold">
                        {country.domain_count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>

                    <p
                      className="mt-2 truncate pl-5 text-xs text-slate-800"
                      title={(country.domains ?? []).join(", ")}
                    >
                      {(country.domains ?? []).join(", ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* DOMAIN LOCATIONS */}
          <Panel
            title="Domain Locations"
            icon={MapPin}
            className="flex flex-col"
          >
            <DomainLocationMap externalIps={data.external_ips ?? []} />
          </Panel>
        </div>

        {/* TOP ISPs */}
        <Panel title="Top ISPs by Activity" icon={Building2}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">ISP</th>
                  <th className="px-4 py-3">IP Count</th>
                  <th className="px-4 py-3">Request Count</th>
                  <th className="px-4 py-3">IP Addresses</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>

              <tbody>
                {isps.map((isp, index) => {
                  const ips = isp.ips ?? [];
                  const firstIp = ips[0];
                  const flagClass = getCountryFlagClass(firstIp?.country);

                  return (
                    <tr
                      key={isp.isp}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">{index + 1}</td>

                      <td className="max-w-[250px] px-4 py-4 font-medium">
                        {isp.isp}
                      </td>

                      <td className="px-4 py-4">{isp.ip_count}</td>

                      <td className="px-4 py-4 font-semibold">
                        {isp.request_count}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex min-w-[180px] flex-wrap gap-1.5">
                          {ips.slice(0, 3).map((item) => (
                            <span
                              key={item.ip}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs"
                            >
                              {item.ip}
                            </span>
                          ))}

                          {ips.length > 3 && (
                            <span
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs"
                              title={ips
                                .slice(3)
                                .map((item) => item.ip)
                                .join(", ")}
                            >
                              +{ips.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {firstIp ? (
                          <div>
                            <p>
                              {flagClass ? (
                                <span
                                  className={flagClass}
                                  role="img"
                                  aria-label={`${firstIp.country} flag`}
                                />
                              ) : (
                                <Globe
                                  size={14}
                                  className="inline"
                                  aria-hidden="true"
                                />
                              )}{" "}
                              {firstIp.country ?? "Unknown"}
                            </p>

                            {firstIp.latitude != null &&
                              firstIp.longitude != null && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {Number(firstIp.latitude).toFixed(4)},{" "}
                                  {Number(firstIp.longitude).toFixed(4)}
                                </p>
                              )}
                          </div>
                        ) : (
                          "Unknown"
                        )}
                      </td>
                    </tr>
                  );
                })}

                {isps.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No ISP data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
