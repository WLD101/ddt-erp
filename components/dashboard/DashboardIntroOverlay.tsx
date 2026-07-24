"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function DashboardIntroOverlay() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  function close() {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 520);
  }

  useEffect(() => {
    const fallback = window.setTimeout(close, 11000);
    return () => window.clearTimeout(fallback);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[65] flex items-center justify-center bg-[#06152b]/32 px-5 backdrop-blur-[6px] transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-label="WhatsQuery dashboard intro"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,40,142,0.22),transparent_36%),radial-gradient(circle_at_30%_25%,rgba(80,180,255,0.22),transparent_28%),radial-gradient(circle_at_70%_72%,rgba(0,108,73,0.18),transparent_32%)]" />

      <div
        className={`relative w-full max-w-4xl transition-all duration-700 ${
          leaving ? "translate-y-8 scale-95 rotate-x-6 opacity-0" : "translate-y-0 scale-100 opacity-100"
        }`}
        style={{ perspective: "1300px" }}
      >
        <div className="absolute -inset-8 rounded-[44px] bg-primary/20 blur-3xl" />
        <div
          className="relative overflow-hidden rounded-[34px] border border-white/55 bg-linear-to-br from-white/95 via-[#f3f8ff]/92 to-[#dbeaff]/90 p-3 shadow-[0_36px_120px_rgba(0,28,88,0.34)]"
          style={{
            transform: "rotateX(4deg) rotateY(-5deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent" />
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#21d4fd]/20 blur-2xl" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary/15 blur-2xl" />

          <button
            type="button"
            onClick={close}
            className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-primary shadow-soft backdrop-blur transition hover:scale-105 hover:bg-white"
            aria-label="Close dashboard intro"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative overflow-hidden rounded-[26px] bg-[#071a38] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <video
              src="/dashboard-intro-0629.mp4"
              className="aspect-video w-full object-cover"
              autoPlay
              muted
              playsInline
              preload="metadata"
              onEnded={close}
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-[#06152b]/80 via-[#06152b]/15 to-transparent px-6 py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">WhatsQuery ERP</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-4xl">Your business command center is ready.</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
