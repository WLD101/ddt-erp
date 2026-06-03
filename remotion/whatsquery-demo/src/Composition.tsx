import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {fontFamily as plusJakartaFontFamily, loadFont} from "@remotion/google-fonts/PlusJakartaSans";

loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const fps = 30;

const BRAND = {
  bg: "#030817",
  bgSoft: "#091128",
  text: "#f8fbff",
  textMuted: "#aeb9d4",
  textSoft: "#6f7ea4",
  indigo: "#625fff",
  indigoSoft: "#c4cbff",
  purple: "#ac4bff",
  cyan: "#06b6d4",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  border: "rgba(255,255,255,0.12)",
};

const SHOTS = {
  dashboard: staticFile("screens/dashboard.png"),
  assistant: staticFile("screens/assistant.png"),
  customers: staticFile("screens/customers.png"),
  products: staticFile("screens/products.png"),
  salesA: staticFile("screens/sales-a.png"),
  salesB: staticFile("screens/sales-b.png"),
  reports: staticFile("screens/reports.png"),
  integrations: staticFile("screens/integrations.png"),
  logo: staticFile("logo-emblem.png"),
};

const AUDIO = {
  music: staticFile("audio/whatsquery-music-bed.wav"),
  voiceover: staticFile("audio/whatsquery-voiceover.wav"),
  whoosh: staticFile("audio/sfx-whoosh.wav"),
  click: staticFile("audio/sfx-click.wav"),
  chime: staticFile("audio/sfx-chime.wav"),
  pulse: staticFile("audio/sfx-pulse.wav"),
  ringtone: staticFile("audio/sfx-ringtone.wav"),
  sync: staticFile("audio/sfx-sync.wav"),
  logoSting: staticFile("audio/sfx-logo-sting.wav"),
};

const starSeed = Array.from({length: 46}, (_, index) => ({
  left: ((index * 87) % 980) / 9.8,
  top: ((index * 149) % 620) / 6.2,
  size: 2 + (index % 3),
  opacity: 0.22 + (index % 5) * 0.12,
}));

const scaleIn = (frame: number, delay = 0, duration = 24) =>
  spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: {
      damping: 200,
      stiffness: 180,
      mass: 0.9,
    },
    durationInFrames: duration,
  });

