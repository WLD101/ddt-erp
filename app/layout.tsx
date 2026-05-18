import type { Metadata } from "next";
import "./globals.css";
import { plusJakarta } from "@/app/fonts/plus-jakarta";

export const metadata: Metadata = {
  title: "WhatsQuery",
  description: "An AI-ready ERP for growing businesses to manage sales, inventory, purchases, expenses, reports, and connected commerce from one workspace.",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/favicon.png?v=2", type: "image/png" },
      { url: "/logo-mark.png?v=2", type: "image/png" },
    ],
    shortcut: ["/favicon.ico?v=2"],
    apple: [{ url: "/logo-mark.png?v=2" }],
  },
  openGraph: {
    title: "WhatsQuery",
    description:
      "An AI-ready ERP for growing businesses to manage sales, inventory, purchases, expenses, reports, and connected commerce from one workspace.",
    images: [{ url: "/logo-mark.png", width: 512, height: 512 }],
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${plusJakarta.variable}`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">
        {children}
        <Toaster position="bottom-right" theme="light" closeButton richColors />
      </body>
    </html>
  );
}
