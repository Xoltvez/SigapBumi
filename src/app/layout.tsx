import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SosFab } from "@/components/layout/SosFab";
import { ToastContainer } from "@/components/ui/Toast";
import { GsapPageTransition } from "@/components/common/GsapPageTransition";
import { IdleSessionManager } from "@/components/common/IdleSessionManager";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

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
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased selection:bg-primary selection:text-white`}>
      <body className="min-h-full flex flex-col font-sans bg-bg text-ink pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0 selection:bg-primary selection:text-white">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <Suspense fallback={null}>
          <IdleSessionManager />
        </Suspense>
        <ToastContainer />
        <GsapPageTransition>{children}</GsapPageTransition>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
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
