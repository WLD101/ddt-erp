import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsQuery Voice",
  description:
    "AI receptionist foundation for inbound calls, lead capture, appointment handling, and telephony integrations.",
};

export default function VoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
