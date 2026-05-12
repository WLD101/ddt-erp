import localFont from "next/font/local";

export const plusJakarta = localFont({
  src: [
    { path: "./plus-jakarta-latin.woff2", weight: "300 800", style: "normal" },
    { path: "./plus-jakarta-latin-ext.woff2", weight: "300 800", style: "normal" },
    { path: "./plus-jakarta-vietnamese.woff2", weight: "300 800", style: "normal" },
    { path: "./plus-jakarta-cyrillic.woff2", weight: "300 800", style: "normal" },
  ],
  variable: "--font-plus-jakarta",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
});
