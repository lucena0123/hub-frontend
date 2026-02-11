import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthenticatedLayout } from "@/components/auth/authenticated-layout";

const signalSans = Space_Grotesk({
  variable: "--font-signal-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const signalMono = IBM_Plex_Mono({
  variable: "--font-signal-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BPMN System - Business Process Management",
  description: "Monitor and manage your business processes, clients, and campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${signalSans.variable} ${signalMono.variable} antialiased premium-shell`}
      >
        <AuthProvider>
          <AuthGuard>
            <AuthenticatedLayout>
              {children}
            </AuthenticatedLayout>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
