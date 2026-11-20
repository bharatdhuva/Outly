import { useState, useEffect } from "react";
import resume1 from "@/assets/resumes/resume1.webp";
import resume3 from "@/assets/resumes/resume3.webp";
import resume4 from "@/assets/resumes/resume4.webp";

const RESUME_IMAGES = [
  { id: 1, src: resume1, title: "ATS Pro SDE Template", tag: "Most Popular" },
  { id: 2, src: resume3, title: "Executive Tech Resume", tag: "High Response" },
  { id: 3, src: resume4, title: "Modern Minimalist CV", tag: "98% Parse Rate" },
];

export default function ResumeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % RESUME_IMAGES.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-start w-full max-w-[460px] mx-auto select-none overflow-visible font-sans pt-0">
      
      {/* Subtle Ambient Teal Glow matching landing page */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(18,163,148,0.12),transparent_68%)] rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Stacked Cards Deck Container */}
      <div className="relative w-full h-[460px] sm:h-[500px] flex items-start justify-center pt-0">
        {RESUME_IMAGES.map((img, index) => {
          const total = RESUME_IMAGES.length;
          const offset = (index - activeIndex + total) % total;

          let zIndex = 10;
          let transform = "";
          let opacity = 1;
          let filter = "";

          if (offset === 0) {
            // Front / Active Card - Clean landing page surface & elevated drop shadow
            zIndex = 30;
            transform = "translateY(0px) scale(1) rotate(0deg)";
            opacity = 1;
            filter = "drop-shadow(0 20px 36px rgba(18,163,148,0.22)) drop-shadow(0 4px 12px rgba(0,0,0,0.06))";
          } else if (offset === 1) {
            // Second Card in Deck
            zIndex = 20;
            transform = "translateY(20px) scale(0.92) rotate(3.5deg)";
            opacity = 0.88;
            filter = "drop-shadow(0 14px 26px rgba(18,163,148,0.12))";
          } else {
            // Third Card in Deck
            zIndex = 10;
            transform = "translateY(38px) scale(0.85) rotate(-3.5deg)";
            opacity = 0.65;
            filter = "drop-shadow(0 8px 16px rgba(18,163,148,0.08))";
          }

          return (
            <div
              key={img.id}
              onClick={() => setActiveIndex(index)}
              style={{
                zIndex,
                transform,
                opacity,
                filter,
              }}
              className="absolute top-0 w-[86%] sm:w-[90%] max-w-[350px] aspect-[1/1.42] rounded-[22px] overflow-hidden border border-black/[0.08] bg-white cursor-pointer transition-all duration-700 ease-out hover:scale-[1.015] group shadow-[0_20px_48px_-8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]"
            >
              {/* Card Header Bar - Landing Page Ink Aesthetic */}
              <div className="h-9 w-full bg-[#111111] px-3.5 flex items-center justify-between shrink-0 select-none text-white shadow-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
                
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15 text-[10px] font-medium text-white/90 tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12A394] animate-pulse" />
                  <span>outly.online/resume</span>
                </div>

                <span className="text-[10px] font-semibold bg-[#12A394] text-white px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                  ATS 98%
                </span>
              </div>

              {/* Resume Image Content */}
              <div className="relative w-full h-[calc(100%-36px)] overflow-hidden bg-white">
                <img
                  src={img.src}
                  alt={img.title}
                  loading={offset === 0 ? "eager" : "lazy"}
                  fetchPriority={offset === 0 ? "high" : "low"}
                  decoding="async"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                />

                {/* Light Glass Overlay for inactive cards */}
                {offset !== 0 && (
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] transition-opacity duration-300 group-hover:bg-transparent" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Card Title & Indicator Controls - Matched Landing Page Styling */}
      <div className="flex flex-col items-center gap-3.5 mt-6 z-40">
        
        {/* Template Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f7f7f5] border border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-[#111111]">
            {RESUME_IMAGES[activeIndex].title}
          </span>
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#12A394] text-white shadow-xs">
            {RESUME_IMAGES[activeIndex].tag}
          </span>
        </div>

        {/* Matched Dot Indicators */}
        <div className="flex items-center gap-2">
          {RESUME_IMAGES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === index
                  ? "w-8 bg-[#12A394] shadow-[0_2px_8px_rgba(18,163,148,0.35)]"
                  : "w-2.5 bg-black/15 hover:bg-black/30"
              }`}
              aria-label={`Go to resume template ${index + 1}`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
