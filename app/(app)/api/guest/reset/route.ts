// app/api/guest/reset/route.ts
import { NextResponse } from "next/server";
import { GUEST_COOKIE_NAME, GUEST_COOKIE_MAX_AGE } from "@/lib/limits";

export const runtime = "nodejs";

export async function POST() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(GUEST_COOKIE_NAME, "0", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: GUEST_COOKIE_MAX_AGE,
    });
    return res;
}