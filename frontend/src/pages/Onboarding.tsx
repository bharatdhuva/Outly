import { useEffect } from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ResumeCarousel from "@/components/ResumeCarousel";

export default function OnboardingPage() {
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

        @keyframes sidebar-reveal {
          0% { opacity: 0; transform: translateX(-24px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes content-reveal {
          0% { opacity: 0; transform: translateX(36px); }
          100% { opacity: 1; transform: translateX(0); }
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

        {/* Right-Side Animated Resume Carousel */}
        <div className="flex items-center justify-center lg:col-span-6 w-full py-4">
          <ResumeCarousel />
        </div>
      </div>
    </div>
  );
}
