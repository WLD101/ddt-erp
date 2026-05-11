import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsQuery",
  description: "An AI-ready ERP for growing businesses to manage sales, inventory, purchases, expenses, reports, and connected commerce from one workspace.",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-inter">
        {children}
        <Toaster position="bottom-right" theme="light" closeButton richColors />
      </body>
    </html>
  );
}
