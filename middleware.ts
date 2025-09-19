// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_PATHS = [
    "/chats",
    "/projects",
    "/settings",
    "/api/chat", // all chat APIs
    "/api/projects",
];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // only protect the app section
    const isProtected = APP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isProtected) return NextResponse.next();

    // next-auth sets this cookie when logged in (JWT or session)
    const hasSession =
        req.cookies.get("next-auth.session-token")?.value ||
        req.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname); // optional: return user back after login
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/chats/:path*",
        "/projects/:path*",
        "/settings/:path*",
        "/api/chat/:path*",
        "/api/projects/:path*",
    ],
};