import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/authCookies";
import { verifyJwt } from "@/lib/jwt";

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  let claims = await verifyJwt(accessToken, "access");

  if (claims) {
    const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
    if (!backendUrl) {
      return NextResponse.json(
        { error: "Authentication backend is not configured" },
        { status: 503 },
      );
    }
    try {
      const validationResponse = await fetch(`${backendUrl}/auth/validate`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (validationResponse.status === 401) {
        claims = null;
      } else if (!validationResponse.ok) {
        return NextResponse.json(
          { error: "Authentication service is unavailable" },
          { status: 503 },
        );
      }
    } catch (error) {
      console.error("Could not validate the session with the backend:", error);
      return NextResponse.json(
        { error: "Could not connect to the authentication backend" },
        { status: 503 },
      );
    }
  }

  if (!claims) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const refreshClaims = await verifyJwt(refreshToken, "refresh");
    if (refreshClaims) {
      const returnTo = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(
        new URL(`/api/auth/refresh?returnTo=${returnTo}`, request.url),
      );
    }
  }

  const isLoggedIn = Boolean(claims);
  const isAdmin = claims?.role === "admin";
  const isPublicRoute = pathname === "/";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isPcapRoute = pathname.startsWith("/pcaps");
  const isSinkholeRoute = pathname.startsWith("/sinkhole");
  const isReportsRoute = pathname.startsWith("/reports");
  const isUploadRoute = pathname.startsWith("/upload");
  const isAboutRoute = pathname.startsWith("/about");
  const isFeedbackRoute = pathname.startsWith("/feedback");
  const isFeedbackViewRoute = pathname.startsWith("/feedback/view");
  const isProtectedRoute =
    isDashboardRoute ||
    isPcapRoute ||
    isSinkholeRoute ||
    isReportsRoute ||
    isUploadRoute ||
    isAboutRoute ||
    isFeedbackRoute;

  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(
      new URL(isAdmin ? "/dashboard" : "/reports?set=1", request.url),
    );
  }
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (
    isLoggedIn &&
    !isAdmin &&
    (isDashboardRoute || isPcapRoute || isSinkholeRoute)
  ) {
    return NextResponse.redirect(new URL("/reports?set=1", request.url));
  }
  if (isLoggedIn && !isAdmin && isFeedbackViewRoute) {
    return NextResponse.redirect(new URL("/reports?set=1", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/pcaps/:path*",
    "/sinkhole/:path*",
    "/reports/:path*",
    "/upload/:path*",
    "/about/:path*",
    "/feedback/:path*",
  ],
};
