import { useEffect } from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ResumeCarousel from "@/components/ResumeCarousel";

export default function OverviewPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Outly - Check Your Resume ATS Score";
  }, []);

  return (
    <div className="relative flex-1 min-h-screen w-full select-none overflow-x-clip pb-12 font-sans text-outly-dark">
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

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-6 py-6 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:pt-14 lg:pb-12">
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

        <div className="flex items-center justify-center lg:col-span-6 w-full py-4">
          <ResumeCarousel />
        </div>
      </div>
    </div>
  );
}
