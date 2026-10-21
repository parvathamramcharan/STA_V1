import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import PropTypes from "prop-types";

/*
 * Global chart palette
 * Used consistently across all Traffic Distribution charts.
 */
const CHART_COLORS = [
  "#4F46E5", // Indigo
  "#0F9FA8", // Teal
  "#F59E0B", // Amber
  "#E85D75", // Rose
  "#8B5CF6", // Violet
];

const formatAxisLabel = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value;
};

function NoData({ text = "No Data Available" }) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

NoData.propTypes = {
  text: PropTypes.string,
};

function ChartContainer({ title, children }) {
  return (
    <div className="bg-card shadow-sm rounded-xl p-4 h-[300px] flex flex-col hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-1.5 h-4 bg-blue-600 rounded-full" />

        <div className="font-bold text-foreground">{title}</div>
      </div>

      <div className="flex-1 w-full min-h-0">{children}</div>
    </div>
  );
}

ChartContainer.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 text-[12px] font-medium text-foreground z-50">
      <p className="text-foreground/60 text-[10px] mb-1.5 font-bold">
        {label || payload[0].name || payload[0].payload?.label}
      </p>

      {payload.map((entry, index) => {
        const color =
          entry.color ||
          entry.fill ||
          CHART_COLORS[index % CHART_COLORS.length];

        return (
          <p key={index} className="flex items-center gap-2" style={{ color }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {entry.name}: {Number(entry.value).toLocaleString()}
          </p>
        );
      })}
    </div>
  );
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

