import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/authCookies";
import { verifyJwt } from "@/lib/jwt";

export async function POST(request) {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    return NextResponse.json(
      { error: "Authentication backend is not configured" },
      { status: 503 },
    );
  }

  try {
    const credentials = await request.json();
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
    const result = await response.json();
    const data = result?.data;
    if (!response.ok || !result?.success) {
      return NextResponse.json(
        { error: result?.error || "Invalid username or password" },
        { status: response.status },
      );
    }

    const accessClaims = await verifyJwt(data?.access_token, "access");
    const refreshClaims = await verifyJwt(data?.refresh_token, "refresh");

    if (
      !accessClaims ||
      !refreshClaims ||
      accessClaims.sub !== refreshClaims.sub ||
      accessClaims.role !== refreshClaims.role ||
      accessClaims.exp !== data?.access_expires_at ||
      refreshClaims.exp !== data?.refresh_expires_at ||
      !Number.isInteger(data?.access_expires_at) ||
      !Number.isInteger(data?.refresh_expires_at)
    ) {
      return NextResponse.json(
        {
          error:
            "The backend issued tokens the frontend could not verify. Check that backend and frontend JWT_SECRET values match.",
        },
        { status: 502 },
      );
    }

    const nextResponse = NextResponse.json({
      success: true,
      user: { username: accessClaims.sub, role: accessClaims.role },
    });
    setAuthCookies(nextResponse, data);
    return nextResponse;
  } catch (error) {
    console.error("Login request failed:", error);
    return NextResponse.json(
      { error: "Could not connect to the authentication backend" },
      { status: 502 },
    );
  }
}
