import React, {useMemo} from "react";
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

const BRAND = {
  bg: "#020617",
  panelBorder: "rgba(255,255,255,0.11)",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textSoft: "#62748e",
  indigo: "#625fff",
  indigoSoft: "#a4b3ff",
  purple: "#ac4bff",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#f43f5e",
};

const fps = 30;

type MetricCard = {
  label: string;
  value: string;
  tone?: "indigo" | "green" | "purple" | "cyan" | "amber";
};

type TableRow = {
  primary: string;
  secondary: string;
  third: string;
  tag?: string;
};

const glow = (color: string, opacity: number) => ({
  background: color,
  opacity,
  filter: "blur(120px)",
});

const makeSpring = (frame: number, duration = 24, delay = 0) =>
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

const SceneShell: React.FC<{
  accent: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({accent, eyebrow, title, subtitle, children}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 18], [0.985, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${scale})`,
        color: BRAND.text,
        fontFamily: plusJakartaFontFamily,
      }}
    >
      <AbsoluteFill style={{background: BRAND.bg}}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 15% 15%, rgba(98,95,255,0.18), transparent 28%), radial-gradient(circle at 85% 20%, rgba(172,75,255,0.14), transparent 26%), radial-gradient(circle at 50% 88%, rgba(6,182,212,0.1), transparent 24%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 70,
            width: 420,
            height: 420,
            borderRadius: "999px",
            ...glow(accent, 0.16),
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 90,
            bottom: 60,
            width: 380,
            height: 380,
            borderRadius: "999px",
            ...glow(BRAND.purple, 0.12),
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "100px 100px",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.42), rgba(0,0,0,0.85))",
          }}
        />
      </AbsoluteFill>
      <div
        style={{
          position: "relative",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 42,
          }}
        >
          <BrandLockup />
          <div style={{marginTop: 30}}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                borderRadius: 999,
                border: `1px solid ${accent}55`,
                background: `${accent}14`,
                padding: "10px 18px",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: BRAND.indigoSoft,
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
              {eyebrow}
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 54,
                lineHeight: 1.06,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                maxWidth: 760,
              }}
            >
              {title}
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 22,
                lineHeight: 1.45,
                color: BRAND.textMuted,
                maxWidth: 780,
                fontWeight: 500,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 258,
            bottom: 40,
            display: "flex",
            alignItems: "center",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const BrandLockup: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 18}}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)",
          }}
        >
          <Img
            src={staticFile("logo-emblem.png")}
            style={{
              width: 42,
              height: 42,
              objectFit: "contain",
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 30,
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
              fontWeight: 700,
              letterSpacing: "0.36em",
              fontSize: 13,
              textTransform: "uppercase",
            }}
          >
            ERP Platform
          </div>
        </div>
      </div>
      <div
        style={{
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          padding: "10px 16px",
          fontSize: 15,
          fontWeight: 700,
          color: BRAND.textMuted,
        }}
      >
        Intelligent Business Operations
      </div>
    </div>
  );
};

const BrowserFrame: React.FC<{
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}> = ({children, rightPanel}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: rightPanel ? "1fr 340px" : "1fr",
        gap: 22,
        width: "100%",
      }}
    >
      <div
        style={{
          borderRadius: 34,
          padding: 22,
          border: `1px solid ${BRAND.panelBorder}`,
          background: "rgba(8, 12, 28, 0.92)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingBottom: 16,
          }}
        >
          {["#f87171", "#fbbf24", "#4ade80"].map((c) => (
            <div
              key={c}
              style={{
                width: 14,
                height: 14,
                borderRadius: 99,
                background: c,
                opacity: 0.9,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 12,
              flex: 1,
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${BRAND.panelBorder}`,
              color: BRAND.textMuted,
              fontSize: 18,
              padding: "12px 18px",
            }}
          >
            app.whatsquery.com/dashboard
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 18,
          }}
        >
          <div
            style={{
              borderRadius: 26,
              border: `1px solid ${BRAND.panelBorder}`,
              background: "rgba(255,255,255,0.035)",
              padding: 20,
              minHeight: 440,
            }}
          >
            <div
              style={{
                fontSize: 17,
                textTransform: "uppercase",
                letterSpacing: "0.28em",
                color: BRAND.textSoft,
                marginBottom: 18,
                fontWeight: 800,
              }}
            >
              Workspace
            </div>
            {[
              "Dashboard",
              "Customers",
              "Products",
              "Sales",
              "Finance",
              "Reports",
              "Smart Assistant",
            ].map((item, index) => (
              <div
                key={item}
                style={{
                  borderRadius: 18,
                  padding: "16px 18px",
                  marginBottom: 10,
                  background:
                    index === 0
                      ? "linear-gradient(135deg, rgba(98,95,255,0.9), rgba(172,75,255,0.72))"
                      : "transparent",
                  border:
                    index === 0
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid transparent",
                  color: index === 0 ? "#fff" : BRAND.textMuted,
                  fontWeight: index === 0 ? 800 : 600,
                  fontSize: 18,
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div>{children}</div>
        </div>
      </div>
      {rightPanel ? rightPanel : null}
    </div>
  );
};

const AnalyticsLine: React.FC<{tone?: string; points: number[]}> = ({
  tone = BRAND.indigoSoft,
  points,
}) => {
  const width = 360;
  const height = 100;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / Math.max(1, max - min)) * (height - 14) - 7;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`line-${tone}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={tone} stopOpacity={0.25} />
          <stop offset="100%" stopColor={tone} stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={`url(#line-${tone})`}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
};

const MetricGrid: React.FC<{cards: MetricCard[]}> = ({cards}) => {
  const toneMap = {
    indigo: BRAND.indigoSoft,
    green: BRAND.green,
    purple: BRAND.purple,
    cyan: BRAND.cyan,
    amber: BRAND.amber,
  } as const;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 16,
      }}
    >
      {cards.map((card) => {
        const tone = toneMap[card.tone ?? "indigo"];
        return (
          <div
            key={card.label}
            style={{
              borderRadius: 22,
              border: `1px solid ${BRAND.panelBorder}`,
              background: "rgba(255,255,255,0.05)",
              padding: 18,
            }}
          >
            <div
              style={{
                color: BRAND.textSoft,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                fontWeight: 800,
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 33,
                fontWeight: 800,
                color: BRAND.text,
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                marginTop: 14,
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${card.value.includes("%") ? 70 : 60}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${tone}66, ${tone})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TableCard: React.FC<{
  title: string;
  rows: TableRow[];
  columns: [string, string, string];
}> = ({title, rows, columns}) => {
  return (
    <div
      style={{
        borderRadius: 26,
        border: `1px solid ${BRAND.panelBorder}`,
        background: "rgba(255,255,255,0.04)",
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 18,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr",
          color: BRAND.textSoft,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          fontWeight: 800,
          padding: "0 10px 10px 10px",
        }}
      >
        <div>{columns[0]}</div>
        <div>{columns[1]}</div>
        <div>{columns[2]}</div>
      </div>
      {rows.map((row) => (
        <div
          key={`${row.primary}-${row.secondary}`}
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr",
            borderRadius: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "14px 12px",
            marginBottom: 10,
            alignItems: "center",
            fontSize: 17,
          }}
        >
          <div>
            <div style={{fontWeight: 700}}>{row.primary}</div>
            {row.tag ? (
              <div
                style={{
                  marginTop: 5,
                  color: BRAND.indigoSoft,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {row.tag}
              </div>
            ) : null}
          </div>
          <div style={{color: BRAND.textMuted, fontWeight: 600}}>{row.secondary}</div>
          <div style={{fontWeight: 700}}>{row.third}</div>
        </div>
      ))}
    </div>
  );
};

const RightRail: React.FC<{title: string; items: {label: string; value: string}[]}> = ({
  title,
  items,
}) => {
  return (
    <div
      style={{
        borderRadius: 30,
        padding: 24,
        border: `1px solid ${BRAND.panelBorder}`,
        background: "rgba(255,255,255,0.05)",
        boxShadow: "0 24px 50px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          fontSize: 16,
          color: BRAND.textSoft,
          textTransform: "uppercase",
          letterSpacing: "0.24em",
          fontWeight: 800,
        }}
      >
        {title}
      </div>
      <div style={{marginTop: 16}}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${BRAND.panelBorder}`,
              padding: "16px 18px",
              marginBottom: 12,
            }}
          >
            <div style={{fontSize: 14, color: BRAND.textSoft, fontWeight: 700}}>
                {item.label}
              </div>
            <div style={{fontSize: 22, fontWeight: 800, marginTop: 8}}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const messyOpacity = interpolate(frame, [0, 30, 75], [1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const dashboardX = interpolate(frame, [40, 95], [180, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });
  const badgeScale = makeSpring(frame, 28, 18);

  return (
    <SceneShell
      accent={BRAND.indigo}
      eyebrow="Opening Hook"
      title="Run your business from one intelligent ERP."
      subtitle="From scattered spreadsheets, calls, products, and payments into one clean operational system."
    >
      <AbsoluteFill style={{justifyContent: "center"}}>
        <div style={{display: "grid", gridTemplateColumns: "0.72fr 1.28fr", gap: 22}}>
          <div
            style={{
              opacity: messyOpacity,
              transform: `translateY(${interpolate(frame, [0, 80], [0, -10])}px) rotate(-2deg)`,
            }}
          >
            <MessyWorkflow />
          </div>
          <div
            style={{
              transform: `translateX(${dashboardX}px)`,
            }}
          >
            <BrowserFrame
              rightPanel={
                <RightRail
                  title="Transformation"
                  items={[
                    {label: "Calls answered", value: "24/7 AI"},
                    {label: "Invoices synced", value: "Realtime"},
                    {label: "Operations", value: "Unified"},
                  ]}
                />
              }
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: "auto auto 1fr",
                  gap: 18,
                }}
              >
                <MetricGrid
                  cards={[
                    {label: "Revenue", value: "PKR 2.8M", tone: "indigo"},
                    {label: "Customers", value: "1,248", tone: "cyan"},
                    {label: "Invoices", value: "302", tone: "purple"},
                    {label: "Fulfillment", value: "98.4%", tone: "green"},
                  ]}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1fr",
                    gap: 16,
                  }}
                >
                  <Panel title="Weekly sales performance">
                    <AnalyticsLine points={[14, 18, 22, 21, 28, 36, 44]} />
                  </Panel>
                  <Panel title="Automation status">
                    <StackedStatus
                      items={[
                        {label: "Calls", value: "AI active"},
                        {label: "Billing", value: "Synced"},
                        {label: "Inventory", value: "Stable"},
                      ]}
                    />
                  </Panel>
                </div>
                <TableCard
                  title="Recent activity"
                  columns={["Module", "Status", "Impact"]}
                  rows={[
                    {
                      primary: "Invoice INV-2048",
                      secondary: "Sent",
                      third: "PKR 145,000",
                      tag: "Sales",
                    },
                    {
                      primary: "Customer Follow-up",
                      secondary: "Automated",
                      third: "Lead captured",
                      tag: "AI",
                    },
                    {
                      primary: "Stock Reorder",
                      secondary: "Triggered",
                      third: "2 warehouses",
                      tag: "Inventory",
                    },
                  ]}
                />
              </div>
            </BrowserFrame>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 38,
            top: 38,
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(98,95,255,0.95), rgba(172,75,255,0.85))",
              padding: "12px 18px",
              fontSize: 17,
            fontWeight: 800,
            transform: `scale(${badgeScale})`,
            boxShadow: "0 20px 40px rgba(98,95,255,0.3)",
          }}
        >
          One dashboard. Full control.
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = makeSpring(frame, 26, 6);
  return (
    <SceneShell
      accent={BRAND.indigoSoft}
      eyebrow="Unified Dashboard"
      title="Everything your business needs. In one place."
      subtitle="Sales, customers, products, invoices, reports, and finance all move through one clean control layer."
    >
      <div
        style={{
          width: "100%",
          transform: `translateY(${interpolate(reveal, [0, 1], [26, 0])}px)`,
          opacity: reveal,
        }}
      >
        <BrowserFrame
          rightPanel={
            <RightRail
              title="Decision cards"
              items={[
                {label: "Cash collected", value: "PKR 1.2M"},
                {label: "Orders pending", value: "14"},
                {label: "Assistant actions", value: "84"},
              ]}
            />
          }
        >
          <div style={{display: "grid", gap: 18}}>
            <MetricGrid
              cards={[
                {label: "Gross Sales", value: "PKR 3.9M", tone: "indigo"},
                {label: "Net Profit", value: "PKR 780K", tone: "green"},
                {label: "Inventory", value: "1,284 SKUs", tone: "purple"},
                {label: "Collections", value: "91%", tone: "cyan"},
              ]}
            />
            <div style={{display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16}}>
              <Panel title="Revenue trends">
                <AnalyticsLine points={[10, 12, 18, 26, 22, 32, 38, 44]} tone={BRAND.indigo} />
              </Panel>
              <Panel title="Smart alerts">
                <StackedStatus
                  items={[
                    {label: "Low stock", value: "8 items"},
                    {label: "Overdue invoices", value: "11"},
                    {label: "Supplier payouts", value: "Due Friday"},
                  ]}
                />
              </Panel>
            </div>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
              <TableCard
                title="Top customers"
                columns={["Customer", "Orders", "Value"]}
                rows={[
                  {primary: "Ali Traders", secondary: "18", third: "PKR 420K"},
                  {primary: "North Mart", secondary: "11", third: "PKR 310K"},
                  {primary: "Prime Retail", secondary: "9", third: "PKR 208K"},
                ]}
              />
              <TableCard
                title="Operational queues"
                columns={["Queue", "Count", "State"]}
                rows={[
                  {primary: "Invoices", secondary: "24", third: "On track"},
                  {primary: "Purchase orders", secondary: "7", third: "Review"},
                  {primary: "Reports", secondary: "3", third: "Ready"},
                ]}
              />
            </div>
          </div>
        </BrowserFrame>
      </div>
    </SceneShell>
  );
};

const ManagementScene: React.FC = () => {
  return (
    <SceneShell
      accent={BRAND.cyan}
      eyebrow="Operations Management"
      title="Manage customers, suppliers, products, and inventory."
      subtitle="Organize relationships, stock, pricing, and supply flow with fast, readable business screens."
    >
      <BrowserFrame
        rightPanel={
          <RightRail
            title="Live overview"
            items={[
              {label: "Customers", value: "3,128"},
              {label: "Suppliers", value: "214"},
              {label: "Products", value: "2,546"},
              {label: "Stock alerts", value: "12"},
            ]}
          />
        }
      >
        <div style={{display: "grid", gridTemplateRows: "1fr 1fr", gap: 16}}>
          <div style={{display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 16}}>
            <TableCard
              title="Customer directory"
              columns={["Customer", "Status", "Credit"]}
              rows={[
                {primary: "Ashraf Cloth House", secondary: "Active", third: "PKR 85K"},
                {primary: "City Mart", secondary: "Priority", third: "PKR 120K"},
                {primary: "Nova Retail", secondary: "Active", third: "PKR 54K"},
              ]}
            />
            <TableCard
              title="Supplier network"
              columns={["Supplier", "Terms", "Payable"]}
              rows={[
                {primary: "Prime Fabrics", secondary: "30 days", third: "PKR 220K"},
                {primary: "East Packaging", secondary: "14 days", third: "PKR 64K"},
                {primary: "Metro Imports", secondary: "Advance", third: "PKR 118K"},
              ]}
            />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16}}>
            <TableCard
              title="Inventory board"
              columns={["Product", "Stock", "Warehouse"]}
              rows={[
                {primary: "Premium Cotton Roll", secondary: "148", third: "Karachi Hub"},
                {primary: "Retail Box Set", secondary: "42", third: "Lahore DC"},
                {primary: "Invoice Printer", secondary: "11", third: "Main Branch"},
              ]}
            />
            <Panel title="Restock suggestions">
              <StackedStatus
                items={[
                  {label: "Cotton roll", value: "Reorder 80 units"},
                  {label: "Barcode labels", value: "Reorder 250"},
                  {label: "Blue cartons", value: "Healthy"},
                ]}
              />
            </Panel>
          </div>
        </div>
      </BrowserFrame>
    </SceneShell>
  );
};

const FinanceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const invoiceReveal = makeSpring(frame, 28, 12);
  return (
    <SceneShell
      accent={BRAND.green}
      eyebrow="Sales + Finance"
      title="Create invoices. Track payments. Stay in control."
      subtitle="Move from sales entry to invoice issue to payment tracking with a finance layer built for operational clarity."
    >
      <div style={{width: "100%"}}>
        <BrowserFrame
          rightPanel={
            <RightRail
              title="Finance status"
              items={[
                {label: "Received today", value: "PKR 248K"},
                {label: "Outstanding", value: "PKR 612K"},
                {label: "Expenses", value: "PKR 94K"},
              ]}
            />
          }
        >
          <div style={{display: "grid", gap: 16}}>
            <div style={{display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16}}>
              <InvoiceComposer progress={invoiceReveal} />
              <Panel title="Payment tracking">
                <StackedStatus
                  items={[
                    {label: "INV-2048", value: "Paid"},
                    {label: "INV-2051", value: "Partial"},
                    {label: "INV-2057", value: "Overdue"},
                    {label: "Refunds", value: "0 pending"},
                  ]}
                />
              </Panel>
            </div>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
              <TableCard
                title="Receivables"
                columns={["Customer", "Due", "Amount"]}
                rows={[
                  {primary: "Ali Traders", secondary: "Today", third: "PKR 145K"},
                  {primary: "Nova Retail", secondary: "2 days", third: "PKR 82K"},
                  {primary: "Metro Outlet", secondary: "7 days", third: "PKR 56K"},
                ]}
              />
              <TableCard
                title="Expense summary"
                columns={["Account", "State", "Amount"]}
                rows={[
                  {primary: "Operations", secondary: "Approved", third: "PKR 48K"},
                  {primary: "Transport", secondary: "Posted", third: "PKR 22K"},
                  {primary: "Utilities", secondary: "Planned", third: "PKR 14K"},
                ]}
              />
            </div>
          </div>
        </BrowserFrame>
      </div>
    </SceneShell>
  );
};

const ReportsScene: React.FC = () => {
  return (
    <SceneShell
      accent={BRAND.purple}
      eyebrow="Reports + Analytics"
      title="Turn daily operations into clear insights."
      subtitle="Revenue trends, stock movement, collections, and performance metrics become readable decisions instead of disconnected reports."
    >
      <div style={{width: "100%"}}>
        <BrowserFrame
          rightPanel={
            <RightRail
              title="Business pulse"
              items={[
                {label: "Growth", value: "+18.4%"},
                {label: "Avg. order", value: "PKR 24K"},
                {label: "Conversion", value: "31%"},
              ]}
            />
          }
        >
          <div style={{display: "grid", gap: 16}}>
            <MetricGrid
              cards={[
                {label: "Monthly Sales", value: "PKR 9.4M", tone: "purple"},
                {label: "Gross Margin", value: "26.8%", tone: "green"},
                {label: "Returns", value: "1.4%", tone: "amber"},
                {label: "Orders", value: "384", tone: "indigo"},
              ]}
            />
            <div style={{display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16}}>
              <Panel title="Revenue trend by week">
                <AnalyticsLine points={[12, 18, 24, 22, 29, 38, 44, 52]} tone={BRAND.purple} />
              </Panel>
              <Panel title="Department mix">
                <MixChart />
              </Panel>
            </div>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
              <TableCard
                title="Best-selling categories"
                columns={["Category", "Units", "Revenue"]}
                rows={[
                  {primary: "Apparel", secondary: "1,204", third: "PKR 3.2M"},
                  {primary: "Packaging", secondary: "648", third: "PKR 1.1M"},
                  {primary: "Accessories", secondary: "372", third: "PKR 840K"},
                ]}
              />
              <TableCard
                title="Performance notes"
                columns={["Signal", "State", "Action"]}
                rows={[
                  {primary: "Collections", secondary: "Strong", third: "Maintain"},
                  {primary: "Stock turnover", secondary: "Stable", third: "Monitor"},
                  {primary: "Supplier costs", secondary: "Rising", third: "Review"},
                ]}
              />
            </div>
          </div>
        </BrowserFrame>
      </div>
    </SceneShell>
  );
};

const AssistantScene: React.FC = () => {
  const frame = useCurrentFrame();
  const typing = interpolate(frame, [30, 90, 120, 180], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <SceneShell
      accent={BRAND.indigo}
      eyebrow="Built-in AI"
      title="Built-in AI assistance for faster decisions."
      subtitle="Ask business questions, create records, and move faster with guided AI built into the operations layer."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.8fr 1.2fr",
          gap: 24,
          width: "100%",
        }}
      >
        <Panel title="Smart Assistant">
          <div
            style={{
              borderRadius: 24,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${BRAND.panelBorder}`,
              padding: 22,
            }}
          >
            <ChatBubble
              role="user"
              text="Show unpaid invoices and the top customer balance this week."
            />
            <ChatBubble
              role="assistant"
              text="I found 11 unpaid invoices worth PKR 612,000. Top outstanding customer: Ali Traders with PKR 145,000 due. Would you like the invoice list exported for review?"
              typing={typing > 0.2 && typing < 0.95}
            />
          </div>
          <div style={{display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap"}}>
            {[
              "Create invoice",
              "Check inventory",
              "Find customer balance",
              "Show sales report",
            ].map((pill) => (
              <div
                key={pill}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${BRAND.panelBorder}`,
                  background: "rgba(255,255,255,0.05)",
                  padding: "12px 16px",
                  fontSize: 16,
                  fontWeight: 700,
                  color: BRAND.textMuted,
                }}
              >
                {pill}
              </div>
            ))}
          </div>
        </Panel>
        <BrowserFrame
          rightPanel={
            <RightRail
              title="AI value"
              items={[
                {label: "Response speed", value: "< 2 sec"},
                {label: "Suggested actions", value: "Context-aware"},
                {label: "Approvals", value: "Role-safe"},
              ]}
            />
          }
        >
          <div style={{display: "grid", gap: 16}}>
            <MetricGrid
              cards={[
                {label: "Assistant actions", value: "1,284", tone: "indigo"},
                {label: "Saved hours", value: "142", tone: "green"},
                {label: "Auto drafts", value: "96", tone: "purple"},
                {label: "Follow-ups", value: "84", tone: "cyan"},
              ]}
            />
            <TableCard
              title="Suggested next steps"
              columns={["Workflow", "Mode", "Outcome"]}
              rows={[
                {primary: "Unpaid invoice follow-up", secondary: "Recommended", third: "Recover faster"},
                {primary: "Low stock reorder", secondary: "Queued", third: "Avoid stockouts"},
                {primary: "Customer summary export", secondary: "Awaiting approval", third: "Secure"},
              ]}
            />
          </div>
        </BrowserFrame>
      </div>
    </SceneShell>
  );
};

const SecurityScene: React.FC = () => {
  return (
    <SceneShell
      accent={BRAND.cyan}
      eyebrow="Secure Multi-tenant Platform"
      title="Secure, scalable, and built for growing businesses."
      subtitle="Role-based access, separate business workspaces, approval flows, and future-ready expansion for AI Receptionist."
    >
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, width: "100%"}}>
        <Panel title="Multi-business control">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
              marginTop: 10,
            }}
          >
            {[
              {name: "Ali Traders", state: "Isolated workspace"},
              {name: "Prime Retail", state: "Role protected"},
              {name: "North Mart", state: "Audit ready"},
            ].map((item, index) => (
              <div
                key={item.name}
                style={{
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${BRAND.panelBorder}`,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background:
                      index === 0
                        ? "rgba(98,95,255,0.18)"
                        : index === 1
                          ? "rgba(6,182,212,0.16)"
                          : "rgba(34,197,94,0.16)",
                    marginBottom: 16,
                  }}
                />
                <div style={{fontSize: 22, fontWeight: 800}}>{item.name}</div>
                <div style={{fontSize: 14, color: BRAND.textMuted, marginTop: 8}}>{item.state}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Growth-ready ecosystem">
          <div style={{display: "grid", gap: 14}}>
            {[
              {label: "ERP dashboard", value: "Live"},
              {label: "Finance + reporting", value: "Live"},
              {label: "Smart Assistant", value: "Live"},
              {label: "WhatsQuery Voice", value: "Coming soon"},
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  borderRadius: 20,
                  border: `1px solid ${BRAND.panelBorder}`,
                  background: "rgba(255,255,255,0.04)",
                  padding: "18px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                    fontSize: 18,
                }}
              >
                <span style={{fontWeight: 700}}>{item.label}</span>
                <span
                  style={{
                    borderRadius: 999,
                    padding: "9px 14px",
                    background:
                      item.value === "Coming soon"
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(34,197,94,0.15)",
                    color: item.value === "Coming soon" ? BRAND.amber : BRAND.green,
                    fontWeight: 800,
                      fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </SceneShell>
  );
};

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = makeSpring(frame, 26, 8);
  return (
    <AbsoluteFill
      style={{
        background: BRAND.bg,
        color: BRAND.text,
        fontFamily: plusJakartaFontFamily,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(98,95,255,0.22), transparent 26%), radial-gradient(circle at 50% 78%, rgba(172,75,255,0.18), transparent 24%)",
        }}
      />
      <div
        style={{
          margin: "auto",
          textAlign: "center",
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            padding: "18px 26px",
            borderRadius: 30,
            border: `1px solid ${BRAND.panelBorder}`,
            background: "rgba(255,255,255,0.05)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.32)",
          }}
        >
          <Img
            src={staticFile("logo-emblem.png")}
            style={{width: 68, height: 68, objectFit: "contain"}}
          />
          <div style={{textAlign: "left"}}>
            <div style={{fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em"}}>
              WhatsQuery ERP
            </div>
            <div
              style={{
                color: BRAND.indigoSoft,
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Smart business management starts here.
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 26,
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

const MessyWorkflow: React.FC = () => {
  const papers = useMemo(
    () => [
      {top: 40, left: 40, rotate: -10, label: "Missed calls", color: BRAND.red},
      {top: 170, left: 120, rotate: 8, label: "Inventory sheet", color: BRAND.amber},
      {top: 280, left: 50, rotate: -4, label: "Invoices due", color: BRAND.cyan},
      {top: 410, left: 150, rotate: 12, label: "Customer notes", color: BRAND.purple},
    ],
    []
  );

  return (
    <div
      style={{
        position: "relative",
        height: 440,
        borderRadius: 34,
        border: `1px solid ${BRAND.panelBorder}`,
        background: "rgba(255,255,255,0.035)",
        overflow: "hidden",
      }}
    >
      {papers.map((paper) => (
        <div
          key={paper.label}
          style={{
            position: "absolute",
            top: paper.top,
            left: paper.left,
            width: 260,
            padding: 20,
            borderRadius: 24,
            background: "rgba(255,255,255,0.08)",
            border: `1px solid ${BRAND.panelBorder}`,
            boxShadow: "0 24px 50px rgba(0,0,0,0.28)",
            transform: `rotate(${paper.rotate}deg)`,
          }}
        >
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: paper.color,
              }}
            />
            <div style={{fontSize: 24, fontWeight: 800}}>{paper.label}</div>
          </div>
          <div style={{marginTop: 14}}>
            {[0.86, 0.66, 0.74].map((w, index) => (
              <div
                key={`${paper.label}-${index}`}
                style={{
                  width: `${w * 100}%`,
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)",
                  marginBottom: 10,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Panel: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => {
  return (
    <div
      style={{
        borderRadius: 26,
        border: `1px solid ${BRAND.panelBorder}`,
        background: "rgba(255,255,255,0.05)",
        padding: 20,
      }}
    >
      <div
        style={{
          color: BRAND.textSoft,
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          fontWeight: 800,
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
};

const StackedStatus: React.FC<{items: {label: string; value: string}[]}> = ({items}) => {
  return (
    <div>
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderRadius: 18,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${BRAND.panelBorder}`,
            padding: "16px 18px",
            marginBottom: 12,
          }}
        >
          <div style={{fontSize: 18, fontWeight: 700}}>{item.label}</div>
          <div style={{fontSize: 18, fontWeight: 800, color: BRAND.indigoSoft}}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

const InvoiceComposer: React.FC<{progress: number}> = ({progress}) => {
  return (
    <Panel title="Invoice workflow">
      <div
        style={{
          borderRadius: 24,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${BRAND.panelBorder}`,
          padding: 20,
        }}
      >
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
          {[
            "Customer: Ali Traders",
            "Date: 01 Jun 2026",
            "Invoice: INV-2048",
            "Terms: 14 days",
          ].map((field) => (
            <div
              key={field}
              style={{
                borderRadius: 16,
                padding: "14px 16px",
                border: `1px solid ${BRAND.panelBorder}`,
                background: "rgba(255,255,255,0.04)",
                fontSize: 18,
                color: BRAND.textMuted,
                fontWeight: 600,
              }}
            >
              {field}
            </div>
          ))}
        </div>
        <div style={{marginTop: 14}}>
          <TableCard
            title="Items"
            columns={["Line item", "Qty", "Total"]}
            rows={[
              {primary: "Premium Cotton Roll", secondary: "12", third: "PKR 72K"},
              {primary: "Retail Packaging Set", secondary: "20", third: "PKR 48K"},
              {primary: "Delivery Handling", secondary: "1", third: "PKR 8K"},
            ]}
          />
        </div>
        <div
          style={{
            marginTop: 16,
            height: 12,
            borderRadius: 999,
            overflow: "hidden",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: `${interpolate(progress, [0, 1], [18, 100])}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${BRAND.green}88, ${BRAND.indigo})`,
            }}
          />
        </div>
      </div>
    </Panel>
  );
};

const MixChart: React.FC = () => {
  const bars = [
    {label: "Sales", value: 82, color: BRAND.indigo},
    {label: "Products", value: 58, color: BRAND.cyan},
    {label: "Customers", value: 71, color: BRAND.purple},
    {label: "Finance", value: 43, color: BRAND.green},
  ];
  return (
    <div style={{display: "grid", gap: 16}}>
      {bars.map((bar) => (
        <div key={bar.label}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            <span>{bar.label}</span>
            <span style={{color: BRAND.textMuted}}>{bar.value}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: 14,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: `${bar.value}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${bar.color}99, ${bar.color})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const ChatBubble: React.FC<{role: "user" | "assistant"; text: string; typing?: boolean}> = ({
  role,
  text,
  typing = false,
}) => {
  const align = role === "user" ? "flex-end" : "flex-start";
  const bg =
    role === "user"
      ? "linear-gradient(135deg, rgba(98,95,255,0.95), rgba(172,75,255,0.82))"
      : "rgba(255,255,255,0.06)";
  return (
    <div style={{display: "flex", justifyContent: align, marginBottom: 16}}>
      <div
        style={{
          maxWidth: "82%",
          borderRadius: 22,
          padding: "16px 18px",
          border: role === "assistant" ? `1px solid ${BRAND.panelBorder}` : "none",
          background: bg,
          color: "#fff",
          fontSize: 18,
          lineHeight: 1.5,
          fontWeight: 600,
        }}
      >
        {typing ? (
          <div style={{display: "flex", gap: 8, padding: "4px 0"}}>
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: BRAND.indigoSoft,
                  opacity: 0.9 - dot * 0.2,
                }}
              />
            ))}
          </div>
        ) : (
          text
        )}
      </div>
    </div>
  );
};

export const WhatsQueryDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: plusJakartaFontFamily}}>
      <Sequence durationInFrames={150}>
        <HookScene />
      </Sequence>
      <Sequence from={150} durationInFrames={210}>
        <DashboardScene />
      </Sequence>
      <Sequence from={360} durationInFrames={300}>
        <ManagementScene />
      </Sequence>
      <Sequence from={660} durationInFrames={300}>
        <FinanceScene />
      </Sequence>
      <Sequence from={960} durationInFrames={300}>
        <ReportsScene />
      </Sequence>
      <Sequence from={1260} durationInFrames={240}>
        <AssistantScene />
      </Sequence>
      <Sequence from={1500} durationInFrames={180}>
        <SecurityScene />
      </Sequence>
      <Sequence from={1680} durationInFrames={120}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
