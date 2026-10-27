import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SosFab } from "@/components/layout/SosFab";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-bg text-ink pb-20 md:pb-0">
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
        <SosFab />
        <BottomNav />
      </body>
    </html>
  );
}
