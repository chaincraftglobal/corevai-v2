"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MFAVerifyPage() {
    const [token, setToken] = useState("");
    const [backup, setBackup] = useState("");
    const [busy, setBusy] = useState(false);
    const router = useRouter();

    const verify = async () => {
        setBusy(true);
        try {
            const r = await fetch("/api/mfa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token.trim() || undefined, backupCode: backup.trim() || undefined }),
            });
            const j = await r.json();
            if (j.ok) {
                router.replace("/"); // redirect wherever makes sense
            } else {
                alert(j.error || "Invalid code");
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="h-full grid place-items-center p-4">
            <div className="w-full max-w-sm border rounded-xl p-4 space-y-4">
                <h1 className="text-lg font-semibold">Two-Factor Verification</h1>
                <div className="space-y-2">
                    <input
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="6-digit code"
                        inputMode="numeric"
                        className="w-full border rounded-md px-2 py-2 text-sm"
                    />
                    <div className="text-center text-xs text-gray-500">— or —</div>
                    <input
                        value={backup}
                        onChange={(e) => setBackup(e.target.value)}
                        placeholder="Backup code"
                        className="w-full border rounded-md px-2 py-2 text-sm font-mono"
                    />
                </div>
                <button
                    onClick={verify}
                    disabled={busy || (!token.trim() && !backup.trim())}
                    className="w-full rounded-md bg-black text-white px-3 py-2 text-sm"
                >
                    {busy ? "Verifying…" : "Verify"}
                </button>
            </div>
        </div>
    );
}