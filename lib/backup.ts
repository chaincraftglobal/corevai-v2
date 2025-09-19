import crypto from "crypto";
import bcrypt from "bcrypt";

export function generateBackupCodes(n = 10) {
    // e.g., 10 codes like "K7P9-3XQM"
    const codes: string[] = [];
    for (let i = 0; i < n; i++) {
        const raw = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 hex
        codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
    }
    return codes;
}

export async function hashCodes(codes: string[]) {
    const out: string[] = [];
    for (const c of codes) {
        out.push(await bcrypt.hash(c, 10));
    }
    return out;
}

export async function checkBackupCode(plain: string, hashes: string[]) {
    for (const h of hashes) {
        const ok = await bcrypt.compare(plain, h);
        if (ok) return h;
    }
    return null;
}