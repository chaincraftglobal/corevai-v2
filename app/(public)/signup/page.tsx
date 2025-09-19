"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        const fd = new FormData(e.currentTarget);
        const name = (fd.get("name") as string).trim();
        const email = (fd.get("email") as string).toLowerCase().trim();
        const password = fd.get("password") as string;

        const r = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            setErr(data?.error || "Signup failed.");
            setLoading(false);
            return;
        }

        const login = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        setLoading(false);

        if (login?.error) {
            setErr("Account created, but login failed. Try logging in.");
            return;
        }
        router.push("/chats");
    };

    return (
        <div className="max-w-md mx-auto py-12">
            <h1 className="text-2xl font-semibold mb-6">
                Create your CoreVAI account
            </h1>

            <form onSubmit={handleSignup} className="space-y-4">
                <input
                    name="name"
                    type="text"
                    placeholder="Full name"
                    required
                    className="w-full border px-3 py-2 rounded-md"
                />
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
                    placeholder="Password (min 6)"
                    required
                    className="w-full border px-3 py-2 rounded-md"
                />
                {err && <p className="text-sm text-red-600">{err}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
                >
                    {loading ? "Creating account..." : "Sign up"}
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
                Sign up with Google
            </button>
        </div>
    );
}