"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type SourceId = "job-search" | "app-tracker" | "ats-checker" | "cold-mail";

interface Source {
  id: SourceId;
  label: string;
  stat: string;
  color: string;          // tailwind bg class
  colorHex: string;       // raw hex for SVG / glow
  icon: React.FC<{ size?: number }>;
}

interface FeedMessage {
  id: number;
  sourceId: SourceId;
  sender: string;
  text: string;
  needsAction?: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

function IconJobSearch({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
      {/* sparkle */}
      <line x1="8" y1="8" x2="8" y2="8.01" strokeWidth="2" />
      <line x1="10.5" y1="6.5" x2="10.5" y2="8" />
      <line x1="13" y1="8" x2="13" y2="8.01" strokeWidth="2" />
      <line x1="12.2" y1="10.5" x2="13.5" y2="10.5" />
    </svg>
  );
}

function IconAppTracker({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* kanban columns */}
      <rect x="2" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="10" rx="1.5" />
      <rect x="17" y="4" width="5" height="6" rx="1.5" />
      {/* cards on column 1 */}
      <line x1="3.5" y1="7" x2="5.5" y2="7" />
      <line x1="3.5" y1="9.5" x2="5.5" y2="9.5" />
      {/* card on column 2 */}
      <line x1="11" y1="7" x2="13" y2="7" />
    </svg>
  );
}

function IconAtsChecker({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* resume sheet */}
      <rect x="4" y="2" width="14" height="18" rx="2" />
      {/* text lines */}
      <line x1="7" y1="7" x2="17" y2="7" />
      <line x1="7" y1="10" x2="17" y2="10" />
      <line x1="7" y1="13" x2="13" y2="13" />
      {/* score badge */}
      <circle cx="17" cy="17" r="4" fill="currentColor" stroke="none" opacity="0.15" />
      <circle cx="17" cy="17" r="4" />
      <polyline points="15,17 16.5,18.5 19,15.5" strokeWidth="1.4" />
    </svg>
  );
}

function IconColdMail({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="16" height="12" rx="2" />
      <polyline points="2,6 10,13 18,6" />
      {/* reply arrow */}
      <line x1="19" y1="11" x2="22" y2="11" />
      <polyline points="20,9 22,11 20,13" />
    </svg>
  );
}

const SOURCES: Source[] = [
  {
    id: "job-search",
    label: "Job Search",
    stat: "248 new matches",
    color: "bg-blue-500",
    colorHex: "#3b82f6",
    icon: IconJobSearch,
  },
  {
    id: "app-tracker",
    label: "Application Tracker",
    stat: "36 active applications",
    color: "bg-emerald-500",
    colorHex: "#10b981",
    icon: IconAppTracker,
  },
  {
    id: "ats-checker",
    label: "Resume ATS Checker",
    stat: "ATS score 87",
    color: "bg-violet-500",
    colorHex: "#8b5cf6",
    icon: IconAtsChecker,
  },
  {
    id: "cold-mail",
    label: "Cold Mail",
    stat: "12 replies waiting",
    color: "bg-orange-500",
    colorHex: "#f97316",
    icon: IconColdMail,
  },
];

const FEED_MESSAGES: FeedMessage[] = [
  {
    id: 1,
    sourceId: "job-search",
    sender: "JS",
    text: "New match: Frontend Developer (Angular) at Zeta, 92% fit",
  },
  {
    id: 2,
    sourceId: "app-tracker",
    sender: "AT",
    text: "Interview scheduled with Infosys, moved to Round 2",
  },
  {
    id: 3,
    sourceId: "ats-checker",
    sender: "RC",
    text: "Your resume scored 87. Add \u2018RxJS\u2019 and \u2018TypeScript\u2019 to hit 95",
  },
  {
    id: 4,
    sourceId: "cold-mail",
    sender: "PM",
    text: "Priya from Postman replied: \u2018Happy to chat this week!\u2019",
  },
  {
    id: 5,
    sourceId: "app-tracker",
    sender: "AT",
    text: "Offer received from Startup X",
    needsAction: true,
  },
  {
    id: 6,
    sourceId: "cold-mail",
    sender: "CM",
    text: "Follow-up email sent to 5 hiring managers",
  },
];

