import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP SaaS",
  description: "Multi-tenant ERP SaaS System",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans">
        {children}
        <Toaster position="bottom-right" theme="dark" closeButton richColors />
      </body>
    </html>
  );
}
