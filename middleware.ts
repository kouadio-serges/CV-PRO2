import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes publiques autorisées sans authentification
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/cinetpay/notify",
];

// Préfixes de routes publiques (ex: assets statiques, favicon, api auth)
const publicPrefixes = [
  "/_next",
  "/favicon.ico",
  "/api/auth/",
  "/api/cinetpay/notify",
  "/print/",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Autoriser la navigation si la route correspond à un préfixe ou une route publique
  const isPublicPrefix = publicPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicPrefix || isPublicRoute) {
    return NextResponse.next();
  }

  // Vérifier le jeton de session JWT NextAuth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
