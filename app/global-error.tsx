"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html>
            <body>
                <div className="h-dvh flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-2xl font-semibold">CoreVAI crashed</h1>
                    <p className="text-gray-600 mt-2 max-w-md">
                        {error?.message || "An unexpected error occurred."}
                    </p>
                    <div className="mt-4">
                        <button onClick={() => reset()} className="rounded-md bg-black text-white px-4 py-2 text-sm">
                            Reload
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}