function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
  return bytes;
}

function decodeJsonSegment(value) {
  const bytes = decodeBase64Url(value);
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function verifyJwt(token, expectedType = "access") {
  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes");
  }
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) return null;

  try {
    const header = decodeJsonSegment(parts[0]);
    const claims = decodeJsonSegment(parts[1]);
    if (
      header?.alg !== "HS256" ||
      claims?.token_type !== expectedType ||
      typeof claims?.sub !== "string" ||
      typeof claims?.jti !== "string" ||
      !["admin", "user"].includes(claims?.role) ||
      !Number.isInteger(claims?.exp) ||
      !Number.isInteger(claims?.iat) ||
      claims.exp <= Math.floor(Date.now() / 1000) ||
      claims.iat > Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signature = decodeBase64Url(parts[2]);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    return isValid ? claims : null;
  } catch {
    return null;
  }
}
