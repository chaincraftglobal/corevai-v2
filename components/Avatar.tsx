// components/Avatar.tsx
export default function Avatar({
    name,
    src,
    side = "left",
}: {
    name: string;
    src?: string | null;
    side?: "left" | "right";
}) {
    const initials =
        name?.trim()
            ?.split(/\s+/)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase())
            .join("") || "U";

    return (
        <div
            className={`h-8 w-8 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0 ${side === "right" ? "order-2" : "order-1"
                }`}
            aria-label={`${name} avatar`}
        >
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={name} className="h-full w-full object-cover" />
            ) : (
                <span className="text-xs text-gray-600">{initials}</span>
            )}
        </div>
    );
}