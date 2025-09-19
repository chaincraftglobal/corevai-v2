"use client";

import { useEffect, useState } from "react";

type StartResp = { otpauth: string; qr: string };
type VerifyResp = { ok: true; backupCodes: string[] };

export default function SecurityPage() {
    const [step, setStep] = useState<"idle" | "scan" | "enabled">("idle");
    const [qr, setQr] = useState<string>("");
    const [otpauth, setOtpauth] = useState<string>("");
    const [code, setCode] = useState("");
    const [backup, setBackup] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(false);

    const start = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/totp/start", { method: "POST" });
            const data = (await res.json()) as StartResp;
            setQr(data.qr);
            setOtpauth(data.otpauth);
            setStep("scan");
        } finally {
            setLoading(false);
        }
    };

    const verify = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/totp/verify", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ code }),
            });
            if (!res.ok) throw new Error("Invalid code");
            const data = (await res.json()) as VerifyResp;
            setBackup(data.backupCodes);
            setStep("enabled");
        } catch (e) {
            alert("Invalid or expired code. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const disable = async () => {
        const codeInput = prompt("Enter a TOTP or a backup code to disable:");
        if (!codeInput) return;
        setLoading(true);
        try {
            const res = await fetch("/api/settings/totp/disable", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ code: codeInput }),
            });
            if (!res.ok) throw new Error();
            alert("2FA disabled.");
            location.reload();
        } catch {
            alert("Failed to disable. Code incorrect?");
        } finally {
            setLoading(false);
        }
    };

    const regen = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/totp/backup-codes", { method: "POST" });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setBackup(data.backupCodes as string[]);
            alert("New backup codes generated.");
        } catch {
            alert("Failed to regenerate backup codes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Security</h1>

            {step === "idle" && (
                <div className="border rounded-xl p-4">
                    <p className="text-gray-700">Protect your account with 2-Step Verification (TOTP).</p>
                    <button onClick={start} disabled={loading}
                        className="mt-3 rounded-md bg-black text-white px-4 py-2 text-sm">
                        {loading ? "Preparing…" : "Enable TOTP"}
                    </button>
                </div>
            )}

            {step === "scan" && (
                <div className="border rounded-xl p-4 space-y-3">
                    <p className="text-gray-700">Scan this QR with Google Authenticator / Authy / 1Password.</p>
                    <img src={qr} alt="TOTP QR" className="mx-auto w-48 h-48" />
                    <details className="text-sm text-gray-600"><summary>Or enter key manually</summary><code className="break-all">{otpauth}</code></details>
                    <div className="flex gap-2">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="6-digit code"
                            className="border rounded-md px-3 py-2 text-sm flex-1"
                        />
                        <button onClick={verify} disabled={loading}
                            className="rounded-md bg-black text-white px-4 py-2 text-sm">
                            Verify & Enable
                        </button>
                    </div>
                </div>
            )}

            {step === "enabled" && (
                <div className="border rounded-xl p-4 space-y-3">
                    <p className="text-green-700 font-medium">TOTP is enabled.</p>
                    {backup && (
                        <div>
                            <p className="text-gray-700 mb-2">Save these backup codes (shown once):</p>
                            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
                                {backup.map((b) => <li key={b} className="border rounded px-2 py-1">{b}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={regen} className="rounded-md border px-3 py-2 text-sm">Regenerate backup codes</button>
                        <button onClick={disable} className="rounded-md border px-3 py-2 text-sm">Disable TOTP</button>
                    </div>
                </div>
            )}
        </div>
    );
}