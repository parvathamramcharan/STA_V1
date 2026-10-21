import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/authCookies";
import { verifyJwt } from "@/lib/jwt";

export async function GET(request) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const claims = await verifyJwt(accessToken, "access");
  if (!claims) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    return NextResponse.json(
      { error: "Authentication backend is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const validationResponse = await fetch(`${backendUrl}/auth/validate`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (validationResponse.status === 401) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!validationResponse.ok) {
      return NextResponse.json(
        { error: "Authentication service is unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch (error) {
    console.error("Could not validate the session with the backend:", error);
    return NextResponse.json(
      { error: "Could not connect to the authentication backend" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: { username: claims.sub, role: claims.role },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
