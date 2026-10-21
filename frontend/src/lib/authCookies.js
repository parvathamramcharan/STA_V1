import { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

export function setAuthCookies(response, data) {
  const now = Math.floor(Date.now() / 1000);
  response.cookies.set(ACCESS_TOKEN_COOKIE, data.access_token, {
    ...COOKIE_OPTIONS,
    expires: new Date(data.access_expires_at * 1000),
    maxAge: Math.max(data.access_expires_at - now, 0),
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, data.refresh_token, {
    ...COOKIE_OPTIONS,
    expires: new Date(data.refresh_expires_at * 1000),
    maxAge: Math.max(data.refresh_expires_at - now, 0),
  });
}

export function clearAuthCookies(response) {
  const oldAuthCookies = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "__Host-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.state",
    "__Secure-authjs.state",
    "authjs.pkce.code_verifier",
    "__Secure-authjs.pkce.code_verifier",
    "authjs.nonce",
    "__Secure-authjs.nonce",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.state",
    "__Secure-next-auth.state",
    "next-auth.pkce.code_verifier",
    "__Secure-next-auth.pkce.code_verifier",
    "next-auth.nonce",
    "__Secure-next-auth.nonce",
  ];

  for (const name of [
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    ...oldAuthCookies,
  ]) {
    response.cookies.set(name, "", {
      ...COOKIE_OPTIONS,
      expires: new Date(0),
      maxAge: 0,
    });
  }

  return response;
}

export function jsonWithClearedAuth(
  status = 401,
  body = { error: "Unauthorized" },
) {
  return clearAuthCookies(NextResponse.json(body, { status }));
}
