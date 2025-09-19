import { authenticator } from "otplib";
import QRCode from "qrcode";

export function makeIssuer() {
    return "CoreVAI";
}

export function makeLabel(email: string) {
    return email || "user@corevai";
}

export function makeSecret() {
    return authenticator.generateSecret();
}

export function makeOtpAuthURL({ secret, email }: { secret: string; email: string }) {
    const issuer = makeIssuer();
    const label = makeLabel(email);
    return authenticator.keyuri(label, issuer, secret);
}

export async function makeQrDataUrl(otpauth: string) {
    return await QRCode.toDataURL(otpauth);
}

export function verifyTotp(code: string, secret: string) {
    return authenticator.verify({ token: code.replace(/\s+/g, ""), secret });
}