import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  jsonWithClearedAuth,
  setAuthCookies,
} from "@/lib/authCookies";
import { verifyJwt } from "@/lib/jwt";

async function issueRefreshedTokens(refreshToken, accessToken) {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    return {
      response: NextResponse.json(
        { error: "Backend not configured" },
        { status: 503 },
      ),
    };
  }

  try {
    const backendResponse = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: refreshToken,
        access_token: accessToken,
      }),
      cache: "no-store",
    });
    const result = await backendResponse.json();
    const data = result?.data;
    const accessClaims = await verifyJwt(data?.access_token, "access");
    const refreshClaims = await verifyJwt(data?.refresh_token, "refresh");

    if (
      !backendResponse.ok ||
      !result?.success ||
      !accessClaims ||
      !refreshClaims ||
      accessClaims.sub !== refreshClaims.sub ||
      accessClaims.role !== refreshClaims.role ||
      accessClaims.exp !== data?.access_expires_at ||
      refreshClaims.exp !== data?.refresh_expires_at ||
      !Number.isInteger(data?.access_expires_at) ||
      !Number.isInteger(data?.refresh_expires_at)
    ) {
      if (backendResponse.status === 401) {
        return {
          response: jsonWithClearedAuth(401, { error: "Session expired" }),
        };
      }
      return {
        response: NextResponse.json(
          { error: result?.error || "Could not refresh session" },
          { status: backendResponse.ok ? 502 : backendResponse.status },
        ),
      };
    }

    const response = NextResponse.json({
      success: true,
      user: { username: accessClaims.sub, role: accessClaims.role },
    });
    setAuthCookies(response, data);
    return { response, claims: accessClaims };
  } catch (error) {
    console.error("Token refresh request failed:", error);
    return {
      response: NextResponse.json(
        { error: "Could not connect to the authentication backend" },
        { status: 502 },
      ),
    };
  }
}

export async function POST(request) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshClaims = await verifyJwt(refreshToken, "refresh");
  if (!refreshClaims) {
    return jsonWithClearedAuth(401, { error: "Session expired" });
  }

  const { response } = await issueRefreshedTokens(refreshToken, accessToken);
  return response;
}

export async function GET(request) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  const target = new URL(returnTo, request.url);
  const safeReturnTo =
    target.origin === request.nextUrl.origin ? target.pathname + target.search : "/";
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshClaims = await verifyJwt(refreshToken, "refresh");

  if (!refreshClaims) {
    const response = NextResponse.redirect(new URL("/", request.url));
    clearAuthCookies(response);
    return response;
  }

  const { response: tokenResponse, claims } =
    await issueRefreshedTokens(refreshToken, accessToken);
  if (!claims) {
    const redirect = NextResponse.redirect(new URL("/", request.url));
    clearAuthCookies(redirect);
    return redirect;
  }

  const redirect = NextResponse.redirect(new URL(safeReturnTo, request.url));
  for (const cookie of tokenResponse.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
