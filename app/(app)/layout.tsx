// app/(app)/layout.tsx
import { ReactNode } from "react";
import AppFrame from "@/components/AppFrame"; // Sidebar + TopBar wrapper

export const metadata = {
  title: "CoreVAI",
  description: "CoreVAI V2",
  icons: { icon: "/corevai-logo.png" },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100">
      <AppFrame>{children}</AppFrame>
    </div>
  );
}