import { useState, useEffect } from "react";

export default function HeroDashboardMockup() {
  const [score, setScore] = useState(0);
  const [showItem1, setShowItem1] = useState(false);
  const [showItem2, setShowItem2] = useState(false);
  const [showItem3, setShowItem3] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHeaders, setShowHeaders] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Reset all states
    setScore(0);
    setShowItem1(false);
    setShowItem2(false);
    setShowItem3(false);
    setProgress(0);
    setShowHeaders(false);

    // 1. Score Gauge Animation (0 -> 89)
    const scoreTimeout = setTimeout(() => {
      let currentScore = 0;
      const scoreInterval = setInterval(() => {
        currentScore += 2;
        if (currentScore >= 89) {
          currentScore = 89;
          clearInterval(scoreInterval);
        }
        setScore(currentScore);
      }, 25);
      return () => clearInterval(scoreInterval);
    }, 200);

    // 2. Checklist Items Sequence
    const item1Timeout = setTimeout(() => setShowItem1(true), 800);
    const item2Timeout = setTimeout(() => setShowItem2(true), 1500);
    const item3Timeout = setTimeout(() => setShowItem3(true), 2200);

    // 3. Progress Bar Fill (0% -> 75%)
    const progressTimeout = setTimeout(() => {
      setProgress(75);
    }, 2600);

    // 4. Headers Fade In
    const headersTimeout = setTimeout(() => {
      setShowHeaders(true);
    }, 3000);

    // 5. Loop Sequence (Pause for 2.5s at the end, total duration 7.5s)
    const loopTimeout = setTimeout(() => {
      setTick((prev) => prev + 1);
    }, 7500);

    return () => {
      clearTimeout(scoreTimeout);
      clearTimeout(item1Timeout);
      clearTimeout(item2Timeout);
      clearTimeout(item3Timeout);
      clearTimeout(progressTimeout);
      clearTimeout(headersTimeout);
      clearTimeout(loopTimeout);
    };
  }, [tick]);

  // SVG Gauge Calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0b0f19] shadow-2xl shadow-emerald-950/10 text-left overflow-hidden animate-float select-none">
      {/* Custom Keyframes Style Block to keep component 100% self-contained */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* Browser Chrome Header */}
      <div className="flex h-10 items-center border-b border-slate-800/60 bg-[#131924] px-4">
        {/* Window Controls */}
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
          <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
          <span className="h-3 w-3 rounded-full bg-[#10b981]" />
        </div>
        {/* URL Bar */}
        <div className="mx-auto flex w-52 items-center justify-center rounded-md border border-slate-800/40 bg-[#0b0f19]/60 py-0.5 text-[10px] font-mono text-slate-500">
          outly.online/dashboard
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="p-5 space-y-5">
        {/* Top Section: Title & Metadata */}
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Real-time Analysis</h3>
            <p className="text-sm font-semibold text-white mt-0.5">SDE_Resume_2026.pdf</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-emerald-400 uppercase border border-emerald-500/20">
            Active Scan
          </span>
        </div>

        {/* Middle Section: Gauge & Checklist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Left Column: Circular Score Gauge */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800/40 bg-[#131924]/40 p-4 text-center">
            <div className="relative flex items-center justify-center w-24 h-24">
              {/* Radial Background */}
              <svg className="absolute w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-slate-800/60"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-emerald-500 transition-all duration-500 ease-out"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Score Number */}
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-white leading-none font-mono">{score}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 font-mono">Score</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">ATS Match Rate</p>
          </div>

          {/* Right Column: Checklist Items */}
          <div className="flex flex-col justify-center rounded-xl border border-slate-800/40 bg-[#131924]/40 p-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">Checks Done</h4>
            
            {/* Check 1 */}
            <div
              className={`flex items-center gap-2.5 transition-all duration-500 ${
                showItem1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-xs font-medium text-slate-300">ATS Parse Rate</span>
            </div>

            {/* Check 2 */}
            <div
              className={`flex items-center gap-2.5 transition-all duration-500 ${
                showItem2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-xs font-medium text-slate-300">Quantifying Impact</span>
            </div>

            {/* Check 3 */}
            <div
              className={`flex items-center gap-2.5 transition-all duration-500 ${
                showItem3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <span className="text-xs font-medium text-slate-300">Repetition Check</span>
            </div>

          </div>
        </div>

        {/* Bottom Section: Progress Bar */}
        <div className="rounded-xl border border-slate-800/40 bg-[#131924]/40 p-4 space-y-3">
          <div
            className={`flex items-center justify-between transition-all duration-500 ${
              showHeaders ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
          >
            <div>
              <h4 className="text-xs font-bold text-white">Content Analysis</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Verifying action verbs & formatting density</p>
            </div>
            <span className="text-xs font-black text-amber-400 font-mono">{progress}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="h-2.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-1000 ease-out"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
