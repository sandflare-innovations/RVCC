import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const adminSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-enquire-sans",
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
    <html lang="en" className={adminSans.variable}>
      <body className="antialiased min-h-screen bg-zinc-50 font-enquire text-zinc-900 selection:bg-[#0073bc] selection:text-white">
        {children}
      </body>
    </html>
  );
}
