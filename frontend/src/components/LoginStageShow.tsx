import React from "react";
import { CheckCircle2, Sparkles, Send, Briefcase, FileText, Mail, ShieldCheck, ArrowRight, Zap, Target, Award } from "lucide-react";

interface LoginStageShowProps {
  activeSlide: number;
  onSelectSlide: (index: number) => void;
}

export function LoginStageShow({ activeSlide, onSelectSlide }: LoginStageShowProps) {
  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Stageshow Window Frame */}
      <div className="relative w-full max-w-[540px] rounded-2xl bg-white/95 border border-[#e8e2d5] shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_20px_45px_-10px_rgba(50,50,93,0.18),0_10px_20px_-10px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300">
        
        {/* Window Chrome / Titlebar */}
        <div className="h-10 px-4 bg-[#fbf9f6] border-b border-[#e8e2d5] flex items-center justify-between">
          {/* Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50" />
          </div>

          {/* URL Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#e8e2d5] text-[11px] font-mono text-outly-dark/65 shadow-2xs">
            <span className="text-[#2dc08d] text-[10px]">🔒</span>
            <span>
              {activeSlide === 0 && "outly.online/ats-score"}
              {activeSlide === 1 && "outly.online/cold-mail"}
              {activeSlide === 2 && "outly.online/pipeline"}
            </span>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#2dc08d]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2dc08d] animate-pulse" />
            <span className="hidden sm:inline">Active</span>
          </div>
        </div>

        {/* Mini App Navigation Strip */}
        <div className="px-4 py-2 bg-[#f8f5ef]/80 border-b border-[#e8e2d5]/60 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectSlide(0)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeSlide === 0
                  ? "bg-white text-outly-dark shadow-2xs font-semibold"
                  : "text-outly-dark/60 hover:text-outly-dark hover:bg-white/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#f23c5d]" />
              <span>ATS Score</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSlide(1)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeSlide === 1
                  ? "bg-white text-outly-dark shadow-2xs font-semibold"
                  : "text-outly-dark/60 hover:text-outly-dark hover:bg-white/50"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#2dc08d]" />
              <span>Cold Outreach</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSlide(2)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeSlide === 2
                  ? "bg-white text-outly-dark shadow-2xs font-semibold"
                  : "text-outly-dark/60 hover:text-outly-dark hover:bg-white/50"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-[#8b5cf6]" />
              <span>Job Pipeline</span>
            </button>
          </div>
          <span className="text-[10px] font-mono text-outly-dark/40 tracking-wider uppercase hidden sm:inline">
            Faux UI Kit
          </span>
        </div>

        {/* Stage Canvas Body (350px tall stage) */}
        <div className="relative p-5 sm:p-6 min-h-[340px] bg-[#fffdfb] overflow-hidden">

          {/* SCENE 0: ATS RESUME SCANNER & TAILOR */}
          {activeSlide === 0 && (
            <div className="space-y-4 animate-fade-in">
              {/* Target Role & Benchmark */}
              <div className="flex items-center justify-between pb-3 border-b border-[#f0ede6]">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-outly-dark/45">Target Benchmark</div>
                  <div className="text-sm font-semibold text-outly-dark flex items-center gap-1.5">
                    <span>Staff Frontend Engineer</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#ede8df] text-outly-dark/70 font-mono">Stripe</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#2dc08d]/10 text-[#1b8c63] border border-[#2dc08d]/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>27 Factors Passed</span>
                </div>
              </div>

              {/* Central ATS Score Display */}
              <div className="grid grid-cols-12 gap-3 items-center pt-1">
                {/* Score Dial */}
                <div className="col-span-4 p-3 rounded-2xl bg-[#faf8f5] border border-[#e8e2d5] flex flex-col items-center justify-center text-center shadow-2xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-outly-dark/50 mb-1">ATS Score</span>
                  <div className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight flex items-baseline">
                    <span>96</span>
                    <span className="text-xs font-medium text-outly-dark/40 ml-0.5">/100</span>
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2dc08d] text-white">
                    <Award className="w-3 h-3" />
                    <span>Top 2%</span>
                  </div>
                </div>

                {/* Score Factors */}
                <div className="col-span-8 space-y-2">
                  <div className="p-2 rounded-xl bg-white border border-[#e8e2d5] flex items-center justify-between text-xs">
                    <span className="font-medium text-outly-dark flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2dc08d]" />
                      Action verbs & metrics
                    </span>
                    <span className="font-bold text-[#2dc08d]">20 / 20</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#e8e2d5] flex items-center justify-between text-xs">
                    <span className="font-medium text-outly-dark flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2dc08d]" />
                      Header & body parsability
                    </span>
                    <span className="font-bold text-[#2dc08d]">10 / 10</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#e8e2d5] flex items-center justify-between text-xs">
                    <span className="font-medium text-outly-dark flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2dc08d]" />
                      Keyword overlap density
                    </span>
                    <span className="font-bold text-[#2dc08d]">25 / 25</span>
                  </div>
                </div>
              </div>

              {/* Satellite Card Straddling Bottom Right (Stageshow Rule 7 & 8) */}
              <div className="mt-4 p-3.5 rounded-2xl bg-white border border-[#e0d9cd] shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_14px_30px_-6px_rgba(50,50,93,0.2),0_4px_10px_-4px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#f23c5d]" />
                    <span className="text-xs font-bold text-outly-dark">14 Matched JD Keywords</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#2dc08d] bg-[#2dc08d]/10 px-2 py-0.5 rounded-md">
                    +18 pts optimized
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["React 19", "TypeScript", "Distributed Systems", "Next.js", "Web Vitals"].map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#faf8f5] text-outly-dark/80 border border-[#e8e2d5]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCENE 1: AI COLD OUTREACH */}
          {activeSlide === 1 && (
            <div className="space-y-4 animate-fade-in">
              {/* Target Recruiter */}
              <div className="flex items-center justify-between pb-3 border-b border-[#f0ede6]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f23c5d] to-[#ff7a8f] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    SJ
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-outly-dark flex items-center gap-1.5">
                      <span>Sarah Jenkins</span>
                      <span className="text-[10px] font-mono text-[#2dc08d] bg-[#2dc08d]/10 px-1.5 py-0.2 rounded font-semibold">Verified ✓</span>
                    </div>
                    <div className="text-xs text-outly-dark/50">Head of Technical Talent @ Vercel</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-outly-dark/45">Deliverability</div>
                  <div className="text-xs font-bold text-[#2dc08d]">99.8% Inbox</div>
                </div>
              </div>

              {/* AI Draft Preview */}
              <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#e8e2d5] space-y-2">
                <div className="flex items-center justify-between text-xs text-outly-dark/60 pb-1.5 border-b border-[#e8e2d5]/60 font-mono">
                  <span>Subj: Edge Runtime &amp; Frontend Infrastructure</span>
                  <span className="text-[11px] text-[#f23c5d] font-sans font-semibold">AI Tailored</span>
                </div>
                <p className="text-xs text-outly-dark/80 leading-relaxed font-sans">
                  "Hi Sarah, noticed your team is expanding the Edge runtime architecture — recently built an identical zero-latency pipeline that supported 25M daily requests. Would love to share the system design notes..."
                </p>
              </div>

              {/* Satellite Card: Outreach Actions */}
              <div className="mt-3 p-3.5 rounded-2xl bg-white border border-[#e0d9cd] shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_14px_30px_-6px_rgba(50,50,93,0.2),0_4px_10px_-4px_rgba(0,0,0,0.12)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-outly-dark">1-Click Gmail Sync</div>
                  <div className="text-[11px] text-outly-dark/55">Direct draft injection with scheduled follow-ups</div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl bg-outly-dark text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black transition-colors shadow-2xs"
                >
                  <Send className="w-3 h-3 text-[#2dc08d]" />
                  <span>Send Draft</span>
                </button>
              </div>
            </div>
          )}

          {/* SCENE 2: PIPELINE TRACKER */}
          {activeSlide === 2 && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#f0ede6]">
                <div className="text-xs font-mono uppercase tracking-wider text-outly-dark/50">Active Applications</div>
                <span className="text-xs font-bold text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-full">
                  3 In Progress
                </span>
              </div>

              {/* Applications Rows */}
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white border border-[#e8e2d5] flex items-center justify-between text-xs hover:border-outly-dark/30 transition-all shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#1a1a1a] text-white text-[10px] font-bold flex items-center justify-center">G</span>
                    <div>
                      <div className="font-semibold text-outly-dark">Google · Staff Engineer</div>
                      <div className="text-[10px] text-outly-dark/50">Mountain View, CA · $225k</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2dc08d]/15 text-[#1b8c63] border border-[#2dc08d]/25">
                    Interview Tomorrow 10am
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#e8e2d5] flex items-center justify-between text-xs hover:border-outly-dark/30 transition-all shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#5b5bd6] text-white text-[10px] font-bold flex items-center justify-center">L</span>
                    <div>
                      <div className="font-semibold text-outly-dark">Linear · Product Engineer</div>
                      <div className="text-[10px] text-outly-dark/50">Remote · $195k</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/25">
                    Takehome Submitted
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#e8e2d5] flex items-center justify-between text-xs hover:border-outly-dark/30 transition-all shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#635bff] text-white text-[10px] font-bold flex items-center justify-center">S</span>
                    <div>
                      <div className="font-semibold text-outly-dark">Stripe · Senior Fullstack</div>
                      <div className="text-[10px] text-outly-dark/50">San Francisco, CA · $210k</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8b5cf6]/15 text-[#6d28d9] border border-[#8b5cf6]/25">
                    Offer Extended 🎉
                  </span>
                </div>
              </div>

              {/* Satellite Card: Morning Brief */}
              <div className="mt-2 p-3.5 rounded-2xl bg-white border border-[#e0d9cd] shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_14px_30px_-6px_rgba(50,50,93,0.2),0_4px_10px_-4px_rgba(0,0,0,0.12)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-outly-dark">Daily Morning Brief</div>
                  <div className="text-[11px] text-outly-dark/55">2 follow-ups queued for today</div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-outly-accent cursor-pointer hover:underline">
                  <span>Open Prep</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Slide Navigation Dots */}
      <div className="flex items-center gap-2 mt-6">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === idx
                ? "bg-outly-accent w-8"
                : "bg-[#e8e2d5] hover:bg-outly-accent/40 w-2"
            }`}
            aria-label={`Show slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
