import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
} from "@/lib/authCookies";

export async function POST(request) {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    return NextResponse.json(
      { error: "Authentication backend is not configured" },
      { status: 503 },
    );
  }

  try {
    const backendResponse = await fetch(`${backendUrl}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
        refresh_token: request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
      }),
      cache: "no-store",
    });
    const result = await backendResponse.json();
    if (!backendResponse.ok || !result?.success || !result?.data?.revoked) {
      return NextResponse.json(
        { error: result?.error || "Could not revoke the current session" },
        { status: backendResponse.ok ? 502 : backendResponse.status },
      );
    }

    return clearAuthCookies(NextResponse.json({ success: true }));
  } catch (error) {
    console.error("Token revocation request failed:", error);
    return NextResponse.json(
      { error: "Could not connect to the authentication backend" },
      { status: 502 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Logout requires a POST request" },
    { status: 405 },
  );
}
