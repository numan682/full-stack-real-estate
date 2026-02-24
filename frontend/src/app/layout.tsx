import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { TemplateAssets } from "@/components/template-assets";
import { defaultDescription, getSiteUrl, siteName } from "@/lib/site-config";

export const metadata: Metadata = {
  title: siteName,
  description: defaultDescription,
  metadataBase: new URL(getSiteUrl()),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D1A1C",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <TemplateAssets />
      </head>
      <body>{children}</body>
    </html>
  );
}
