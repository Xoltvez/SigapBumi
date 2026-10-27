import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SosFab } from "@/components/layout/SosFab";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SigapBumi - Website Pelaporan Bencana Terpadu",
  description:
    "Platform pelaporan bencana berbasis masyarakat. Cepat, terverifikasi, dan transparan.",
  icons: {
    icon: "/logo_sigapbumi.png",
    apple: "/logo_sigapbumi.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-bg text-ink pb-20 md:pb-0">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <div className="flex-1 flex flex-col">{children}</div>
        <Suspense fallback={null}>
          <SosFab />
        </Suspense>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