// Map source → initial avatar colour
const SOURCE_COLORS: Record<SourceId, string> = {
  "job-search":  "#3b82f6",
  "app-tracker": "#10b981",
  "ats-checker": "#8b5cf6",
  "cold-mail":   "#f97316",
};

const SOURCE_BG_LIGHT: Record<SourceId, string> = {
  "job-search":  "rgba(59,130,246,0.1)",
  "app-tracker": "rgba(16,185,129,0.1)",
  "ats-checker": "rgba(139,92,246,0.1)",
  "cold-mail":   "rgba(249,115,22,0.1)",
};

const SOURCE_LABEL: Record<SourceId, string> = {
  "job-search":  "Job Search",
  "app-tracker": "App Tracker",
  "ats-checker": "ATS Checker",
  "cold-mail":   "Cold Mail",
};

// ─── SVG Connector Curves ─────────────────────────────────────────────────────

interface ConnectorProps {
  sourceIndex: number;   // 0–3
  active: boolean;
  colorHex: string;
  reducedMotion: boolean;
}

/**
 * Draws a smooth dashed cubic Bézier from the right edge of a source card
 * to the left edge of the feed panel. Each source targets a different y on the feed.
 * Coordinates are expressed inside a 100%-wide SVG that spans the gap area.
 */
function ConnectorCurve({ sourceIndex, active, colorHex, reducedMotion }: ConnectorProps) {
  const dotRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const DURATION = 1600; // ms per travel cycle

  // Card vertical centre positions (approximate % of SVG height)
  // Cards are equally spaced; adjust to match layout
  const cardCentres = [0.13, 0.37, 0.61, 0.85];
  const feedTargets = [0.22, 0.42, 0.62, 0.78];

  const startY = cardCentres[sourceIndex];
  const endY   = feedTargets[sourceIndex];

  // SVG viewBox is 100 wide × 100 tall (we'll use preserveAspectRatio="none")
  const sx = 0;
  const sy = startY * 100;
  const ex = 100;
  const ey = endY * 100;
  const c1x = 35, c1y = sy;
  const c2x = 65, c2y = ey;

  const d = `M ${sx},${sy} C ${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`;

  // Animate dot along path
  useEffect(() => {
    if (!active || reducedMotion) {
      if (dotRef.current) dotRef.current.style.opacity = "0";
      return;
    }
    const path = pathRef.current;
    const dot  = dotRef.current;
    if (!path || !dot) return;

    const totalLength = path.getTotalLength();
    dot.style.opacity = "1";

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) % DURATION;
      const t = elapsed / DURATION;
      const pt = path.getPointAtLength(t * totalLength);
      dot.setAttribute("cx", String(pt.x));
      dot.setAttribute("cy", String(pt.y));
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      startRef.current = null;
      if (dot) dot.style.opacity = "0";
    };
  }, [active, reducedMotion]);

  return (
    <g>
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={colorHex}
        strokeWidth="1.5"
        strokeDasharray="5 4"
        strokeOpacity={active ? 0.55 : 0.18}
        style={{ transition: "stroke-opacity 0.4s ease" }}
      />
      <circle
        ref={dotRef}
        r="3.5"
        fill={colorHex}
        opacity="0"
        style={{ filter: `drop-shadow(0 0 3px ${colorHex})` }}
      />
    </g>
  );
}

// ─── Source Card ──────────────────────────────────────────────────────────────

interface SourceCardProps {
  source: Source;
  active: boolean;
  onClick: () => void;
}

