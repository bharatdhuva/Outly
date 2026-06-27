import { useState, useEffect } from "react";
import resume1 from "@/assets/resumes/resume1-new-cc0bcdce041648c15d73b9fc27ecf990.webp";
import resume3 from "@/assets/resumes/resume3-new-cd7a7bdb4cf26a77378e6065605060bd.webp";
import resume4 from "@/assets/resumes/resume4-new-aacf952518a31b05c87e4eab5a9c0c26.webp";

const RESUME_IMAGES = [
  { id: 1, src: resume1, alt: "Professional ATS Resume Template 1" },
  { id: 2, src: resume3, alt: "Executive Resume Layout Template 2" },
  { id: 3, src: resume4, alt: "Modern Tech SDE Resume Template 3" },
];

export default function ResumeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % RESUME_IMAGES.length);
    }, 2500); // Auto rotates every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-[460px] sm:h-[540px] max-w-[440px] mx-auto select-none overflow-visible">
      
      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Stacked Cards Deck Container */}
      <div className="relative w-full h-[380px] sm:h-[460px] flex items-center justify-center">
        {RESUME_IMAGES.map((img, index) => {
          // Calculate relative stack offset position
          const total = RESUME_IMAGES.length;
          const offset = (index - activeIndex + total) % total;

          // Compute card stack styles based on offset
          let zIndex = 10;
          let transform = "";
          let opacity = 1;
          let filter = "";

          if (offset === 0) {
            // Front / Active Card
            zIndex = 30;
            transform = "translateY(0px) scale(1) rotate(0deg)";
            opacity = 1;
            filter = "drop-shadow(0 20px 30px rgba(0,0,0,0.15))";
          } else if (offset === 1) {
            // Second Card in Deck
            zIndex = 20;
            transform = "translateY(18px) scale(0.93) rotate(4deg)";
            opacity = 0.82;
            filter = "drop-shadow(0 10px 20px rgba(0,0,0,0.1))";
          } else {
            // Third / Background Card
            zIndex = 10;
            transform = "translateY(34px) scale(0.86) rotate(-4deg)";
            opacity = 0.55;
            filter = "drop-shadow(0 5px 10px rgba(0,0,0,0.05))";
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
              className="absolute w-[85%] sm:w-[90%] max-w-[340px] aspect-[1/1.41] rounded-2xl overflow-hidden border border-white/80 bg-white cursor-pointer transition-all duration-700 ease-out hover:scale-[1.02] group"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
              />

              {/* Glass Overlays for inactive cards */}
              {offset !== 0 && (
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] transition-opacity duration-300 group-hover:bg-transparent" />
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Small Dot Indicators */}
      <div className="flex items-center gap-2 mt-6 z-40">
        {RESUME_IMAGES.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === index
                ? "w-7 bg-primary shadow-sm"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            }`}
            aria-label={`Go to resume slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
