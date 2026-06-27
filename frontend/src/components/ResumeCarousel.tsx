import { useState, useEffect } from "react";
import resume1 from "@/assets/resumes/resume1-new-cc0bcdce041648c15d73b9fc27ecf990.webp";
import resume3 from "@/assets/resumes/resume3-new-cd7a7bdb4cf26a77378e6065605060bd.webp";
import resume4 from "@/assets/resumes/resume4-new-aacf952518a31b05c87e4eab5a9c0c26.webp";

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
    <div className="relative flex flex-col items-center justify-center w-full h-[490px] sm:h-[570px] max-w-[460px] mx-auto select-none overflow-visible font-['Rubik',sans-serif]">
      
      {/* Outly #2DC08D Vibrant Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,192,141,0.22),transparent_68%)] rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Stacked Cards Deck Container */}
      <div className="relative w-full h-[400px] sm:h-[480px] flex items-center justify-center">
        {RESUME_IMAGES.map((img, index) => {
          const total = RESUME_IMAGES.length;
          const offset = (index - activeIndex + total) % total;

          let zIndex = 10;
          let transform = "";
          let opacity = 1;
          let filter = "";

          if (offset === 0) {
            // Front / Active Card - Glowing #2DC08D Theme & Elevated Drop Shadow
            zIndex = 30;
            transform = "translateY(0px) scale(1) rotate(0deg)";
            opacity = 1;
            filter = "drop-shadow(0 22px 40px rgba(45,192,141,0.38)) drop-shadow(0 8px 16px rgba(15,23,42,0.06))";
          } else if (offset === 1) {
            // Second Card in Deck
            zIndex = 20;
            transform = "translateY(20px) scale(0.92) rotate(3.5deg)";
            opacity = 0.88;
            filter = "drop-shadow(0 14px 28px rgba(45,192,141,0.2))";
          } else {
            // Third Card in Deck
            zIndex = 10;
            transform = "translateY(38px) scale(0.85) rotate(-3.5deg)";
            opacity = 0.65;
            filter = "drop-shadow(0 8px 16px rgba(45,192,141,0.12))";
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
              className="absolute w-[86%] sm:w-[90%] max-w-[350px] aspect-[1/1.42] rounded-2xl overflow-hidden border-2 border-[#2DC08D] bg-white cursor-pointer transition-all duration-700 ease-out hover:scale-[1.015] group shadow-md"
            >
              {/* Card Header Bar - Full Vibrant #2DC08D Brand Theme */}
              <div className="h-9 w-full bg-[#2DC08D] px-3.5 flex items-center justify-between shrink-0 select-none text-white shadow-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
                
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30 text-[10px] font-bold text-white tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>outly.online/resume</span>
                </div>

                <span className="text-[10px] font-black bg-white text-[#2DC08D] px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                  ATS 98%
                </span>
              </div>

              {/* Resume Image Content */}
              <div className="relative w-full h-[calc(100%-36px)] overflow-hidden bg-white">
                <img
                  src={img.src}
                  alt={img.title}
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

      {/* Active Card Title & Indicator Controls - #2DC08D Matched Styling */}
      <div className="flex flex-col items-center gap-3.5 mt-6 z-40">
        
        {/* Template Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#2DC08D] shadow-sm animate-fade-in">
          <span className="text-xs font-extrabold text-[#2d3639]">
            {RESUME_IMAGES[activeIndex].title}
          </span>
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#2DC08D] text-white shadow-xs">
            {RESUME_IMAGES[activeIndex].tag}
          </span>
        </div>

        {/* Brand Matched Dot Indicators */}
        <div className="flex items-center gap-2">
          {RESUME_IMAGES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === index
                  ? "w-8 bg-[#2DC08D] shadow-[0_2px_10px_rgba(45,192,141,0.5)]"
                  : "w-2.5 bg-[#2DC08D]/25 hover:bg-[#2DC08D]/60"
              }`}
              aria-label={`Go to resume template ${index + 1}`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
