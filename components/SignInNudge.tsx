"use client";
import { signIn } from "next-auth/react";

export default function SignInNudge({ message = "You’ve reached the guest limit." }: { message?: string }) {
    return (
        <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-xl p-3 text-sm flex items-center justify-between">
            <div>{message} Please sign in to continue.</div>
            <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="rounded-md bg-black text-white px-3 py-1.5 text-sm"
            >
                Sign in
            </button>
        </div>
    );
}