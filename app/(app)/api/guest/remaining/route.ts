// app/api/guest/remaining/route.ts
import { NextResponse } from "next/server";
import { cookies as getCookies } from "next/headers";
import { GUEST_COOKIE_NAME, GUEST_PROMPT_LIMIT } from "@/lib/limits";

export const runtime = "nodejs"; // keep on Node

export async function GET() {
    const jar = await getCookies(); // ← await: returns ReadonlyRequestCookies
    const raw = jar.get(GUEST_COOKIE_NAME)?.value ?? "0";

    const n = Number(raw);
    const used = Number.isNaN(n) ? 0 : n;
    const remaining = Math.max(0, GUEST_PROMPT_LIMIT - used);

    return NextResponse.json({ used, limit: GUEST_PROMPT_LIMIT, remaining });
}