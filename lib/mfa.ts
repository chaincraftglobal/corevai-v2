// lib/mfa.ts
export const MFA_OK_COOKIE = "mfa_ok_v2";
export const MFA_OK_MAX_AGE = 60 * 60 * 12; // 12h

export function issuerForOTP() {
    return "CoreVAI";
}

export function generateBackupCodes(count = 10) {
    const out: string[] = [];
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < count; i++) {
        let s = "";
        for (let j = 0; j < 10; j++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
        out.push(s);
    }
    return out;
}