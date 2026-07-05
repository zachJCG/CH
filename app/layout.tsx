import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { DemoProvider } from "@/lib/demo/store";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CH Ops Diary",
    template: "%s · CH Ops Diary",
  },
  description:
    "The daily operations diary for short-term-rental teams: morning check-in, work diary with time estimates, and a confirmed day plan — so nothing slips between the cracks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DemoProvider>{children}</DemoProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
