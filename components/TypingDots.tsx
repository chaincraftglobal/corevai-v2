// components/TypingDots.tsx
import Avatar from "@/components/Avatar";

export default function TypingDots({
    name = "CoreVAI",
    avatarUrl = "/logo.svg",
}: {
    name?: string;
    avatarUrl?: string;
}) {
    return (
        <div className="my-3 flex justify-start">
            <div className="flex items-start gap-2 max-w-[80%]">
                <Avatar name={name} src={avatarUrl} side="left" />
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                        <span className="animate-pulse">•</span>
                        <span className="animate-pulse [animation-delay:150ms]">•</span>
                        <span className="animate-pulse [animation-delay:300ms]">•</span>
                    </div>
                </div>
            </div>
        </div>
    );
}