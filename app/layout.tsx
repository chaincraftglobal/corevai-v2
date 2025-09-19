// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import ThemeProvider from "@/components/ThemeProvider";
import Providers from "@/components/providers";

export const metadata = {
    title: "CoreVAI",
    description: "CoreVAI V2",
    icons: { icon: "/corevai-logo.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {/* Global providers that should wrap BOTH (public) and (app) */}
                <ThemeProvider>
                    <Providers>{children}</Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}