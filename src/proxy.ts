import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isProtectedPage =
    pathname.startsWith("/projects") ||
    pathname.includes("/settings") ||
    pathname.includes("/setup");

  if (isProtectedPage && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/projects", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/projects/:path*",
    "/p/:slug/settings/:path*",
    "/p/:slug/setup/:path*",
    "/login",
  ],
};
