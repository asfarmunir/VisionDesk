import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VisionDesk - Project Management Reimagined",
  description:
    "Modern project management platform with intuitive design and powerful features for teams.",
  keywords: [
    "project management",
    "team collaboration",
    "task tracking",
    "productivity",
  ],
  authors: [{ name: "VisionDesk Team" }],
  creator: "VisionDesk",
  metadataBase: new URL("https://visiondesk.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://visiondesk.com",
    title: "VisionDesk - Project Management Reimagined",
    description:
      "Modern project management platform with intuitive design and powerful features for teams.",
    siteName: "VisionDesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "VisionDesk - Project Management Reimagined",
    description:
      "Modern project management platform with intuitive design and powerful features for teams.",
    creator: "@visiondesk",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}
