// github.com/dnlortega
// linkedin.com/in/daniel-op
"use client";
import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}
