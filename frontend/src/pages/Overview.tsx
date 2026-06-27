import { useEffect } from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OverviewPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(link);
    document.title = "Outly - Check Your Resume ATS Score";

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="relative flex-1 min-h-screen w-full select-none overflow-hidden pb-12 font-sans text-outly-dark">
      <style>{`
        .glowing-bg-mesh {
          background:
            radial-gradient(circle at 80% 100%, rgba(25, 204, 149, 0.16), transparent 45%),
            radial-gradient(circle at 40% 100%, rgba(89, 37, 220, 0.12), transparent 50%),
            #faf8f5;
        }

        @keyframes onboard-enter {
          0% { opacity: 0; transform: translateY(34px) scale(0.96); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes onboard-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes sidebar-reveal {
          0% { opacity: 0; transform: translateX(-24px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes content-reveal {
          0% { opacity: 0; transform: translateX(36px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes gauge-fill {
          0% { stroke-dashoffset: 150; }
          100% { stroke-dashoffset: 54; }
        }

        @keyframes gauge-needle {
          0% { transform: rotate(-74deg); }
          70% { transform: rotate(18deg); }
          100% { transform: rotate(8deg); }
        }

        @keyframes line-scan {
          0% { transform: translateX(-35%); opacity: 0.35; }
          50% { opacity: 0.9; }
          100% { transform: translateX(135%); opacity: 0.35; }
        }

        @keyframes bar-grow {
          0% { width: 6%; }
          100% { width: 42%; }
        }

        @keyframes pin-drop {
          0% { opacity: 0; transform: translate(-50%, -28px) scale(0.75); }
          55% { opacity: 1; transform: translate(-50%, 2px) scale(1.08); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }

        @keyframes checklist-pop {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .onboard-stage {
          animation: onboard-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .onboard-sidebar {
          animation: sidebar-reveal 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
        }

        .onboard-content {
          animation: content-reveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.38s both;
        }

        .gauge-progress {
          stroke-dasharray: 150;
          stroke-dashoffset: 150;
          animation: gauge-fill 1.25s ease-out 0.95s forwards;
        }

        .gauge-needle {
          transform-origin: 50px 62px;
          animation: gauge-needle 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.92s forwards;
        }

        .scan-line::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 35%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.72), transparent);
          animation: line-scan 2.4s ease-in-out forwards;
        }

        .parse-fill {
          animation: bar-grow 1.35s cubic-bezier(0.16, 1, 0.3, 1) 1.05s forwards;
        }

        .pin-drop {
          animation: pin-drop 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.65s both;
        }

        .checklist-item {
          animation: checklist-pop 0.45s ease-out both;
        }
      `}</style>

      <div className="glowing-bg-mesh absolute inset-0 -z-10 min-h-screen w-full" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-6 py-8 lg:grid-cols-12 lg:gap-16 lg:pt-14 lg:pb-12">
        <div className="flex flex-col justify-center space-y-9 text-left lg:col-span-6">
          <div className="space-y-7">
            <h1 className="text-4xl font-semibold leading-[1.25] tracking-normal text-outly-dark sm:text-5xl lg:text-[54px]">
              Check your resume <span className="text-outly-accent">ATS score</span> & land more interviews
            </h1>
            <p className="max-w-xl text-base font-medium leading-relaxed text-outly-dark/60 sm:text-lg">
              ATS Check, AI Writer, and One-Click Job Tailoring make your resume stand out to recruiters.
            </p>
          </div>

          <div className="mt-10 flex max-w-lg flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <button
              onClick={() => navigate("/ats-score")}
              className="rounded-full bg-outly-accent px-8 py-4 font-sans text-[16px] font-medium text-white shadow-lg shadow-outly-accent/25 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer select-none text-center"
            >
              Check ATS Of Resume
            </button>

            <button
              onClick={() => navigate("/resume-tailor")}
              className="rounded-full border border-outly-border bg-white px-8 py-4 font-sans text-[16px] font-medium text-outly-dark hover:border-outly-dark/40 hover:bg-outly-dark/5 active:scale-[0.98] transition-all duration-200 cursor-pointer select-none text-center"
            >
              Tailor Resume
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
              <span className="text-xs font-bold tracking-tight text-outly-dark/50">5,287 Reviews</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-outly-border bg-outly-cream/80 px-4 py-2 shadow-sm">
              <span className="grid h-4 w-4 place-items-center rounded-full border border-green-500/20 bg-green-50 text-[10px] text-green-500 font-bold">✓</span>
              <span className="text-xs font-bold text-outly-dark/70">
                <strong className="text-outly-dark">28,452 users</strong> landed interviews last month
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex min-w-0 h-[430px] w-full items-center justify-center overflow-hidden sm:h-[500px] lg:col-span-6 lg:h-[560px]">
          <div className="absolute inset-x-0 bottom-0 h-52 bg-[radial-gradient(ellipse_at_28%_82%,rgba(89,37,220,0.22),transparent_62%),radial-gradient(ellipse_at_0%_92%,rgba(25,204,149,0.16),transparent_58%)]" />

          <div className="onboard-stage relative h-[455px] w-full max-w-[720px] overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_34px_90px_rgba(89,37,220,0.16)] backdrop-blur sm:h-[500px]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(245,248,255,0.66))]" />

            <div className="relative z-10 flex h-full gap-4 p-5 sm:p-7">
              <aside className="onboard-sidebar min-w-0 w-[150px] shrink-0 rounded-2xl border border-[#e3e9f5] bg-white p-5 text-left shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:w-[178px]">
                <div className="mb-8 flex items-center gap-2">
                  <img src="/favicon.png" alt="Outly" className="h-5 w-5 object-contain" />
                  <span className="text-[11px] font-bold text-[#19cc95]">Outly</span>
                </div>

                <div className="mb-6 rounded-2xl border border-[#e3e9f5] bg-white p-4">
                  <div className="mb-3 text-center text-[13px] font-semibold text-[#2d3639]">Resume Score</div>
                  <div className="relative mx-auto h-[72px] w-[110px]">
                    <svg viewBox="0 0 100 70" className="h-full w-full">
                      <path d="M18 56a32 32 0 0 1 64 0" fill="none" stroke="#e7ecf7" strokeLinecap="round" strokeWidth="9" />
                      <path className="gauge-progress" d="M18 56a32 32 0 0 1 64 0" fill="none" stroke="url(#scoreGradient)" strokeLinecap="round" strokeWidth="9" />
                      <defs>
                        <linearGradient id="scoreGradient" x1="18" y1="0" x2="82" y2="0">
                          <stop stopColor="#2dc08d" />
                          <stop offset="0.55" stopColor="#ffbd58" />
                          <stop offset="1" stopColor="#19cc95" />
                        </linearGradient>
                      </defs>
                      <line className="gauge-needle" x1="50" y1="62" x2="50" y2="31" stroke="#47445a" strokeLinecap="round" strokeWidth="1.8" />
                      <circle cx="50" cy="62" r="2.2" fill="#47445a" />
                    </svg>
                    <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
                      <span className="text-2xl font-black text-outly-dark">89</span>
                    </div>
                  </div>
                </div>

                <div className="mb-5 h-px bg-[#e3e9f5]" />

                <div className="space-y-4 text-[8px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span>Content</span>
                      <span>^</span>
                    </div>
                    <div className="space-y-2 text-[10px] font-medium normal-case tracking-normal text-[#384347]">
                      {["ATS Parse Rate", "Quantifying Impact"].map((item, index) => (
                        <div key={item} className="checklist-item flex items-center gap-2" style={{ animationDelay: `${1.25 + index * 0.14}s` }}>
                          <span className="text-[#19cc95]">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                      {["Repetition", "Spelling & Grammar", "Summarize Resume"].map((item, index) => (
                        <div key={item} className="checklist-item flex items-center gap-2" style={{ animationDelay: `${1.55 + index * 0.14}s` }}>
                          <span className={index === 0 ? "text-[#2dc08d]" : "text-[#6b7280]"}>{index === 0 ? "x" : "■"}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {["Format & Brevity", "Style", "Sections", "Skills"].map((item, index) => (
                    <div key={item} className="checklist-item flex items-center justify-between" style={{ animationDelay: `${1.95 + index * 0.12}s` }}>
                      <span>{item}</span>
                      <span>⌄</span>
                    </div>
                  ))}
                </div>
              </aside>

              <section className="onboard-content min-w-0 flex-1 overflow-hidden rounded-tl-2xl bg-[#dfe6f4] text-left">
                <div className="flex items-center gap-2 px-6 py-6 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#47445a]">
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-[#6d5be8] text-[10px] text-white">≡</span>
                  Content
                </div>

                <div className="mx-5 rounded-t-xl bg-white p-5 shadow-[0_16px_55px_rgba(71,68,90,0.08)] sm:mx-7 sm:p-6">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[#47445a]">
                    <span className="h-3 w-1 rounded-full border border-[#9cb2dc]" />
                    ATS Parse Rate
                  </div>
                  <div className="space-y-3">
                    {[96, 68, 66, 60].map((width, index) => (
                      <div key={index} className="scan-line relative h-2 overflow-hidden rounded-full bg-[#dadbdd]" style={{ width: `${width}%` }} />
                    ))}
                  </div>
                </div>

                <div className="relative mx-5 mt-4 rounded-xl border border-[#e3e9f5] bg-[#fafbfd] p-5 shadow-sm sm:mx-7 sm:p-7">
                  <div className="relative mx-auto mt-3 h-4 max-w-[360px] rounded-full border border-[#9cb2dc] bg-[#f5f7fc] shadow-inner">
                    <div className="parse-fill absolute left-0 top-0 h-full w-[6%] rounded-full bg-gradient-to-r from-[#2dc08d] to-[#ffbd58]" />
                    <div className="pin-drop absolute left-[42%] -top-8 text-[#2dc08d] drop-shadow-md">
                      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                        <path d="M12 2.5a6.7 6.7 0 0 0-6.7 6.7c0 4.8 6.7 12.3 6.7 12.3s6.7-7.5 6.7-12.3A6.7 6.7 0 0 0 12 2.5Zm0 9.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Z" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    {[70, 76, 64, 58].map((width, index) => (
                      <div key={index} className="scan-line relative h-2 overflow-hidden rounded-full bg-[#d8d9db]" style={{ width: `${width}%` }} />
                    ))}
                  </div>
                </div>

                <div className="mx-5 mt-4 h-28 rounded-xl border border-[#e3e9f5] bg-[#fafbfd] sm:mx-7" />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