function SourceCard({ source, active, onClick }: SourceCardProps) {
  const Icon = source.icon;
  return (
    <motion.button
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${source.label}: ${source.stat}`}
      whileHover={{ scale: 1.02 }}
      animate={active ? { scale: 1.03 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="relative w-full text-left bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        boxShadow: active
          ? `0 0 0 2px ${source.colorHex}33, 0 4px 16px ${source.colorHex}22`
          : "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        // focus ring colour via CSS var on the button
        ["--tw-ring-color" as string]: source.colorHex,
      }}
    >
      {/* Icon backplate */}
      <span
        className="flex-none flex items-center justify-center w-10 h-10 rounded-xl"
        style={{ background: SOURCE_BG_LIGHT[source.id], color: source.colorHex }}
      >
        <Icon size={20} />
      </span>

      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-gray-800 leading-tight truncate">
          {source.label}
        </span>
        <span className="block text-[11.5px] text-gray-400 mt-0.5 truncate">
          {source.stat}
        </span>
      </span>

      {/* Active pip */}
      {active && (
        <span
          className="ml-auto flex-none w-2 h-2 rounded-full"
          style={{ background: source.colorHex }}
        />
      )}
    </motion.button>
  );
}

// ─── Feed Message Row ─────────────────────────────────────────────────────────

interface FeedRowProps {
  msg: FeedMessage;
  fadeTop?: boolean;
}

function FeedRow({ msg, fadeTop }: FeedRowProps) {
  const color = SOURCE_COLORS[msg.sourceId];
  const bgLight = SOURCE_BG_LIGHT[msg.sourceId];
  const srcLabel = SOURCE_LABEL[msg.sourceId];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: fadeTop ? 0.25 : 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl ${
        msg.needsAction ? "bg-gray-50" : ""
      }`}
    >
      {/* Avatar */}
      <span
        className="flex-none w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold leading-none mt-0.5"
        style={{ background: color }}
      >
        {msg.sender}
      </span>

      <span className="flex-1 min-w-0">
        {/* Source badge */}
        <span
          className="inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 mb-1 leading-tight"
          style={{ background: bgLight, color }}
        >
          {srcLabel}
        </span>
        {msg.needsAction && (
          <span className="ml-1.5 inline-block text-[9.5px] font-semibold tracking-wide uppercase bg-gray-800 text-white rounded-full px-2 py-0.5">
            Needs Action
          </span>
        )}
        <p className="text-[12.5px] text-gray-700 leading-snug mt-0.5 m-0">
          {msg.text}
        </p>
      </span>
    </motion.div>
  );
}

// ─── Live Feed Panel ──────────────────────────────────────────────────────────

interface FeedPanelProps {
  visibleMessages: FeedMessage[];
}

