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

export async function dnssinkhole(accessToken) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/pcaps/dns-sinkhole`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch dnsrequest:${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.log("error while fetching data from dns-sinkhole", error);
    throw error;
  }
}
//http://192.168.10.11:5000/api/pcaps/set/2/domains/phishing-test.test/isps
export async function getISPdnsSinkholeDomain(domainName) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/pcaps/set/2/domains/${encodeURIComponent(domainName)}/isps`,
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch ISP data: ${res.status}`);
    }

    const json = await res.json();

    return json.data;
  } catch (error) {
    console.log("error while fetching data of ISP from dns-sinkhole", error);
    throw error;
  }
}
