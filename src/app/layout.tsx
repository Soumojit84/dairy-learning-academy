import type { Metadata, Viewport } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dairy Learning Academy | Learn. Practice. Excel.",
    template: "%s | Dairy Learning Academy",
  },
  description:
    "A focused learning platform for Dairy Science, Dairy Technology and competitive examination preparation.",
  applicationName: "Dairy Learning Academy",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f8f8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}