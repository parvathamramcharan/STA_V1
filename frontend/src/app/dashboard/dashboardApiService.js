import { downloadPdfResponse } from "@/lib/downloadPdf";

const BASE_URL =
  typeof window === "undefined" ? process.env.BACKEND_URL : "/api/proxy";

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 60000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(
    () => controller.abort(new Error("Request timed out")),
    timeout,
  );

  try {
    console.log(`[fetchWithTimeout] Fetching: ${url}`);
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    console.log(`[fetchWithTimeout] Response from ${url}: ${response.status}`);
    clearTimeout(id);
    return response;
  } catch (error) {
    console.error(`[fetchWithTimeout] Error fetching ${url}:`, error.message);
    clearTimeout(id);
    throw error;
  }
};

export async function fetchDashboardOverview() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/overview`);
    if (!res.ok)
      throw new Error(`Failed to fetch dashboard overview: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("[dashboardApiService] fetchDashboardOverview:", error);
    throw error;
  }
}
//------------------
export async function fetchDashboardInsights() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/insights`);
    if (!res.ok)
      throw new Error(`Failed to fetch dashboard insights: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("[dashboardApiService] fetchDashboardInsights:", error);
    throw error;
  }
}

export async function fetchGlobalMapData() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/map/external-ips`);
    if (!res.ok)
      throw new Error(`Failed to fetch global map data: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("[dashboardApiService] fetchGlobalMapData:", error);
    throw error;
  }
}
//done
export async function fetchIPScan(ip) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/ip/scan/${ip}`);
    if (!res.ok) throw new Error(`Failed to scan IP ${ip}: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error(`[dashboardApiService] fetchIPScan for ${ip}:`, error);
    throw error;
  }
}

export async function fetchReportsGeo() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/reports/geo`); // countries and isps
    if (!res.ok) throw new Error(`Failed to fetch reports geo: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("[dashboardApiService] fetchReportsGeo:", error);
    throw error;
  }
}

export async function fetchReportsDetails(type, value) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/reports/details/${type}/${encodeURIComponent(value)}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch reports details: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error(
      `[dashboardApiService] fetchReportsDetails for ${type}/${value}:`,
      error,
    );
    throw error;
  }
}

export async function triggerExport(type, value) {
  try {
    const url = `${BASE_URL}/export/${type}?value=${encodeURIComponent(value)}&sync=true`;
    const res = await fetchWithTimeout(url, { timeout: 120000 });
    await downloadPdfResponse(res, `${type}_${value}_report.pdf`);
  } catch (error) {
    console.error(
      `[dashboardApiService] triggerExport for ${type}/${value}:`,
      error,
    );
    throw error;
  }
}
