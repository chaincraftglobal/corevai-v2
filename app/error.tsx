"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-gray-600 mt-2 max-w-md">
                {error?.message || "An unexpected error occurred."}
            </p>
            <div className="mt-4 flex gap-2">
                <button onClick={() => reset()} className="rounded-md bg-black text-white px-4 py-2 text-sm">
                    Try again
                </button>
                <button onClick={() => (window.location.href = "/")} className="rounded-md border px-4 py-2 text-sm">
                    Go home
                </button>
            </div>
        </div>
    );
}