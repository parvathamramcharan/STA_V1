import { downloadPdfResponse } from "@/lib/downloadPdf";

export const BASE_URL =
  typeof window === "undefined" ? process.env.BACKEND_URL : "/api/proxy";

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 30000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};
//done
export async function fetchPcapSet(setId, accessToken) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/pcaps/set/${setId}`, {
      cache: "no-store",
      timeout: 30000,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `Failed to fetch pcap set: ${res.status}${errorBody ? ` - ${errorBody}` : ""}`,
      );
    }
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("API Error fetching pcap set:", error);
    throw error;
  }
}
//done
export async function fetchPcapOverview(pcapId) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/overview?pcap_id=${pcapId}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch overview: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("API Error fetching overview:", error);
    throw error;
  }
}
export async function fetchPcapConnections(pcapId, page = 1, period = "") {
  try {
    let url = `${BASE_URL}/pcaps/${pcapId}/connections?page=${page}&limit=50`;
    if (period) url += `&period=${period}`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Failed to fetch connections: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("API Error fetching connections:", error);
    throw error;
  }
}
//done
export async function fetchPcapInsights(pcapId) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/pcaps/${pcapId}/insights`);
    if (!res.ok) throw new Error(`Failed to fetch insights: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("API Error fetching insights:", error);
    throw error;
  }
}

export async function downloadPcapConnectionsExport(pcapId) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/pcaps/${pcapId}/connections/export`,
    );
    if (!res.ok) throw new Error(`Failed to export connections: ${res.status}`);

    const blob = await res.blob();
    const disposition = res.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1] || "connections-export.zip";

    return { blob, filename };
  } catch (error) {
    console.error("API Error exporting connections:", error);
    throw error;
  }
}
//done
export async function fetchPcapTimeline(pcapId) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/pcaps/${pcapId}/timeline`);
    if (!res.ok) throw new Error(`Failed to fetch timeline: ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("API Error fetching timeline:", error);
    throw error;
  }
}

export async function fetchIpScan(ip) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/ip/scan/${ip}`);
    if (!res.ok) throw new Error(`Failed to scan IP: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("IP Scan Error:", error);
    throw error;
  }
}
export async function fetchPcapMap(pcapId) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/map?pcap_id=${pcapId}`);
    if (!res.ok) throw new Error(`Failed to fetch map data: ${res.status}`);
    const json = await res.json();
    return json.data || json;
  } catch (error) {
    console.error("Map Error:", error);
    throw error;
  }
}

export async function fetchPcapGeoReport(pcapId) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/reports/geo?pcap_id=${pcapId}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch report: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Report Error:", error);
    throw error;
  }
}

export async function triggerPcapExport(pcapId, type, value) {
  try {
    const url = `${BASE_URL}/reports/${pcapId}/${type}/${encodeURIComponent(value)}/export?sync=true`;
    const res = await fetchWithTimeout(url, { timeout: 120000 });
    await downloadPdfResponse(res, `${pcapId}_${type}_${value}_report.pdf`);
  } catch (error) {
    console.error(
      `[apiService] triggerPcapExport for ${pcapId}/${type}/${value}:`,
      error,
    );
    throw error;
  }
}

export async function fetchPcapDetails(pcapId, type, value) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/reports/${pcapId}/${type}/${encodeURIComponent(value)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch pcap details: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error(
      `fetchPcapDetails error for ${pcapId}/${type}/${value}:`,
      error,
    );
    throw error;
  }
}
