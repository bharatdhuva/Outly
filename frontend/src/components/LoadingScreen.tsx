import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoIcon from "@/assets/jobos-logo-icon.svg";
import assistanceGif from "@/assets/logos/assistance.gif";
import gmailPng from "@/assets/logos/gmail.png";
import imageCopy3Png from "@/assets/logos/image copy 3.png";
import redditPng from "@/assets/logos/reddit.png";
import telegramPng from "@/assets/logos/telegram.png";
import twitterPng from "@/assets/logos/twitter.png";

const TYPING_TEXTS = [
  "Calibrating social drafts...",
  "Connecting Gmail API...",
  "Loading Cold Mail engine...",
  "Syncing LinkedIn posts...",
  "Starting Telegram bot...",
];

const STATUS_CARDS = [
  { label: "AUTOMATION", value: "Hot", delay: 0.5 },
  { label: "DRAFT STACK", value: "Ready", delay: 1.0 },
  { label: "TELEMETRY", value: "Live", delay: 1.5 },
];

const FLOATING_ICONS = [
  { name: "Gmail", src: gmailPng, x: -36, y: -172, floatDur: 2.8, floatY: -10, delay: 0.2, blend: "screen" },
  { name: "Profile Card", src: imageCopy3Png, x: -104, y: -82, floatDur: 3.2, floatY: -12, delay: 0.5, blend: "multiply" },
  { name: "Twitter", src: twitterPng, x: 176, y: 46, floatDur: 2.5, floatY: -8, delay: 0.3, blend: "screen" },
  { name: "Telegram", src: telegramPng, x: 18, y: 178, floatDur: 3.0, floatY: -11, delay: 0.7, blend: "normal" },
  { name: "Reddit", src: redditPng, x: -146, y: 94, floatDur: 2.6, floatY: -9, delay: 0.4, blend: "normal" },
  { name: "WhatsApp", src: assistanceGif, x: 152, y: -74, floatDur: 3.4, floatY: -10, delay: 0.6, blend: "multiply" },
];

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const start = Date.now();
    const duration = 3000;

    const tick = () => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(nextProgress);

      if (elapsed < duration) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTypingIndex((index) => (index + 1) % TYPING_TEXTS.length);
    }, 1500);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onComplete, 400);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  const headingWords = "Launching the workspace before the first click.".split(" ");

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 60% 50%, rgba(251,146,60,0.08) 0%, transparent 60%), #0d0d0d",
          }}
        >
          <div className="flex h-full w-full items-center px-8 md:px-16 lg:px-24">
            <div className="flex w-full flex-col justify-center text-center md:w-[45%] md:text-left">
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mb-8"
              >
                <span
                  className="inline-block rounded-full px-3 py-1"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                  }}
                >
                  LIVE BOOT
                </span>
              </motion.div>

              <div className="mb-5" style={{ lineHeight: 1.05 }}>
                {headingWords.map((word, index) => (
                  <motion.span
                    key={`${word}-${index}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.06, duration: 0.4 }}
                    className="mr-[0.3em] inline-block"
                    style={{
                      fontSize: "clamp(36px, 4vw, 52px)",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      color: "#ffffff",
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mx-auto mb-10 md:mx-0"
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.7,
                  maxWidth: 400,
                }}
              >
                A fast startup-style handoff with brand-first motion, live system staging, and a clean reveal into the dashboard.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="mb-10 inline-flex items-center gap-3 self-center md:self-start"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 12,
                  padding: "14px 20px",
                }}
              >
                <div className="flex items-center gap-2">
                  <img src={logoIcon} alt="Outly logo" className="h-8 w-8 shrink-0" />
                  <div className="flex items-end gap-1">
                    <span className="brand-wordmark text-[2rem] leading-none text-white">Outly</span>
                    <span className="mb-0.5 h-3 w-3 rounded-full bg-primary shadow-[0_0_18px_hsl(24_95%_53%/0.7)]" />
                  </div>
                </div>
                <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }} />
                <div className="flex flex-col">
                  <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
                    RUNTIME
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={typingIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}
                    >
                      {TYPING_TEXTS[typingIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.3 }}
                className="mb-6 w-full"
                style={{ maxWidth: 440 }}
              >
                <div className="mb-1.5 flex justify-between">
                  <span style={{ fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
                    SYSTEM LOAD
                  </span>
                  <span style={{ fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
                    {progress}%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 3,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 9999,
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: "linear-gradient(to right, #f97316, #fb923c)",
                      borderRadius: 9999,
                      transition: "width 0.1s linear",
                    }}
                  />
                </div>
              </motion.div>

              <div className="flex gap-3">
                {STATUS_CARDS.map((card) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay + 0.7, duration: 0.4 }}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        color: "rgba(255,255,255,0.3)",
                        marginBottom: 4,
                      }}
                    >
                      {card.label}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{card.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.45 }}
              className="relative hidden w-[55%] items-center justify-center md:flex"
            >
              <div className="relative" style={{ width: 420, height: 420 }}>
                <div className="loading-screen__satellite-cluster">
                  <div className="loading-screen__satellite-ring" />
                  <div className="loading-screen__satellite-ring loading-screen__satellite-ring--inner" />
                  <div className="loading-screen__satellite-arc loading-screen__satellite-arc--orange" />
                  <div className="loading-screen__satellite-arc loading-screen__satellite-arc--blue" />
                </div>

                <div
                  className="absolute inset-0 rounded-full"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 240,
                    height: 240,
                    border: "1px solid rgba(255,255,255,0.12)",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 120,
                    height: 120,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)",
                  }}
                />

                <div
                  className="absolute animate-[spin_20s_linear_infinite]"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    filter: "drop-shadow(0 0 30px rgba(251,146,60,0.3))",
                  }}
                >
                  <img src={logoIcon} alt="Outly orbit logo" className="h-12 w-12" />
                </div>

                {FLOATING_ICONS.map((item, index) => (
                  <motion.div
                    key={`${item.name}-${index}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "backOut", delay: item.delay }}
                    className="absolute"
                    style={{
                      top: "50%",
                      left: "50%",
                      marginTop: item.y - 20,
                      marginLeft: item.x - 20,
                    }}
                  >
                    <div
                      style={{
                        animation: `iconFloat${index} ${item.floatDur}s ease-in-out infinite`,
                        animationDelay: `${item.delay}s`,
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 40,
                          height: 40,
                        }}
                      >
                        <img
                          src={item.src}
                          alt={item.name}
                          className={`loading-screen__floating-asset loading-screen__floating-asset--${item.blend} h-10 w-10 object-contain`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <style>{`
            ${FLOATING_ICONS.map(
              (item, index) => `
                @keyframes iconFloat${index} {
                  0%, 100% { transform: translateY(0) rotate(0deg); }
                  50% { transform: translateY(${item.floatY}px) rotate(${index % 2 === 0 ? 3 : -3}deg); }
                }
              `,
            ).join("")}
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