export default function TrafficDistribution({ data }) {
  const {
    application = [],
    direction = [],
    dns_domains = [],
    top_ssl_domains = [],
    transport = [],
    url_domains = [],
  } = data || {};

  /*
   * Normalize different API response formats
   * into the same { label, value } structure.
   */
  const processData = (items, nameKey, valueKey) => {
    if (!items?.length) {
      return [];
    }

    return items.map((item) => ({
      label: item.label || item[nameKey] || "Unknown",
      value: item.value ?? item[valueKey] ?? 0,
    }));
  };

  const appData = processData(application, "label", "value");
  const dnsData = processData(dns_domains, "domain", "count");
  const urlData = processData(url_domains, "domain", "count");
  const sslData = processData(top_ssl_domains, "label", "value");
  const transData = processData(transport, "label", "value");
  const directionData = processData(direction, "label", "value");

  const getColor = (index) => CHART_COLORS[index % CHART_COLORS.length];

  const getPercentage = (value, total) =>
    total ? ((value / total) * 100).toFixed(2) : "0.00";

  return (
    <div className="mx-0 my-4">
      <div className="rounded-2xl border border-theme bg-card shadow-sm p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* -------------------------------------------------- */}
          {/* Transport Layer                                    */}
          {/* -------------------------------------------------- */}

          <ChartContainer title="Transport Layer">
            {transData.length === 0 ? (
              <NoData />
            ) : (
              <div className="flex h-full items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={transData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="label"
                        stroke="none"
                      >
                        {transData.map((_, index) => (
                          <Cell
                            key={`transport-${index}`}
                            fill={getColor(index)}
                          />
                        ))}
                      </Pie>

                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-1/2 flex flex-col gap-1.5 pl-4">
                  {(() => {
                    const total = transData.reduce(
                      (sum, item) => sum + item.value,
                      0,
                    );

                    return transData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{
                            backgroundColor: getColor(index),
                          }}
                        />

                        <span className="text-[12px] font-medium text-foreground truncate">
                          {entry.label}
                        </span>

                        <span className="text-[11px] text-slate-500 ml-auto tabular-nums shrink-0">
                          {getPercentage(entry.value, total)}%
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </ChartContainer>

          {/* -------------------------------------------------- */}
          {/* Application Protocols                              */}
          {/* -------------------------------------------------- */}

          <ChartContainer title="Application Protocols (Top 5)">
            {appData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={appData.slice(0, 5)}
                  layout="vertical"
                  margin={{
                    top: 4,
                    right: 40,
                    left: 8,
                    bottom: 24,
                  }}
                  barCategoryGap="40%"
                >
                  <XAxis
                    type="number"
                    domain={[0, "dataMax * 1.16"]}
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                    tickFormatter={formatAxisLabel}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Packets",
                      position: "bottom",
                      offset: 8,
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                  />

                  <YAxis
                    dataKey="label"
                    type="category"
                    width={200}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "hsl(var(--foreground) / 0.05)",
                    }}
                  />

                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={10}>
                    {appData.slice(0, 5).map((_, index) => (
                      <Cell
                        key={`application-${index}`}
                        fill={getColor(index)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* -------------------------------------------------- */}
          {/* URLs                                                */}
          {/* -------------------------------------------------- */}

          <ChartContainer title="URLs (Top 5)">
            {urlData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={urlData.slice(0, 5)}
                  margin={{
                    top: 8,
                    right: 8,
                    left: 20,
                    bottom: 58,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />

                  <XAxis
                    dataKey="label"
                    height={58}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={({ x, y, payload }) => {
                      const text =
                        payload.value?.length > 18
                          ? `${payload.value.slice(0, 18)}…`
                          : payload.value;

                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={4}
                            textAnchor="end"
                            transform="rotate(-42)"
                            fontSize={10}
                            fill="currentColor"
                            fontFamily="sans-serif"
                            fontWeight="normal"
                          >
                            {text}
                          </text>
                        </g>
                      );
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                    domain={[0, "dataMax * 1.08"]}
                    tickFormatter={formatAxisLabel}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Packets",
                      angle: -90,
                      position: "insideLeft",
                      offset: -10,
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                  />

                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "hsl(var(--foreground) / 0.05)",
                    }}
                  />

                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={12}>
                    {urlData.slice(0, 5).map((_, index) => (
                      <Cell key={`url-${index}`} fill={getColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* -------------------------------------------------- */}
          {/* Queried Domains                                     */}
          {/* -------------------------------------------------- */}

          <ChartContainer title="Queried Domains (Top 5)">
            {dnsData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dnsData.slice(0, 5)}
                  layout="vertical"
                  margin={{
                    top: 4,
                    right: 48,
                    left: 8,
                    bottom: 26,
                  }}
                  barCategoryGap="45%"
                >
                  <XAxis
                    type="number"
                    domain={[0, "dataMax * 1.7"]}
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                    tickFormatter={formatAxisLabel}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Packets",
                      position: "bottom",
                      offset: 10,
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                  />

                  <YAxis
                    dataKey="label"
                    type="category"
                    width={200}
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "hsl(var(--foreground) / 0.05)",
                    }}
                  />

                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={10}>
                    {dnsData.slice(0, 5).map((_, index) => (
                      <Cell key={`dns-${index}`} fill={getColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* -------------------------------------------------- */}
          {/* Direction                                           */}
          {/* -------------------------------------------------- */}

          <ChartContainer title="Direction">
            {directionData.length === 0 ? (
              <NoData />
            ) : (
              <div className="flex h-full items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={directionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="label"
                        stroke="none"
                      >
                        {directionData.map((_, index) => (
                          <Cell
                            key={`direction-${index}`}
                            fill={getColor(index)}
                          />
                        ))}
                      </Pie>

                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-1/2 flex flex-col gap-1.5 pl-4">
                  {(() => {
                    const total = directionData.reduce(
                      (sum, item) => sum + item.value,
                      0,
                    );

                    return directionData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{
                            backgroundColor: getColor(index),
                          }}
                        />

                        <span className="text-[12px] font-medium text-foreground truncate">
                          {entry.label}
                        </span>

                        <span className="text-[11px] text-foreground/50 ml-auto tabular-nums shrink-0">
                          {getPercentage(entry.value, total)}%
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </ChartContainer>

          {/* -------------------------------------------------- */}
          {/* SSL Server Domains                                  */}
          {/* -------------------------------------------------- */}

          <ChartContainer title="SSL Server Domains (Top 5)">
            {sslData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sslData.slice(0, 5)}
                  layout="vertical"
                  margin={{
                    top: 4,
                    right: 48,
                    left: 8,
                    bottom: 24,
                  }}
                  barCategoryGap="42%"
                >
                  <XAxis
                    type="number"
                    domain={[0, "dataMax * 1.18"]}
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                    tickFormatter={formatAxisLabel}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Packets",
                      position: "bottom",
                      offset: 8,
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                  />

                  <YAxis
                    dataKey="label"
                    type="category"
                    width={200}
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "hsl(var(--foreground) / 0.05)",
                    }}
                  />

                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={10}>
                    {sslData.slice(0, 5).map((_, index) => (
                      <Cell key={`ssl-${index}`} fill={getColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}

TrafficDistribution.propTypes = {
  data: PropTypes.object,
};
