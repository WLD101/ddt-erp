import React from "react";
import {
  AbsoluteFill,
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

const makeSpring = (frame: number, delay = 0, duration = 28) =>
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

const starSeed = Array.from({length: 42}, (_, index) => ({
  left: ((index * 83) % 1000) / 10,
  top: ((index * 137) % 620) / 6.2,
  size: 2 + (index % 3),
  opacity: 0.25 + (index % 5) * 0.12,
}));

const PageBackground: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 22% 18%, rgba(98,95,255,0.18), transparent 24%), radial-gradient(circle at 80% 12%, rgba(172,75,255,0.14), transparent 22%), radial-gradient(circle at 60% 88%, rgba(6,182,212,0.12), transparent 24%), linear-gradient(180deg, #050b19 0%, #030817 54%, #020611 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9))",
          opacity: 0.5,
        }}
      />
      {starSeed.map((star, index) => {
        const pulse = interpolate(
          (frame + index * 3) % 90,
          [0, 45, 90],
          [0.3, 1, 0.35],
          {
            easing: Easing.inOut(Easing.sin),
          }
        );

        return (
          <div
            key={`${star.left}-${star.top}-${index}`}
            style={{
              position: "absolute",
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              borderRadius: 999,
              background: "#dbe7ff",
              opacity: star.opacity * pulse,
              boxShadow: "0 0 14px rgba(219,231,255,0.6)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const BrandLockup: React.FC = () => (
  <div style={{display: "flex", alignItems: "center", gap: 18}}>
    <div
      style={{
        width: 62,
        height: 62,
        borderRadius: 18,
        background: "rgba(255,255,255,0.08)",
        border: `1px solid ${BRAND.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
      }}
    >
      <Img
        src={SHOTS.logo}
        style={{width: 42, height: 42, objectFit: "contain"}}
      />
    </div>
    <div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.04em",
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
      fontSize: 16,
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
        boxShadow: `0 0 20px ${accent}`,
      }}
    />
    {label}
  </div>
);

const TextBlock: React.FC<{
  title: string;
  subtitle: string;
  align?: "left" | "center";
  maxWidth?: number;
}> = ({title, subtitle, align = "left", maxWidth = 720}) => (
  <div
    style={{
      maxWidth,
      textAlign: align,
    }}
  >
    <div
      style={{
        marginTop: 22,
        fontSize: align === "center" ? 64 : 58,
        lineHeight: 1.04,
        fontWeight: 800,
        letterSpacing: "-0.055em",
        color: BRAND.text,
      }}
    >
      {title}
    </div>
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
  </div>
);

const GlassCard: React.FC<{
  title?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({title, style, children}) => (
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
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: "0.24em",
          color: BRAND.textSoft,
          fontWeight: 800,
          marginBottom: 16,
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
  scaleFrom?: number;
  xFrom?: number;
  yFrom?: number;
  rotation?: number;
  style?: React.CSSProperties;
}> = ({
  src,
  frame,
  delay = 0,
  scaleFrom = 0.94,
  xFrom = 0,
  yFrom = 24,
  rotation = 0,
  style,
}) => {
  const progress = makeSpring(frame, delay, 30);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [scaleFrom, 1]);
  const x = interpolate(progress, [0, 1], [xFrom, 0]);
  const y = interpolate(progress, [0, 1], [yFrom, 0]);

  return (
    <div
      style={{
        borderRadius: 30,
        border: `1px solid ${BRAND.border}`,
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 90px rgba(0,0,0,0.4)",
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

const FloatingBadge: React.FC<{
  title: string;
  value: string;
  tone?: "indigo" | "cyan" | "purple" | "green";
  frame: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({title, value, tone = "indigo", frame, delay = 0, style}) => {
  const colors = {
    indigo: BRAND.indigo,
    cyan: BRAND.cyan,
    purple: BRAND.purple,
    green: BRAND.green,
  } as const;
  const rise = interpolate(
    makeSpring(frame, delay),
    [0, 1],
    [20, 0]
  );

  return (
    <GlassCard
      style={{
        width: 240,
        opacity: makeSpring(frame, delay),
        transform: `translateY(${rise}px)`,
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
        {title}
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
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "70%",
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${colors[tone]}66, ${colors[tone]})`,
          }}
        />
      </div>
    </GlassCard>
  );
};

const VoiceActionCard: React.FC<{
  label: string;
  value: string;
  frame: number;
  delay: number;
}> = ({label, value, frame, delay}) => {
  const enter = makeSpring(frame, delay, 26);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [26, 0]);

  return (
    <div
      style={{
        borderRadius: 22,
        border: `1px solid ${BRAND.border}`,
        background: "rgba(255,255,255,0.06)",
        padding: "18px 20px",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          color: BRAND.textSoft,
          fontSize: 12,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 22,
          fontWeight: 800,
          color: BRAND.text,
        }}
      >
        {value}
      </div>
    </div>
  );
};

const TypewriterLine: React.FC<{text: string; frame: number; start: number}> = ({
  text,
  frame,
  start,
}) => {
  const count = Math.floor(
    interpolate(frame, [start, start + 44], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return <>{text.slice(0, count)}</>;
};

const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const hero = makeSpring(frame, 8, 30);
  const hubScale = interpolate(hero, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div style={{position: "absolute", left: 70, top: 48}}>
        <BrandLockup />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 660,
            height: 300,
            transform: `scale(${hubScale})`,
          }}
        >
          {[
            {label: "Missed Calls", x: 40, y: 70, color: BRAND.red},
            {label: "Invoices Due", x: 460, y: 44, color: BRAND.purple},
            {label: "Stock Sheet", x: 90, y: 204, color: BRAND.cyan},
            {label: "Order Slip", x: 432, y: 220, color: BRAND.green},
          ].map((item, index) => {
            const float = interpolate(
              (frame + index * 8) % 80,
              [0, 40, 80],
              [-8, 8, -8]
            );
            return (
              <div
                key={item.label}
                style={{
                  position: "absolute",
                  left: item.x,
                  top: item.y + float,
                  padding: "16px 18px",
                  borderRadius: 20,
                  border: `1px solid ${BRAND.border}`,
                  background: "rgba(255,255,255,0.06)",
                  boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
                  color: BRAND.text,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    marginRight: 10,
                    borderRadius: 999,
                    background: item.color,
                    boxShadow: `0 0 18px ${item.color}`,
                  }}
                />
                {item.label}
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 210,
              height: 210,
              borderRadius: 999,
              background:
                "radial-gradient(circle, rgba(98,95,255,0.38) 0%, rgba(172,75,255,0.2) 48%, rgba(6,182,212,0.08) 72%, transparent 100%)",
              border: `1px solid ${BRAND.border}`,
              boxShadow: "0 0 120px rgba(98,95,255,0.4)",
            }}
          />
        </div>

        <div style={{textAlign: "center"}}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: "-0.06em",
              color: BRAND.text,
            }}
          >
            Your Business.
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 72,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: "-0.06em",
              background:
                "linear-gradient(90deg, #ffffff, #c4cbff 38%, #8bbdff 74%, #8af3ff 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Automated by AI.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div style={{position: "absolute", left: 70, top: 48}}>
        <BrandLockup />
      </div>
      <div style={{position: "absolute", left: 70, top: 140}}>
        <Eyebrow label="Intelligent ERP Command Center" />
        <TextBlock
          title="One intelligent platform for business operations."
          subtitle="Sales, customers, products, finance, reports, and AI assistance in one clean daily workspace."
          maxWidth={700}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.dashboard}
        frame={frame}
        delay={14}
        xFrom={48}
        yFrom={30}
        style={{
          position: "absolute",
          right: 62,
          top: 170,
          width: 1120,
          height: 760,
        }}
      />
      <FloatingBadge
        title="Total revenue"
        value="PKR 839,999.9"
        tone="indigo"
        frame={frame}
        delay={34}
        style={{position: "absolute", left: 80, bottom: 166}}
      />
      <FloatingBadge
        title="Enterprise health"
        value="84 / 100"
        tone="green"
        frame={frame}
        delay={46}
        style={{position: "absolute", left: 350, bottom: 110}}
      />
    </AbsoluteFill>
  );
};

const ManagementScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div style={{position: "absolute", left: 70, top: 54}}>
        <BrandLockup />
      </div>
      <div style={{position: "absolute", left: 70, top: 150}}>
        <Eyebrow label="Customers + Products" accent={BRAND.cyan} />
        <TextBlock
          title="Organize customers, products, and inventory."
          subtitle="Built around the real WhatsQuery interface, with clean tables, direct actions, and room to scale."
          maxWidth={680}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.customers}
        frame={frame}
        delay={18}
        xFrom={-38}
        yFrom={28}
        rotation={-1.2}
        style={{
          position: "absolute",
          left: 70,
          bottom: 90,
          width: 900,
          height: 520,
        }}
      />
      <ScreenshotCard
        src={SHOTS.products}
        frame={frame}
        delay={32}
        xFrom={50}
        yFrom={28}
        rotation={1.1}
        style={{
          position: "absolute",
          right: 70,
          bottom: 126,
          width: 860,
          height: 500,
        }}
      />
      <FloatingBadge
        title="Customer export"
        value="Approval ready"
        tone="purple"
        frame={frame}
        delay={48}
        style={{position: "absolute", right: 190, top: 248}}
      />
    </AbsoluteFill>
  );
};

const SalesScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div style={{position: "absolute", left: 70, top: 54}}>
        <BrandLockup />
      </div>
      <div style={{position: "absolute", left: 70, top: 140}}>
        <Eyebrow label="Sales + Invoices" accent={BRAND.purple} />
        <TextBlock
          title="Create invoices. Track payments. Stay in control."
          subtitle="Quote to invoice, payment tracking, and export-ready documents from one consistent sales ledger."
          maxWidth={700}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.salesA}
        frame={frame}
        delay={12}
        xFrom={-24}
        yFrom={34}
        style={{
          position: "absolute",
          left: 70,
          bottom: 92,
          width: 850,
          height: 490,
        }}
      />
      <ScreenshotCard
        src={SHOTS.salesB}
        frame={frame}
        delay={24}
        xFrom={40}
        yFrom={20}
        style={{
          position: "absolute",
          right: 74,
          bottom: 122,
          width: 840,
          height: 460,
        }}
      />
      <GlassCard
        title="Invoice workflow"
        style={{
          position: "absolute",
          left: 960,
          top: 238,
          width: 340,
          opacity: makeSpring(frame, 40),
        }}
      >
        <div style={{display: "grid", gap: 12}}>
          {[
            "Customer selected",
            "Products added",
            "Invoice generated",
            "Payment status updated",
          ].map((step, index) => (
            <div
              key={step}
              style={{
                borderRadius: 18,
                border: `1px solid ${BRAND.border}`,
                background: "rgba(255,255,255,0.05)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background:
                    index < 3
                      ? "linear-gradient(135deg, rgba(172,75,255,0.95), rgba(98,95,255,0.85))"
                      : "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(6,182,212,0.75))",
                }}
              />
              <div style={{fontSize: 18, fontWeight: 700, color: BRAND.text}}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};

const ReportsScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div style={{position: "absolute", left: 70, top: 56}}>
        <BrandLockup />
      </div>
      <div style={{position: "absolute", left: 70, top: 150}}>
        <Eyebrow label="Reports + Analytics" accent={BRAND.green} />
        <TextBlock
          title="Turn operations into clear business insights."
          subtitle="Filter by cycle, review revenue, and surface decision-ready trends without leaving the ERP."
          maxWidth={700}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.reports}
        frame={frame}
        delay={18}
        xFrom={54}
        yFrom={32}
        style={{
          position: "absolute",
          right: 70,
          top: 220,
          width: 1140,
          height: 680,
        }}
      />
      <FloatingBadge
        title="Net profit"
        value="PKR 40,000"
        tone="green"
        frame={frame}
        delay={36}
        style={{position: "absolute", left: 86, bottom: 170}}
      />
      <FloatingBadge
        title="Total revenue"
        value="PKR 840,000"
        tone="indigo"
        frame={frame}
        delay={50}
        style={{position: "absolute", left: 356, bottom: 104}}
      />
    </AbsoluteFill>
  );
};

const AssistantScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div style={{position: "absolute", left: 70, top: 56}}>
        <BrandLockup />
      </div>
      <div style={{position: "absolute", left: 70, top: 148}}>
        <Eyebrow label="Built-in AI Assistant" accent={BRAND.indigo} />
        <TextBlock
          title="Built-in AI assistance for faster decisions."
          subtitle="Ask in plain language, review a safe action preview, and move from question to workflow in seconds."
          maxWidth={710}
        />
      </div>
      <ScreenshotCard
        src={SHOTS.assistant}
        frame={frame}
        delay={16}
        xFrom={36}
        yFrom={30}
        style={{
          position: "absolute",
          right: 70,
          top: 222,
          width: 1110,
          height: 650,
        }}
      />
      <GlassCard
        title="Live command"
        style={{
          position: "absolute",
          left: 84,
          bottom: 110,
          width: 540,
          opacity: makeSpring(frame, 40),
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
          <TypewriterLine
            text="Show today's sales and unpaid invoices for Ali Traders."
            frame={frame}
            start={44}
          />
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 16,
            color: BRAND.textMuted,
            lineHeight: 1.5,
          }}
        >
          Deterministic assistant. Preview-first. Role-safe execution.
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};

const VoiceScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <PageBackground />
      <div style={{position: "absolute", left: 70, top: 56}}>
        <BrandLockup />
      </div>
      <div style={{position: "absolute", left: 70, top: 146}}>
        <Eyebrow label="WhatsQuery Voice" accent={BRAND.cyan} />
        <TextBlock
          title="AI Receptionist for calls, bookings, and orders."
          subtitle="Voice-ready expansion for inbound business workflows, lead capture, and connected ERP updates."
          maxWidth={730}
        />
      </div>
      <GlassCard
        title="Voice-ready workflow"
        style={{
          position: "absolute",
          left: 70,
          bottom: 110,
          width: 720,
          height: 460,
        }}
      >
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
          <VoiceActionCard
            label="Incoming call"
            value="Ahmed Electronics"
            frame={frame}
            delay={18}
          />
          <VoiceActionCard
            label="AI call answered"
            value="Greeting delivered"
            frame={frame}
            delay={30}
          />
          <VoiceActionCard
            label="Order synced"
            value="2 items pushed"
            frame={frame}
            delay={42}
          />
          <VoiceActionCard
            label="Customer saved"
            value="Lead captured"
            frame={frame}
            delay={54}
          />
          <VoiceActionCard
            label="Table booked"
            value="Tomorrow · 7:30 PM"
            frame={frame}
            delay={66}
          />
          <VoiceActionCard
            label="Invoice generated"
            value="INV-4081 draft"
            frame={frame}
            delay={78}
          />
        </div>
      </GlassCard>
      <ScreenshotCard
        src={SHOTS.integrations}
        frame={frame}
        delay={26}
        xFrom={42}
        yFrom={28}
        style={{
          position: "absolute",
          right: 70,
          bottom: 96,
          width: 980,
          height: 560,
        }}
      />
    </AbsoluteFill>
  );
};

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = makeSpring(frame, 8, 28);
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
            transform: `scale(${interpolate(scale, [0, 1], [0.9, 1])})`,
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
              style={{
                width: 74,
                height: 74,
                objectFit: "contain",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 48,
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
                ERP + AI Receptionist
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 30,
            color: BRAND.text,
            fontWeight: 700,
          }}
        >
          Launch your AI-powered business system.
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 22,
            color: BRAND.textMuted,
            fontWeight: 500,
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
      <Sequence durationInFrames={90}>
        <OpeningScene />
      </Sequence>
      <Sequence from={90} durationInFrames={210}>
        <DashboardScene />
      </Sequence>
      <Sequence from={300} durationInFrames={210}>
        <ManagementScene />
      </Sequence>
      <Sequence from={510} durationInFrames={210}>
        <SalesScene />
      </Sequence>
      <Sequence from={720} durationInFrames={210}>
        <ReportsScene />
      </Sequence>
      <Sequence from={930} durationInFrames={210}>
        <AssistantScene />
      </Sequence>
      <Sequence from={1140} durationInFrames={270}>
        <VoiceScene />
      </Sequence>
      <Sequence from={1410} durationInFrames={390}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