const PageBackground: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 18% 16%, rgba(98,95,255,0.18), transparent 24%), radial-gradient(circle at 82% 12%, rgba(172,75,255,0.18), transparent 22%), radial-gradient(circle at 60% 88%, rgba(6,182,212,0.12), transparent 26%), linear-gradient(180deg, #050b19 0%, #030817 54%, #020611 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.48,
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.34), rgba(0,0,0,0.9))",
        }}
      />
      {starSeed.map((star, index) => {
        const pulse = interpolate(
          (frame + index * 5) % 90,
          [0, 45, 90],
          [0.38, 1, 0.4],
          {easing: Easing.inOut(Easing.sin)}
        );

        return (
          <div
            key={`${index}-${star.left}-${star.top}`}
            style={{
              position: "absolute",
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              borderRadius: 999,
              background: "#dbe7ff",
              opacity: pulse * star.opacity,
              boxShadow: "0 0 14px rgba(219,231,255,0.5)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const BrandLockup: React.FC = () => (
  <div style={{display: "flex", alignItems: "center", gap: 16}}>
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: 18,
        background: "rgba(255,255,255,0.08)",
        border: `1px solid ${BRAND.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 16px 36px rgba(0,0,0,0.25)",
      }}
    >
      <Img
        src={SHOTS.logo}
        style={{width: 40, height: 40, objectFit: "contain"}}
      />
    </div>
    <div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: BRAND.text,
        }}
      >
        WhatsQuery
      </div>
      <div
        style={{
          marginTop: 4,
          color: BRAND.indigoSoft,
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
        }}
      >
        ERP Platform
      </div>
    </div>
  </div>
);

const Eyebrow: React.FC<{label: string; accent?: string}> = ({
  label,
  accent = BRAND.indigo,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 18px",
      borderRadius: 999,
      border: `1px solid ${accent}55`,
      background: `${accent}14`,
      fontSize: 15,
      fontWeight: 800,
      color: BRAND.indigoSoft,
      textTransform: "uppercase",
      letterSpacing: "0.24em",
    }}
  >
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        background: accent,
        boxShadow: `0 0 18px ${accent}`,
      }}
    />
    {label}
  </div>
);

const Headline: React.FC<{
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  maxWidth?: number;
}> = ({title, subtitle, align = "left", maxWidth = 720}) => (
  <div style={{maxWidth, textAlign: align}}>
    <div
      style={{
        marginTop: 20,
        fontSize: align === "center" ? 70 : 58,
        lineHeight: 1.04,
        fontWeight: 800,
        letterSpacing: "-0.055em",
        color: BRAND.text,
      }}
    >
      {title}
    </div>
    {subtitle ? (
      <div
        style={{
          marginTop: 16,
          fontSize: 22,
          lineHeight: 1.45,
          color: BRAND.textMuted,
          fontWeight: 500,
        }}
      >
        {subtitle}
      </div>
    ) : null}
  </div>
);

const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}> = ({children, style, title}) => (
  <div
    style={{
      borderRadius: 28,
      border: `1px solid ${BRAND.border}`,
      background: "rgba(9,17,40,0.68)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
      backdropFilter: "blur(14px)",
      padding: 22,
      ...style,
    }}
  >
    {title ? (
      <div
        style={{
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: "0.24em",
          color: BRAND.textSoft,
          fontWeight: 800,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
    ) : null}
    {children}
  </div>
);

const ScreenshotCard: React.FC<{
  src: string;
  frame: number;
  delay?: number;
  style?: React.CSSProperties;
  xFrom?: number;
  yFrom?: number;
  scaleFrom?: number;
  rotation?: number;
}> = ({
  src,
  frame,
  delay = 0,
  style,
  xFrom = 0,
  yFrom = 24,
  scaleFrom = 0.96,
  rotation = 0,
}) => {
  const p = scaleIn(frame, delay, 28);
  const opacity = interpolate(p, [0, 1], [0, 1]);
  const x = interpolate(p, [0, 1], [xFrom, 0]);
  const y = interpolate(p, [0, 1], [yFrom, 0]);
  const scale = interpolate(p, [0, 1], [scaleFrom, 1]);

  return (
    <div
      style={{
        borderRadius: 30,
        border: `1px solid ${BRAND.border}`,
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 90px rgba(0,0,0,0.42)",
        overflow: "hidden",
        opacity,
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`,
        ...style,
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
};

const MetricBadge: React.FC<{
  label: string;
  value: string;
  tone?: string;
  frame: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({label, value, tone = BRAND.indigo, frame, delay = 0, style}) => {
  const p = scaleIn(frame, delay, 24);
  return (
    <GlassCard
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [20, 0])}px)`,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.24em",
          color: BRAND.textSoft,
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 34,
          fontWeight: 800,
          color: BRAND.text,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 14,
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            width: "72%",
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${tone}66, ${tone})`,
          }}
        />
      </div>
    </GlassCard>
  );
};

const OrbitCard: React.FC<{
  label: string;
  accent: string;
  angle: number;
  radius: number;
  frame: number;
  delay?: number;
}> = ({label, accent, angle, radius, frame, delay = 0}) => {
  const p = scaleIn(frame, delay, 26);
  const x = Math.cos(angle) * radius * p;
  const y = Math.sin(angle) * radius * p;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(${x - 92}px, ${y - 34}px)`,
        opacity: p,
      }}
    >
      <div
        style={{
          borderRadius: 18,
          border: `1px solid ${accent}55`,
          background: `${accent}18`,
          padding: "14px 18px",
          color: BRAND.text,
          fontSize: 18,
          fontWeight: 700,
          minWidth: 184,
          textAlign: "center",
          boxShadow: "0 18px 44px rgba(0,0,0,0.28)",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const ConnectionLine: React.FC<{
  from: {x: number; y: number};
  to: {x: number; y: number};
  frame: number;
  delay?: number;
}> = ({from, to, frame, delay = 0}) => {
  const p = scaleIn(frame, delay, 24);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <div
      style={{
        position: "absolute",
        left: from.x,
        top: from.y,
        width: length * p,
        height: 4,
        transformOrigin: "left center",
        transform: `rotate(${angle}deg)`,
        borderRadius: 999,
        background:
          "linear-gradient(90deg, rgba(6,182,212,0.05), rgba(6,182,212,0.95), rgba(98,95,255,0.95))",
        boxShadow: "0 0 18px rgba(6,182,212,0.45)",
      }}
    />
  );
};

const Typewriter: React.FC<{text: string; frame: number; start: number}> = ({
  text,
  frame,
  start,
}) => {
  const count = Math.floor(
    interpolate(frame, [start, start + 34], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  return <>{text.slice(0, count)}</>;
};

const Cue: React.FC<{
  from: number;
  duration?: number;
  src: string;
  volume?: number;
}> = ({from, duration = 30, src, volume = 0.35}) => (
  <Sequence from={from} durationInFrames={duration}>
    <Audio src={src} volume={volume} />
  </Sequence>
);

const ShellTop: React.FC = () => (
  <div style={{position: "absolute", left: 70, top: 50}}>
    <BrandLockup />
  </div>
);

const Shot1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const show = interpolate(frame, [16, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div
        style={{
          margin: "auto",
          textAlign: "center",
          transform: `scale(${interpolate(frame, [0, 50], [0.96, 1], {
            extrapolateRight: "clamp",
          })})`,
        }}
      >
        <div
          style={{
            fontSize: 84,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            color: BRAND.text,
            opacity: show,
          }}
        >
          Your Business.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Shot2Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    {label: "Ringing phone", x: 220, y: 240, color: BRAND.red},
    {label: "Invoice card", x: 1320, y: 210, color: BRAND.purple},
    {label: "Missed call", x: 260, y: 620, color: BRAND.amber},
    {label: "Order slip", x: 1240, y: 650, color: BRAND.cyan},
    {label: "Inventory box", x: 540, y: 740, color: BRAND.green},
    {label: "Report chart", x: 980, y: 760, color: BRAND.indigo},
  ];

  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div
          style={{
            fontSize: 84,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            color: BRAND.text,
          }}
        >
          Your Business.
        </div>
      </div>
      {items.map((item, index) => {
        const p = scaleIn(frame, index * 4, 22);
        return (
          <div
            key={item.label}
            style={{
              position: "absolute",
              left: item.x,
              top: item.y,
              borderRadius: 18,
              border: `1px solid ${BRAND.border}`,
              background: "rgba(255,255,255,0.06)",
              padding: "14px 16px",
              color: BRAND.text,
              fontSize: 18,
              fontWeight: 700,
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [28, 0])}px)`,
              boxShadow: "0 16px 36px rgba(0,0,0,0.26)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: item.color,
                marginRight: 10,
                boxShadow: `0 0 18px ${item.color}`,
              }}
            />
            {item.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Shot3Organize: React.FC = () => {
  const frame = useCurrentFrame();
  const p = scaleIn(frame, 8, 24);

  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.7, 1])})`,
          width: 260,
          height: 260,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(98,95,255,0.42) 0%, rgba(172,75,255,0.24) 42%, rgba(6,182,212,0.1) 74%, transparent 100%)",
          boxShadow: "0 0 140px rgba(98,95,255,0.55)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 84,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            background:
              "linear-gradient(90deg, #ffffff, #c4cbff 36%, #8bbdff 72%, #8af3ff 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Automated by AI.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Shot4DashboardReveal: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 170}}>
        <Eyebrow label="ERP Dashboard" />
        <Headline title="One intelligent platform" maxWidth={560} />
      </div>
      <ScreenshotCard
        src={SHOTS.dashboard}
        frame={frame}
        delay={10}
        xFrom={70}
        yFrom={30}
        scaleFrom={0.85}
        style={{
          position: "absolute",
          right: 70,
          top: 180,
          width: 1140,
          height: 720,
        }}
      />
    </AbsoluteFill>
  );
};

const Shot5DashboardFull: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 150}}>
        <Eyebrow label="Core Operations" />
        <Headline
          title="One intelligent platform for business operations."
          subtitle="Sales, customers, products, invoices, finance, and reports built into one clean daily workspace."
          maxWidth={650}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.dashboard}
        frame={frame}
        delay={6}
        style={{
          position: "absolute",
          right: 70,
          top: 220,
          width: 1100,
          height: 660,
        }}
      />
      <MetricBadge
        label="Sales"
        value="PKR 839K"
        tone={BRAND.indigo}
        frame={frame}
        delay={18}
        style={{position: "absolute", left: 88, bottom: 138, width: 230}}
      />
      <MetricBadge
        label="Customers"
        value="500"
        tone={BRAND.cyan}
        frame={frame}
        delay={26}
        style={{position: "absolute", left: 338, bottom: 106, width: 220}}
      />
      <MetricBadge
        label="Invoices"
        value="300"
        tone={BRAND.purple}
        frame={frame}
        delay={34}
        style={{position: "absolute", left: 578, bottom: 138, width: 220}}
      />
    </AbsoluteFill>
  );
};

const Shot6CommandCenter: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 160}}>
        <Eyebrow label="Command Center" accent={BRAND.cyan} />
        <Headline
          title="Manage everything from one command center."
          subtitle="A single view for business intelligence, transactions, cloud sync, and guided AI actions."
          maxWidth={650}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.dashboard}
        frame={frame}
        delay={10}
        style={{
          position: "absolute",
          right: 60,
          top: 218,
          width: 1120,
          height: 680,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 570,
          top: 370,
          width: 440,
          height: 220,
          borderRadius: 999,
          border: "3px solid rgba(98,95,255,0.55)",
          boxShadow: "0 0 36px rgba(98,95,255,0.28)",
          opacity: interpolate(frame, [18, 40, 58], [0, 1, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

const Shot7Modules: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 158}}>
        <Eyebrow label="Connected Modules" accent={BRAND.purple} />
        <Headline
          title="Customers. Products. Sales. Finance."
          subtitle="Every module connects through one intelligent operational hub."
          maxWidth={650}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 180,
          top: 240,
          width: 760,
          height: 560,
        }}
      >
        <ScreenshotCard
          src={SHOTS.dashboard}
          frame={frame}
          delay={6}
          style={{
            position: "absolute",
            left: 140,
            top: 120,
            width: 480,
            height: 320,
          }}
        />
        <OrbitCard
          label="Customers"
          accent={BRAND.cyan}
          angle={-1.6}
          radius={210}
          frame={frame}
          delay={16}
        />
        <OrbitCard
          label="Products"
          accent={BRAND.indigo}
          angle={-0.5}
          radius={235}
          frame={frame}
          delay={24}
        />
        <OrbitCard
          label="Inventory"
          accent={BRAND.green}
          angle={0.45}
          radius={230}
          frame={frame}
          delay={32}
        />
        <OrbitCard
          label="Sales"
          accent={BRAND.purple}
          angle={1.2}
          radius={218}
          frame={frame}
          delay={40}
        />
        <OrbitCard
          label="Finance"
          accent={BRAND.amber}
          angle={2.2}
          radius={220}
          frame={frame}
          delay={48}
        />
        <OrbitCard
          label="Reports"
          accent={BRAND.red}
          angle={3.05}
          radius={204}
          frame={frame}
          delay={56}
        />
      </div>
    </AbsoluteFill>
  );
};

const Shot8Customers: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 150}}>
        <Eyebrow label="Customer Directory" accent={BRAND.cyan} />
        <Headline
          title="Organize customers and suppliers."
          subtitle="Real WhatsQuery-style customer tables, balances, and quick actions — all in one workspace."
          maxWidth={680}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.customers}
        frame={frame}
        delay={10}
        xFrom={54}
        style={{
          position: "absolute",
          right: 70,
          top: 250,
          width: 1120,
          height: 620,
        }}
      />
    </AbsoluteFill>
  );
};

const Shot9CustomerDetails: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.customers}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          left: 70,
          top: 160,
          width: 1080,
          height: 680,
        }}
      />
      <GlassCard
        title="Customer details saved"
        style={{
          position: "absolute",
          right: 92,
          top: 250,
          width: 430,
          opacity: scaleIn(frame, 18),
        }}
      >
        <div style={{display: "grid", gap: 14}}>
          {[
            "Name · Ali Traders",
            "Phone · 041-7736891",
            "Balance · PKR 100,000",
            "Recent invoice · INV-041372",
          ].map((row, index) => (
            <div
              key={row}
              style={{
                borderRadius: 18,
                border: `1px solid ${BRAND.border}`,
                background: "rgba(255,255,255,0.05)",
                padding: "14px 16px",
                fontSize: 18,
                color: BRAND.text,
                fontWeight: 700,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{row}</span>
              <span style={{color: index === 2 ? BRAND.red : BRAND.green}}>
                {index === 2 ? "Due" : "Saved"}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
      <div style={{position: "absolute", right: 110, bottom: 122}}>
        <Headline
          title="Every relationship, clearly tracked."
          maxWidth={420}
        />
      </div>
    </AbsoluteFill>
  );
};

const Shot10Products: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 146}}>
        <Eyebrow label="Products + Inventory" accent={BRAND.green} />
        <Headline
          title="Track products and inventory in real time."
          subtitle="Stock counts, pricing, categories, and inventory-aware product management in one clean interface."
          maxWidth={690}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.products}
        frame={frame}
        delay={10}
        style={{
          position: "absolute",
          right: 70,
          top: 242,
          width: 1120,
          height: 640,
        }}
      />
    </AbsoluteFill>
  );
};

const Shot11InventoryUpdate: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.products}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          left: 70,
          top: 170,
          width: 1100,
          height: 660,
        }}
      />
      <ConnectionLine
        from={{x: 1110, y: 510}}
        to={{x: 1510, y: 370}}
        frame={frame}
        delay={18}
      />
      <GlassCard
        title="Inventory updated"
        style={{
          position: "absolute",
          right: 90,
          top: 290,
          width: 380,
          opacity: scaleIn(frame, 24),
        }}
      >
        <div style={{fontSize: 26, fontWeight: 800, color: BRAND.text}}>
          Order synced to stock
        </div>
        <div
          style={{
            marginTop: 12,
            color: BRAND.textMuted,
            fontSize: 18,
            lineHeight: 1.5,
          }}
        >
          Quantity adjusted automatically after the sale moved through the workflow.
        </div>
      </GlassCard>
      <div style={{position: "absolute", right: 100, bottom: 138}}>
        <Headline title="Inventory updates as work moves." maxWidth={420} />
      </div>
    </AbsoluteFill>
  );
};

const Shot12SalesWorkflow: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 152}}>
        <Eyebrow label="Sales Workflow" accent={BRAND.purple} />
        <Headline
          title="Create sales in seconds."
          subtitle="Customer selected, products added, invoice prepared — all inside one consistent sales workspace."
          maxWidth={680}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.salesA}
        frame={frame}
        delay={10}
        style={{
          position: "absolute",
          right: 70,
          top: 250,
          width: 1120,
          height: 620,
        }}
      />
    </AbsoluteFill>
  );
};

const Shot13InvoiceGenerated: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.salesB}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          left: 70,
          top: 170,
          width: 1040,
          height: 640,
        }}
      />
      <GlassCard
        title="Invoice generated"
        style={{
          position: "absolute",
          right: 96,
          top: 250,
          width: 430,
          opacity: scaleIn(frame, 22),
        }}
      >
        <div style={{display: "grid", gap: 14}}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: BRAND.text,
            }}
          >
            INV-303317
          </div>
          <div style={{fontSize: 18, color: BRAND.textMuted}}>
            Customer · Ahmed Electronics
          </div>
          <div style={{fontSize: 18, color: BRAND.textMuted}}>
            Total · PKR 349,999.9
          </div>
          <div
            style={{
              borderRadius: 999,
              display: "inline-flex",
              padding: "10px 16px",
              background: "rgba(16,185,129,0.18)",
              color: BRAND.green,
              fontWeight: 800,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              width: "fit-content",
            }}
          >
            Generated
          </div>
        </div>
      </GlassCard>
      <div style={{position: "absolute", right: 98, bottom: 110}}>
        <Headline
          title="Invoices, payments, and records — connected."
          maxWidth={420}
        />
      </div>
    </AbsoluteFill>
  );
};

const Shot14PaymentTracking: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.salesB}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          left: 70,
          top: 180,
          width: 980,
          height: 620,
        }}
      />
      <GlassCard
        title="Payment tracking"
        style={{
          position: "absolute",
          right: 90,
          top: 234,
          width: 450,
          opacity: scaleIn(frame, 16),
        }}
      >
        <div style={{display: "grid", gap: 12}}>
          {[
            {label: "Paid", tone: BRAND.green},
            {label: "Pending", tone: BRAND.amber},
            {label: "Due", tone: BRAND.red},
          ].map((item, index) => (
            <div
              key={item.label}
              style={{
                borderRadius: 18,
                border: `1px solid ${BRAND.border}`,
                background: "rgba(255,255,255,0.05)",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{fontSize: 20, fontWeight: 700, color: BRAND.text}}>
                Invoice batch {index + 1}
              </div>
              <div
                style={{
                  borderRadius: 999,
                  padding: "8px 14px",
                  background: `${item.tone}22`,
                  color: item.tone,
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <div style={{position: "absolute", right: 102, bottom: 108}}>
        <Headline
          title="Track payments without losing control."
          maxWidth={430}
        />
      </div>
    </AbsoluteFill>
  );
};

const Shot15FinanceSummary: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 170}}>
        <Eyebrow label="Finance Summary" accent={BRAND.green} />
        <Headline
          title="Know where your business stands."
          subtitle="Revenue, expenses, balance, and cashflow surfaced as one clean financial pulse."
          maxWidth={640}
        />
      </div>
      <MetricBadge
        label="Revenue"
        value="PKR 840K"
        tone={BRAND.indigo}
        frame={frame}
        delay={10}
        style={{position: "absolute", left: 86, bottom: 170, width: 260}}
      />
      <MetricBadge
        label="Expenses"
        value="PKR 0"
        tone={BRAND.red}
        frame={frame}
        delay={18}
        style={{position: "absolute", left: 366, bottom: 132, width: 240}}
      />
      <MetricBadge
        label="Net Profit"
        value="PKR 40K"
        tone={BRAND.green}
        frame={frame}
        delay={26}
        style={{position: "absolute", left: 626, bottom: 170, width: 250}}
      />
      <GlassCard
        title="Cashflow pulse"
        style={{
          position: "absolute",
          right: 90,
          top: 250,
          width: 720,
          height: 360,
          opacity: scaleIn(frame, 20),
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            alignItems: "end",
            gap: 16,
            height: 220,
            marginTop: 34,
          }}
        >
          {[64, 72, 58, 80, 88, 74, 96, 104].map((bar, index) => (
            <div
              key={`${bar}-${index}`}
              style={{
                height: `${bar}%`,
                borderRadius: "20px 20px 8px 8px",
                background:
                  "linear-gradient(180deg, rgba(98,95,255,0.95), rgba(6,182,212,0.76))",
                boxShadow: "0 0 24px rgba(98,95,255,0.2)",
              }}
            />
          ))}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};

const Shot16Reports: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 150}}>
        <Eyebrow label="Reports + Analytics" accent={BRAND.cyan} />
        <Headline
          title="Turn daily operations into clear insights."
          subtitle="Use real report filters, KPIs, and business trends to understand performance at a glance."
          maxWidth={700}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.reports}
        frame={frame}
        delay={10}
        style={{
          position: "absolute",
          right: 70,
          top: 250,
          width: 1120,
          height: 620,
        }}
      />
    </AbsoluteFill>
  );
};

const Shot17Insight: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.reports}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          left: 70,
          top: 170,
          width: 1080,
          height: 660,
        }}
      />
      <GlassCard
        title="AI insight"
        style={{
          position: "absolute",
          right: 98,
          top: 270,
          width: 430,
          opacity: scaleIn(frame, 18),
        }}
      >
        <div style={{fontSize: 28, fontWeight: 800, color: BRAND.text}}>
          Sales increased today
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 18,
            color: BRAND.textMuted,
            lineHeight: 1.5,
          }}
        >
          Top product: Sample Item. Revenue trend is ahead of the last cycle.
        </div>
      </GlassCard>
      <div style={{position: "absolute", right: 110, bottom: 126}}>
        <Headline title="See patterns faster." maxWidth={420} />
      </div>
    </AbsoluteFill>
  );
};

const Shot18Assistant: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 150}}>
        <Eyebrow label="Smart Assistant" accent={BRAND.indigo} />
        <Headline
          title="Built-in AI assistance."
          subtitle="The assistant understands natural requests, prepares safe previews, and keeps your workflow moving."
          maxWidth={620}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.assistant}
        frame={frame}
        delay={10}
        style={{
          position: "absolute",
          right: 70,
          top: 238,
          width: 1120,
          height: 640,
        }}
      />
    </AbsoluteFill>
  );
};

const Shot19AssistantAction: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.assistant}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          left: 70,
          top: 170,
          width: 1120,
          height: 650,
        }}
      />
      <ConnectionLine
        from={{x: 1140, y: 440}}
        to={{x: 1560, y: 360}}
        frame={frame}
        delay={20}
      />
      <GlassCard
        title="Live prompt"
        style={{
          position: "absolute",
          right: 90,
          top: 270,
          width: 420,
          opacity: scaleIn(frame, 24),
        }}
      >
        <div
          style={{
            fontSize: 24,
            lineHeight: 1.5,
            fontWeight: 700,
            color: BRAND.text,
          }}
        >
          <Typewriter
            text="Show today's sales. Then highlight unpaid invoices."
            frame={frame}
            start={24}
          />
        </div>
      </GlassCard>
      <div style={{position: "absolute", right: 106, bottom: 126}}>
        <Headline title="Ask. Analyze. Act faster." maxWidth={390} />
      </div>
    </AbsoluteFill>
  );
};

const Shot20VoiceIntro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.dashboard}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          left: 70,
          top: 190,
          width: 860,
          height: 560,
        }}
      />
      <GlassCard
        title="Incoming call"
        style={{
          position: "absolute",
          right: 100,
          top: 300,
          width: 450,
          opacity: scaleIn(frame, 14),
        }}
      >
        <div style={{fontSize: 30, fontWeight: 800, color: BRAND.text}}>
          Ahmed Electronics
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 18,
            color: BRAND.textMuted,
          }}
        >
          Voice workflow detected
        </div>
      </GlassCard>
      <div style={{position: "absolute", left: 100, top: 104}}>
        <Eyebrow label="WhatsQuery Voice" accent={BRAND.cyan} />
        <Headline title="Meet WhatsQuery Voice." maxWidth={520} />
      </div>
    </AbsoluteFill>
  );
};

const Shot21CallAnswered: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate((frame % 36), [0, 18, 36], [0.6, 1, 0.6]);
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <GlassCard
        title="AI call answered"
        style={{
          position: "absolute",
          left: 120,
          top: 230,
          width: 740,
          height: 380,
        }}
      >
        <div style={{fontSize: 46, fontWeight: 800, color: BRAND.text}}>
          AI Call Answered
        </div>
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            height: 140,
          }}
        >
          {[24, 60, 90, 50, 110, 68, 88, 36, 72, 120].map((bar, index) => (
            <div
              key={`${bar}-${index}`}
              style={{
                width: 22,
                height: bar * pulse,
                borderRadius: 999,
                background:
                  "linear-gradient(180deg, rgba(6,182,212,0.9), rgba(98,95,255,0.82))",
              }}
            />
          ))}
        </div>
      </GlassCard>
      <div style={{position: "absolute", right: 120, top: 270}}>
        <Headline
          title="AI receptionist for business calls."
          subtitle="Voice-ready workflows that connect the call layer to your business system."
          maxWidth={520}
        />
      </div>
    </AbsoluteFill>
  );
};

const Shot22Booking: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <GlassCard
        title="Table booking request"
        style={{
          position: "absolute",
          left: 180,
          top: 280,
          width: 520,
          opacity: scaleIn(frame, 12),
        }}
      >
        <div style={{fontSize: 30, fontWeight: 800, color: BRAND.text}}>
          Reservation for tomorrow · 7:30 PM
        </div>
        <div style={{marginTop: 16, fontSize: 18, color: BRAND.textMuted}}>
          Caller details saved for staff review.
        </div>
        <div
          style={{
            marginTop: 20,
            display: "inline-flex",
            borderRadius: 999,
            background: "rgba(16,185,129,0.18)",
            color: BRAND.green,
            padding: "10px 16px",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Request saved
        </div>
      </GlassCard>
      <div style={{position: "absolute", right: 150, top: 314}}>
        <Headline title="Bookings captured automatically." maxWidth={500} />
      </div>
    </AbsoluteFill>
  );
};

const Shot23OrderSynced: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.salesA}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          right: 90,
          top: 210,
          width: 920,
          height: 520,
        }}
      />
      <GlassCard
        title="Order request"
        style={{
          position: "absolute",
          left: 110,
          top: 320,
          width: 400,
          opacity: scaleIn(frame, 10),
        }}
      >
        <div style={{fontSize: 26, fontWeight: 800, color: BRAND.text}}>
          Caller requested 2 white raw cloth rolls
        </div>
      </GlassCard>
      <ConnectionLine
        from={{x: 514, y: 430}}
        to={{x: 1010, y: 420}}
        frame={frame}
        delay={18}
      />
      <div style={{position: "absolute", left: 110, top: 206}}>
        <Headline title="Orders move into your system." maxWidth={420} />
      </div>
    </AbsoluteFill>
  );
};

const Shot24CustomerSaved: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <ScreenshotCard
        src={SHOTS.customers}
        frame={frame}
        delay={8}
        style={{
          position: "absolute",
          right: 70,
          top: 200,
          width: 960,
          height: 560,
        }}
      />
      <GlassCard
        title="Customer saved"
        style={{
          position: "absolute",
          left: 110,
          top: 310,
          width: 420,
          opacity: scaleIn(frame, 12),
        }}
      >
        <div style={{fontSize: 28, fontWeight: 800, color: BRAND.text}}>
          New contact added to the workspace
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 18,
            color: BRAND.textMuted,
          }}
        >
          Calls become organized business records with structured customer history.
        </div>
      </GlassCard>
      <div style={{position: "absolute", left: 110, top: 214}}>
        <Headline
          title="Calls become organized business records."
          maxWidth={470}
        />
      </div>
    </AbsoluteFill>
  );
};

const Shot25Unified: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <ShellTop />
      <div style={{position: "absolute", left: 80, top: 110}}>
        <Eyebrow label="Unified Ecosystem" accent={BRAND.cyan} />
        <Headline
          title="ERP + AI Receptionist"
          subtitle="Connected in one intelligent ecosystem."
          maxWidth={620}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.dashboard}
        frame={frame}
        delay={10}
        style={{
          position: "absolute",
          left: 110,
          top: 280,
          width: 760,
          height: 430,
        }}
      />
      <ScreenshotCard
        src={SHOTS.assistant}
        frame={frame}
        delay={20}
        xFrom={-30}
        yFrom={18}
        style={{
          position: "absolute",
          right: 140,
          top: 250,
          width: 620,
          height: 350,
        }}
      />
      <ScreenshotCard
        src={SHOTS.integrations}
        frame={frame}
        delay={30}
        xFrom={40}
        yFrom={18}
        style={{
          position: "absolute",
          right: 100,
          bottom: 120,
          width: 660,
          height: 320,
        }}
      />
      <ConnectionLine
        from={{x: 870, y: 484}}
        to={{x: 1180, y: 418}}
        frame={frame}
        delay={26}
      />
      <ConnectionLine
        from={{x: 1260, y: 596}}
        to={{x: 1260, y: 724}}
        frame={frame}
        delay={36}
      />
    </AbsoluteFill>
  );
};

const Shot26Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const p = scaleIn(frame, 8, 28);
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            transform: `scale(${interpolate(p, [0, 1], [0.92, 1])})`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 20,
              padding: "24px 30px",
              borderRadius: 34,
              border: `1px solid ${BRAND.border}`,
              background: "rgba(255,255,255,0.06)",
              boxShadow: "0 34px 90px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={SHOTS.logo}
              style={{width: 76, height: 76, objectFit: "contain"}}
            />
            <div>
              <div
                style={{
                  fontSize: 50,
                  fontWeight: 800,
                  letterSpacing: "-0.05em",
                  color: BRAND.text,
                }}
              >
                WhatsQuery
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  color: BRAND.indigoSoft,
                  fontWeight: 800,
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                }}
              >
                Your Business. Automated by AI.
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 24,
            color: BRAND.textMuted,
            fontWeight: 600,
          }}
        >
          whatsquery.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WhatsQueryDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <Audio
        src={AUDIO.music}
        volume={(frame) => interpolate(frame, [0, 30, 1740, 1800], [0, 0.12, 0.12, 0])}
      />
      <Audio
        src={AUDIO.voiceover}
        volume={(frame) => interpolate(frame, [0, 12, 1710, 1755], [0, 1, 1, 0])}
      />
      <Cue from={52} duration={18} src={AUDIO.whoosh} volume={0.34} />
      <Cue from={112} duration={22} src={AUDIO.whoosh} volume={0.42} />
      <Cue from={178} duration={18} src={AUDIO.pulse} volume={0.28} />
      <Cue from={208} duration={10} src={AUDIO.click} volume={0.3} />
      <Cue from={226} duration={10} src={AUDIO.click} volume={0.26} />
      <Cue from={242} duration={10} src={AUDIO.click} volume={0.22} />
      <Cue from={300} duration={16} src={AUDIO.whoosh} volume={0.28} />
      <Cue from={370} duration={10} src={AUDIO.click} volume={0.24} />
      <Cue from={388} duration={10} src={AUDIO.click} volume={0.22} />
      <Cue from={406} duration={10} src={AUDIO.click} volume={0.2} />
      <Cue from={492} duration={12} src={AUDIO.click} volume={0.22} />
      <Cue from={560} duration={20} src={AUDIO.chime} volume={0.24} />
      <Cue from={612} duration={20} src={AUDIO.pulse} volume={0.25} />
      <Cue from={686} duration={16} src={AUDIO.sync} volume={0.28} />
      <Cue from={764} duration={10} src={AUDIO.click} volume={0.2} />
      <Cue from={782} duration={10} src={AUDIO.click} volume={0.22} />
      <Cue from={838} duration={22} src={AUDIO.chime} volume={0.26} />
      <Cue from={934} duration={20} src={AUDIO.chime} volume={0.22} />
      <Cue from={1024} duration={24} src={AUDIO.pulse} volume={0.24} />
      <Cue from={1110} duration={26} src={AUDIO.sync} volume={0.24} />
      <Cue from={1190} duration={22} src={AUDIO.chime} volume={0.24} />
      <Cue from={1262} duration={18} src={AUDIO.click} volume={0.18} />
      <Cue from={1318} duration={22} src={AUDIO.pulse} volume={0.22} />
      <Cue from={1388} duration={22} src={AUDIO.ringtone} volume={0.2} />
      <Cue from={1445} duration={16} src={AUDIO.click} volume={0.2} />
      <Cue from={1452} duration={26} src={AUDIO.pulse} volume={0.18} />
      <Cue from={1516} duration={20} src={AUDIO.chime} volume={0.22} />
      <Cue from={1570} duration={26} src={AUDIO.sync} volume={0.24} />
      <Cue from={1630} duration={20} src={AUDIO.chime} volume={0.22} />
      <Cue from={1690} duration={24} src={AUDIO.whoosh} volume={0.28} />
      <Cue from={1760} duration={40} src={AUDIO.logoSting} volume={0.25} />
      <Sequence durationInFrames={60}>
        <Shot1Intro />
      </Sequence>
      <Sequence from={60} durationInFrames={60}>
        <Shot2Chaos />
      </Sequence>
      <Sequence from={120} durationInFrames={60}>
        <Shot3Organize />
      </Sequence>
      <Sequence from={180} durationInFrames={60}>
        <Shot4DashboardReveal />
      </Sequence>
      <Sequence from={240} durationInFrames={60}>
        <Shot5DashboardFull />
      </Sequence>
      <Sequence from={300} durationInFrames={60}>
        <Shot6CommandCenter />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <Shot7Modules />
      </Sequence>
      <Sequence from={450} durationInFrames={90}>
        <Shot8Customers />
      </Sequence>
      <Sequence from={540} durationInFrames={60}>
        <Shot9CustomerDetails />
      </Sequence>
      <Sequence from={600} durationInFrames={90}>
        <Shot10Products />
      </Sequence>
      <Sequence from={690} durationInFrames={60}>
        <Shot11InventoryUpdate />
      </Sequence>
      <Sequence from={750} durationInFrames={90}>
        <Shot12SalesWorkflow />
      </Sequence>
      <Sequence from={840} durationInFrames={90}>
        <Shot13InvoiceGenerated />
      </Sequence>
      <Sequence from={930} durationInFrames={90}>
        <Shot14PaymentTracking />
      </Sequence>
      <Sequence from={1020} durationInFrames={60}>
        <Shot15FinanceSummary />
      </Sequence>
      <Sequence from={1080} durationInFrames={90}>
        <Shot16Reports />
      </Sequence>
      <Sequence from={1170} durationInFrames={60}>
        <Shot17Insight />
      </Sequence>
      <Sequence from={1230} durationInFrames={90}>
        <Shot18Assistant />
      </Sequence>
      <Sequence from={1320} durationInFrames={60}>
        <Shot19AssistantAction />
      </Sequence>
      <Sequence from={1380} durationInFrames={60}>
        <Shot20VoiceIntro />
      </Sequence>
      <Sequence from={1440} durationInFrames={60}>
        <Shot21CallAnswered />
      </Sequence>
      <Sequence from={1500} durationInFrames={60}>
        <Shot22Booking />
      </Sequence>
      <Sequence from={1560} durationInFrames={60}>
        <Shot23OrderSynced />
      </Sequence>
      <Sequence from={1620} durationInFrames={60}>
        <Shot24CustomerSaved />
      </Sequence>
      <Sequence from={1680} durationInFrames={60}>
        <Shot25Unified />
      </Sequence>
      <Sequence from={1740} durationInFrames={60}>
        <Shot26Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
