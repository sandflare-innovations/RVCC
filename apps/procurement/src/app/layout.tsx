import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RVCC Procurement Portal",
  description: "Enterprise Procurement & Purchase Requisition Management System",
  icons: {
    icon: "/images/logo/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-[#0073bc] selection:text-white">
        {children}
      </body>
    </html>
  );
}
