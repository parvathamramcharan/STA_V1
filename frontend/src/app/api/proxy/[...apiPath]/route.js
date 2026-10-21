//[...apiPath] is a catch-all dynamic route. => Whatever comes after /api/proxy/ is captured into params.apiPath.
// apiPath name is custom

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
  const pathParts = await params; // access params
  const path = pathParts.apiPath.join("/"); // gets the what the browser req and join them  ex : pcaps/set-1

  const searchParams = request.nextUrl.searchParams.toString();

  const baseUrl = (process.env.BACKEND_URL || "").replace(/\/+$/g, "");
  const cleanPath = String(path).replace(/^\/+/, "");
  const backendUrl = `${baseUrl}/${cleanPath}${searchParams ? "?" + searchParams : ""}`;

  console.log(`[Proxy Route] ${request.method} -> ${backendUrl}`);

  try {
    //1.Create fetchOptions
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
      const body = await request.text();
      if (body) fetchOptions.body = body;
    }

    // Synchronous report exports can take longer than ordinary API requests.
    const timeoutMs = path.includes("/export") ? 120000 : 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    //4.send request to backend
    const res = await fetch(backendUrl, {
      ...fetchOptions,
      signal: controller.signal,
    });

    //5.Stop the timeout timer , if backend responds within  30 sec
    clearTimeout(timeoutId);

    //6. Find the response type from backend
    const contentType = res.headers.get("content-type") || "";

    //7. handling if backend return error response
    if (!res.ok) {
      //7.1 Read the backend error
      const errorBody = await res.text();

      //7.2 Is the error JSON?
      if (contentType.includes("application/json")) {
        try {
          return NextResponse.json(JSON.parse(errorBody), {
            status: res.status,
          });
        } catch {
          //7.3 Sometimes backend says it is JSON but sends invalid JSON.
          return new NextResponse(errorBody, {
            status: res.status,
            headers: { "Content-Type": contentType || "application/json" },
          });
        }
      }

      //7.4 If not JSON, send as plain text
      return new NextResponse(errorBody, {
        status: res.status,
        headers: { "Content-Type": contentType || "text/plain" },
      });
    }

    //8. Did the backend return JSON
    if (contentType.includes("application/json")) {
      //8.1 Read the response
      const rawBody = await res.text();
      try {
        //8.2 Try to convert text → JSON
        return NextResponse.json(JSON.parse(rawBody));
      } catch {
        //8.3 If conversion fails, send as plain text
        return new NextResponse(rawBody, {
          headers: { "Content-Type": contentType || "application/json" },
        });
      }
    }
    //9. Read the backend response as binary , arrayBuffer() is used when the response isn't normal text/JSON.
    const body = await res.arrayBuffer();
    //Create response headers
    const responseHeaders = new Headers();
    //Preserve Content-Disposition
    const contentDisposition = res.headers.get("content-disposition");
    if (contentDisposition) {
      responseHeaders.set("Content-Disposition", contentDisposition);
    }
    responseHeaders.set(
      "Content-Type",
      contentType || "application/octet-stream",
    );

    // Send the file back to browser
    return new NextResponse(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    // Handle errors like timeouts or network issues
    console.error(`[Proxy Route] Error fetching ${backendUrl}:`, error);
    const msg = error?.message || "Proxy fetch failed";
    const status = error.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
// export
export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as PUT,
  handleRequest as DELETE,
};
