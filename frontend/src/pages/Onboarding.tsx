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
    <div className="relative flex-1 min-h-[calc(100vh-4rem)] w-full select-none overflow-x-clip pb-16 font-rubik text-[#1A1A1A]">
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-4 sm:px-8 py-6 lg:grid-cols-12 lg:gap-16 lg:pt-12 lg:pb-12">
        <m.div
          variants={heroContentVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center space-y-8 text-left lg:col-span-6"
        >
          <m.div variants={itemVariants} className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-semibold leading-[1.2] tracking-tight text-[#1A1A1A]">
              Check your resume <span className="text-primary font-semibold">ATS score</span> &amp; land more interviews
            </h1>
            <p className="max-w-xl text-base font-normal leading-relaxed text-[#6B6760]">
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
              className="min-h-[48px] rounded-full bg-primary px-7 py-3 font-rubik text-[15px] font-medium text-white shadow-sm hover:bg-[#25A87A] transition-colors cursor-pointer select-none text-center"
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
              className="min-h-[48px] rounded-full border border-[#E0DBCF] bg-white px-7 py-3 font-rubik text-[15px] font-medium text-[#1A1A1A] hover:bg-[#F0EDE7]/50 hover:border-[#1A1A1A]/30 transition-colors cursor-pointer select-none text-center"
            >
              Tailor for a Job
            </m.button>
          </m.div>

          <m.div variants={itemVariants} className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
              <span className="text-xs font-medium text-[#6B6760]">5,287 verified reviews</span>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-[#E0DBCF] bg-white px-3.5 py-1.5 shadow-xs">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-normal text-[#6B6760]">
                <strong className="font-semibold text-[#1A1A1A]">28,452 candidate scans</strong> completed this month
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