function FeedPanel({ visibleMessages }: FeedPanelProps) {
  const [input, setInput] = useState("");

  return (
    <div
      className="bg-white rounded-3xl shadow-md border border-gray-100 flex flex-col overflow-hidden"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
        {/* Outly mark */}
        <span className="flex-none w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </span>

        <span className="font-semibold text-[13.5px] text-gray-900">Outly Feed</span>

        <span className="text-[11px] text-gray-400 ml-0.5">All tools</span>

        {/* Live indicator */}
        <span className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wide">Live</span>
        </span>
      </div>

      {/* Pinned row */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
          <line x1="12" y1="17" x2="12" y2="22" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
        <span className="text-[11.5px] text-gray-500">
          <span className="font-semibold text-gray-700">Pinned</span>
          {" · "}Follow up with Razorpay recruiter on Friday
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-hidden px-2 py-2 flex flex-col gap-0.5" role="log" aria-label="Outly live feed" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((msg, i) => (
            <FeedRow
              key={msg.id}
              msg={msg}
              fadeTop={i === 0 && visibleMessages.length >= 5}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1.5 border-t border-gray-100">
        <form
          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2"
          onSubmit={(e) => { e.preventDefault(); setInput(""); }}
          aria-label="Ask Outly"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Outly anything…"
            aria-label="Ask Outly anything"
            className="flex-1 bg-transparent text-[12.5px] text-gray-700 placeholder-gray-400 outline-none min-w-0"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex-none w-7 h-7 bg-gray-900 hover:bg-gray-700 transition-colors rounded-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function OutlyFeedSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<FeedMessage[]>(
    FEED_MESSAGES.slice(0, 5)
  );
  const [msgCursor, setMsgCursor] = useState(5);
  const reducedMotion = useReducedMotion() ?? false;
  const svgRef = useRef<SVGSVGElement>(null);

  // Auto-cycle active source every 3s
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % SOURCES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  // Rotate feed messages in sync with active source
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setMsgCursor((c) => {
        const next = (c + 1) % FEED_MESSAGES.length;
        const newMsg = FEED_MESSAGES[next];
        setVisibleMessages((prev) => {
          const updated = [...prev, newMsg];
          return updated.slice(-5);
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const activeSource = SOURCES[activeIndex];

  return (
    <section
      className="w-full bg-white py-20 px-4 overflow-hidden"
      aria-labelledby="feed-section-heading"
    >
      {/* Section heading */}
      <div className="max-w-2xl mx-auto text-center mb-14">
        <h2
          id="feed-section-heading"
          className="text-[clamp(28px,4vw,44px)] font-semibold tracking-tight text-gray-900 leading-[1.1] mb-4"
        >
          Everything in your job hunt,{" "}
          <span className="text-blue-500">in one place.</span>
        </h2>
        <p className="text-[16px] text-gray-500 leading-relaxed max-w-xl mx-auto">
          Job search, application tracker, ATS resume checker and cold mail, all
          feeding one live feed. Reply, follow up and apply without switching tabs.
        </p>
      </div>

      {/* Main panel */}
      <div
        className="mx-auto rounded-[40px] bg-gray-50 border border-gray-100 p-6 md:p-8 lg:p-10"
        style={{
          maxWidth: 1200,
          boxShadow: "0 2px 20px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {/* Mobile: source cards scroll row */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:hidden -mx-1 px-1 scrollbar-none">
          {SOURCES.map((src, i) => {
            const Icon = src.icon;
            return (
              <button
                key={src.id}
                onClick={() => setActiveIndex(i)}
                aria-pressed={activeIndex === i}
                className="flex-none flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl px-3.5 py-3 shadow-sm text-left focus-visible:outline-none focus-visible:ring-2"
                style={{
                  boxShadow: activeIndex === i
                    ? `0 0 0 2px ${src.colorHex}44, 0 2px 8px ${src.colorHex}18`
                    : undefined,
                }}
              >
                <span
                  className="flex-none w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: SOURCE_BG_LIGHT[src.id], color: src.colorHex }}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-gray-800 whitespace-nowrap">{src.label}</span>
                  <span className="block text-[10.5px] text-gray-400 whitespace-nowrap">{src.stat}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop: two-column layout */}
        <div className="hidden md:flex items-stretch gap-6 lg:gap-10 relative">
          {/* Left — source cards */}
          <div className="flex flex-col gap-3 w-[220px] lg:w-[240px] flex-none justify-around py-2">
            {SOURCES.map((src, i) => (
              <SourceCard
                key={src.id}
                source={src}
                active={activeIndex === i}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>

          {/* Centre — SVG connector curves (desktop only) */}
          <div className="flex-1 relative min-w-0 pointer-events-none" aria-hidden="true">
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {SOURCES.map((src, i) => (
                <ConnectorCurve
                  key={src.id}
                  sourceIndex={i}
                  active={activeIndex === i}
                  colorHex={src.colorHex}
                  reducedMotion={reducedMotion}
                />
              ))}
            </svg>
          </div>

          {/* Right — feed panel */}
          <div className="w-[300px] lg:w-[340px] flex-none">
            <FeedPanel visibleMessages={visibleMessages} />
          </div>
        </div>

        {/* Mobile — feed panel stacked below cards */}
        <div className="mt-4 md:hidden">
          <FeedPanel visibleMessages={visibleMessages} />
        </div>
      </div>
    </section>
  );
}
