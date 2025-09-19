// app/settings/security/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

type SetupResp = { base32: string; otpauth: string; qrDataUrl: string };
type EnableResp = { ok: true; backupCodes: string[] };
type DisableResp = { ok: true } | { error: string };

export default function SecuritySettingsPage() {
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [pending, setPending] = useState(false);
    const [setup, setSetup] = useState<SetupResp | null>(null);
    const [token, setToken] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

    const startSetup = async () => {
        setPending(true);
        try {
            const r = await fetch("/api/mfa/setup", { cache: "no-store" });
            if (!r.ok) throw new Error("Failed to start setup");
            const j = (await r.json()) as SetupResp;
            setSetup(j);
            setEnabled(false);
        } catch (e) {
            console.error(e);
            alert("Could not start 2FA setup.");
        } finally {
            setPending(false);
        }
    };

    const enable2FA = async () => {
        if (!setup) return;
        setPending(true);
        try {
            const r = await fetch("/api/mfa/enable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base32: setup.base32, token: token.trim() }),
            });
            const j = (await r.json()) as EnableResp | { error?: string };
            if ("ok" in j) {
                setEnabled(true);
                setBackupCodes(j.backupCodes);
                setSetup(null);
                setToken("");
            } else {
                alert(j.error || "Failed to enable 2FA");
            }
        } catch (e) {
            console.error(e);
            alert("Could not verify code.");
        } finally {
            setPending(false);
        }
    };

    const disable2FA = async () => {
        setPending(true);
        try {
            const r = await fetch("/api/mfa/disable", { method: "POST" });
            const j = (await r.json()) as DisableResp;
            if ("ok" in j && j.ok) {
                setEnabled(false);
                setBackupCodes(null);
                setSetup(null);
                setToken("");
            } else {
                alert(("error" in j && j.error) || "Failed to disable 2FA");
            }
        } catch (e) {
            console.error(e);
            alert("Could not disable 2FA.");
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Security</h1>

            <section className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-medium">Two-Factor Authentication (TOTP)</h2>
                        <p className="text-sm text-gray-600">
                            Protect your account with an authenticator app (Google Authenticator, Authy, 1Password).
                        </p>
                    </div>
                    {enabled ? (
                        <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">Enabled</span>
                    ) : (
                        <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-700">Disabled</span>
                    )}
                </div>

                {!setup && !enabled && (
                    <div className="mt-4">
                        <button
                            onClick={startSetup}
                            disabled={pending}
                            className="rounded-md bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
                        >
                            {pending ? "…" : "Set up 2FA"}
                        </button>
                    </div>
                )}

                {setup && (
                    <div className="mt-4 space-y-4">
                        <div className="flex items-start gap-4">
                            {/* QR with next/image */}
                            <div className="h-32 w-32 relative border rounded-md overflow-hidden bg-white">
                                <Image
                                    src={setup.qrDataUrl}
                                    alt="QR for authenticator app"
                                    fill
                                    sizes="128px"
                                    priority
                                />
                            </div>
                            <div className="text-sm">
                                <div className="font-medium mb-1">
                                    Scan this QR code with your authenticator app
                                </div>
                                <div className="text-gray-600 break-all">
                                    Or manually enter this secret:{" "}
                                    <span className="font-mono">{setup.base32}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter 6-digit code"
                                inputMode="numeric"
                                className="border rounded-md px-2 py-1 text-sm w-40"
                                aria-label="6-digit authentication code"
                            />
                            <button
                                onClick={enable2FA}
                                disabled={pending || token.trim().length < 6}
                                className="rounded-md bg-black text-white px-3 py-1.5 text-sm disabled:opacity-60"
                            >
                                {pending ? "Verifying…" : "Verify & Enable"}
                            </button>
                        </div>
                    </div>
                )}

                {enabled && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            You can disable 2FA at any time.
                        </div>
                        <button
                            onClick={disable2FA}
                            disabled={pending}
                            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
                        >
                            {pending ? "…" : "Disable 2FA"}
                        </button>
                    </div>
                )}
            </section>

            {backupCodes && (
                <section className="border rounded-lg p-4">
                    <h2 className="font-medium mb-2">Backup Codes</h2>
                    <p className="text-sm text-gray-600 mb-3">
                        Save these in a safe place. Each code can be used once if you lose access to your authenticator app.
                    </p>
                    <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {backupCodes.map((c) => (
                            <li key={c} className="rounded border px-2 py-1 bg-gray-50">
                                {c}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}