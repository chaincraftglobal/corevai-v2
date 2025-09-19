// lib/mfa.ts
export const MFA_OK_COOKIE = "mfa_ok_v2"; // already referenced in your code
export const MFA_OK_MAX_AGE = 60 * 60 * 12; // 12h

export function issuerForOTP() {
    return "CoreVAI";
}

// Generate 10 backup codes of 10 chars (server will hash)
export function generateBackupCodes(count = 10) {
    const out: string[] = [];
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/1/IO
    for (let i = 0; i < count; i++) {
        let s = "";
        for (let j = 0; j < 10; j++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
        out.push(s);
    }
    return out;
}