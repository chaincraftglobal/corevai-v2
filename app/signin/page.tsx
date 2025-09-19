"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-sm border rounded-2xl p-6 space-y-4">
                <h1 className="text-xl font-semibold">Sign in</h1>
                <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="w-full rounded-md bg-black text-white py-2 text-sm"
                >
                    Continue with Google
                </button>
            </div>
        </div>
    );
}