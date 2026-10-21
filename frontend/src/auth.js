import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/authCookies";
import { verifyJwt } from "@/lib/jwt";

export async function getAuth() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const claims = await verifyJwt(accessToken, "access");
  if (!claims) return null;

  return {
    user: {
      name: claims.sub,
      roles: [claims.role],
    },
    accessToken,
  };
}
