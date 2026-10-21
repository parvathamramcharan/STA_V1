import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/authCookies";

async function handleRequest(request, { params }) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  //Read the path from the request and set the backend URL
  const pathParts = await params;
  const path = pathParts.path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const baseUrl = (process.env.BACKEND_URL || "").replace(/\/+$/g, "");
  const backendUrl = `${baseUrl}/ceph/${path}${searchParams ? "?" + searchParams : ""}`;

  console.log(`[Ceph Proxy] ${request.method} -> ${backendUrl}`);

  try {
    //1.prepare fetch options
    const fetchOptions = {
      method: request.method,
      headers: {
        "Content-Type":
          request.headers.get("Content-Type") || "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    };
    //2 Copy the request body and add to fecthOptions
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const body = await request.arrayBuffer();
      if (body.byteLength) fetchOptions.body = body;
    }

    //3.Create a 30-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    //4.send request to backend
    const res = await fetch(backendUrl, {
      ...fetchOptions,
      signal: controller.signal,
    });
    //5.Stop the timeout timer , if backend responds within  30 sec
    clearTimeout(timeoutId);

    //6. Find the response type from backend
    const contentType = res.headers.get("Content-Type") || "application/json";
    //7. If the backend returns a file, read it as arrayBuffer
    const responseBody = await res.arrayBuffer();

    //8. Return the response with the same status and headers
    const response = new NextResponse(responseBody, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
      },
    });

    return response;
  } catch (error) {
    // Handle errors like timeouts or network issues
    console.error(`[Ceph Proxy] Error fetching ${backendUrl}:`, error);
    const status = error.name === "AbortError" ? 504 : 500;
    return NextResponse.json(
      { error: error?.message || "Ceph proxy failed" },
      { status },
    );
  }
}
export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as PUT,
  handleRequest as DELETE,
  handleRequest as PATCH,
};
