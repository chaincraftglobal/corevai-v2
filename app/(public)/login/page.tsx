"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const handleCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        const fd = new FormData(e.currentTarget);
        const email = (fd.get("email") as string).toLowerCase().trim();
        const password = fd.get("password") as string;

        const res = await signIn("credentials", { email, password, redirect: false });
        setLoading(false);

        if (res?.error) {
            setErr("Invalid email or password.");
            return;
        }
        router.push("/chats");
    };

    return (
        <div className="max-w-md mx-auto py-12">
            <h1 className="text-2xl font-semibold mb-6">Login to CoreVAI</h1>

            <form onSubmit={handleCredentials} className="space-y-4">
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="w-full border px-3 py-2 rounded-md"
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="w-full border px-3 py-2 rounded-md"
                />
                {err && <p className="text-sm text-red-600">{err}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <div className="my-6 text-center text-sm text-gray-500">OR</div>

            <button
                onClick={() => signIn("google", { callbackUrl: "/chats" })}
                className="w-full flex items-center justify-center gap-2 border py-2 rounded-md hover:bg-gray-50"
            >
                <Image
                    src="/google-icon.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    priority
                />
                Continue with Google
            </button>
        </div>
    );
}