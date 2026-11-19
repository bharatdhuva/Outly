import { useEffect } from "react";
import { Star, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ResumeCarousel from "@/components/ResumeCarousel";
import { m } from "motion/react";
import { dur, ease, fadeUpVariants } from "@/lib/motion-tokens";

const heroContentVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.enter, ease: ease.out, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.enter, ease: ease.out } },
};

export default function OnboardingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Outly — Overview & ATS Score";
  }, []);

  return (
    <div className="relative flex-1 min-h-[calc(100vh-4rem)] w-full select-none overflow-x-clip pb-16 font-sans text-[#111111] bg-white">
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-4 sm:px-8 py-6 lg:grid-cols-12 lg:gap-16 lg:pt-12 lg:pb-12">
        <m.div
          variants={heroContentVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center space-y-8 text-left lg:col-span-6"
        >
          <m.div variants={itemVariants} className="space-y-5">
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-semibold leading-[1.15] tracking-[-0.045em] text-[#111111] [word-spacing:0.01em]">
              Check your resume <span className="text-[#12A394] font-semibold">ATS score</span> &amp; land more interviews
            </h1>
            <p className="max-w-xl text-[16px] sm:text-[17px] font-normal leading-[1.58] tracking-[-0.01em] text-[#6a6a66]">
              Automated 27-factor scoring, targeted tailoring, and keyword alignment calibrated for applicant tracking systems.
            </p>
          </m.div>

          <m.div variants={itemVariants} className="flex max-w-lg flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {/* Primary Action */}
            <m.button
              type="button"
              whileTap={{ scale: 0.98 }}
              transition={{ duration: dur.instant }}
              onClick={() => {
                if (window.innerWidth < 768) {
                  navigate("/resumes?tab=ats");
                } else {
                  navigate("/ats-score");
                }
              }}
              className="min-h-[48px] rounded-full bg-[#12A394] px-7 py-3 font-sans text-[15px] font-medium text-white shadow-[0_4px_14px_rgba(18,163,148,0.22)] hover:bg-[#0B8A7D] hover:shadow-[0_8px_24px_rgba(18,163,148,0.3)] transition-all duration-180 cursor-pointer select-none text-center tracking-[-0.015em]"
            >
              Check ATS Score
            </m.button>

            {/* Secondary Action */}
            <m.button
              type="button"
              whileTap={{ scale: 0.98 }}
              transition={{ duration: dur.instant }}
              onClick={() => {
                if (window.innerWidth < 768) {
                  navigate("/resumes?tab=tailor");
                } else {
                  navigate("/resume-tailor");
                }
              }}
              className="min-h-[48px] rounded-full border border-black/10 bg-white px-7 py-3 font-sans text-[15px] font-medium text-[#111111] shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:bg-[#f7f7f5] hover:border-black/20 transition-all duration-180 cursor-pointer select-none text-center tracking-[-0.015em]"
            >
              Tailor for a Job
            </m.button>
          </m.div>

          <m.div variants={itemVariants} className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-[#f59e0b]">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
              <span className="text-xs font-medium text-[#6a6a66]">5,287 verified reviews</span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-[#f7f7f5] px-3.5 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <CheckCircle className="h-4 w-4 text-[#12A394] shrink-0" />
              <span className="text-xs font-normal text-[#6a6a66]">
                <strong className="font-semibold text-[#111111]">28,452 candidate scans</strong> completed this month
              </span>
            </div>
          </m.div>
        </m.div>

        {/* Right-Side Resume Carousel with signature entrance */}
        <m.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: dur.enter, ease: ease.out, delay: 0.15 }}
          className="flex items-center justify-center lg:col-span-6 w-full py-4"
        >
          <ResumeCarousel />
        </m.div>
      </div>
    </div>
  );
}
