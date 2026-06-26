import { useEffect } from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OverviewPage() {
  const navigate = useNavigate();

  // Load Google Font: Rubik dynamically for this page
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(link);
    
    // Set page title
    document.title = "Enhancv — Check Your Resume ATS Score";

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="flex-1 w-full min-h-screen font-['Rubik',sans-serif] text-[#0f172a] select-none relative pb-12">
      
      {/* Self-contained Keyframe Animations & Glowing Background styles */}
      <style>{`
        @keyframes float-google-react {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes float-tesla-react {
          0%, 100% { transform: translateY(0) rotate(1deg); }
          50% { transform: translateY(6px) rotate(-1deg); }
        }
        @keyframes float-ai-react {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        .animate-google-float {
          animation: float-google-react 4s ease-in-out infinite;
        }
        .animate-tesla-float {
          animation: float-tesla-react 4.5s ease-in-out infinite;
        }
        .animate-ai-float {
          animation: float-ai-react 5s ease-in-out infinite;
        }

        .glowing-bg-mesh {
          background: 
            radial-gradient(circle at 80% 100%, rgba(25, 204, 149, 0.16), transparent 45%),
            radial-gradient(circle at 40% 100%, rgba(89, 37, 220, 0.12), transparent 50%),
            #faf8f5;
        }
      `}</style>

      {/* Main Container */}
      <div className="glowing-bg-mesh min-h-screen w-full absolute inset-0 -z-10" />

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
        
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-6 text-left space-y-8 flex flex-col justify-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#0f172a] leading-[1.12] tracking-tight">
              Check your resume <span class="text-[#5925dc]">ATS score</span> & land more interviews
            </h1>
            <p className="text-[#64748b] text-base sm:text-lg leading-relaxed max-w-xl font-medium mt-4">
              ATS Check, AI Writer, and One-Click Job Tailoring make your resume stand out to recruiters.
            </p>
          </div>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-lg mt-8">
            <button 
              onClick={() => navigate("/resume-tailor")}
              className="bg-[#19cc95] hover:bg-[#15b383] text-white text-sm font-extrabold tracking-wide px-8 py-4 rounded-lg shadow-md hover:scale-[1.02] active:scale-[0.98] transition duration-200"
            >
              Build Your Resume
            </button>
            
            <button 
              onClick={() => navigate("/ats-score")}
              className="bg-white border-2 border-[#0f172a] text-[#0f172a] text-sm font-extrabold tracking-wide px-8 py-4 rounded-lg hover:bg-[#0f172a] hover:text-white transition duration-200"
            >
              Get Your Resume Score
            </button>
          </div>

          {/* Reviews and Social Proof */}
          <div className="flex flex-wrap items-center gap-6 mt-10">
            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex items-center text-[#19cc95]">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xs font-extrabold text-[#64748b] tracking-tight">5,287 Reviews</span>
            </div>

            {/* Speech Bubble Stats */}
            <div className="flex items-center gap-2 bg-[#faf8f5]/80 border border-[#e2e8f0] rounded-xl px-4 py-2 shadow-sm">
              <span className="text-sm">💬</span>
              <span className="text-xs font-bold text-[#0f172a]/80">
                <strong className="text-[#0f172a]">28,452 users</strong> landed interviews last month
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Overlapping Floating Graphics */}
        <div className="lg:col-span-6 relative w-full h-[540px] flex items-center justify-center">
          
          {/* Card 1: The Under-Card (ATS Check Report) */}
          <div className="absolute left-[2%] top-[12%] w-[290px] bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] text-left z-10">
            <div className="flex items-center justify-between mb-4">
              <span class="text-[10px] font-extrabold text-[#0f172a]/35 uppercase tracking-widest">ATS Check</span>
              <span class="text-[10px] font-extrabold bg-[#19cc95]/10 text-[#19cc95] px-2 py-0.5 rounded">Scanned</span>
            </div>
            
            {/* Score Circular Progress Bar */}
            <div className="flex items-center gap-4 border-b border-[#e2e8f0] pb-4 mb-4">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="22" className="stroke-gray-100 fill-none" stroke-width="4.5" />
                  <circle cx="28" cy="28" r="22" class="stroke-[#19cc95] fill-none" stroke-width="4.5" stroke-dasharray="138" stroke-dashoffset="21" strokeLinecap="round" />
                </svg>
                <span className="absolute text-xs font-black text-[#0f172a]">85%</span>
              </div>
              <div>
                <span className="block text-[11px] font-extrabold text-[#0f172a]">Overall Match</span>
                <span className="block text-[9px] text-[#64748b] mt-0.5">High parser compatibility</span>
              </div>
            </div>

            {/* Job Description Label */}
            <div className="space-y-1.5 mb-4">
              <span className="text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider block">Job Description</span>
              <span className="inline-block text-[10px] font-bold border border-[#e2e8f0] bg-[#faf8f5] px-2.5 py-1 rounded-md text-[#0f172a]/75">
                Strategic Accounts Manager
              </span>
            </div>

            {/* Resume Tailoring lists */}
            <div className="space-y-3 pt-2 border-t border-[#e2e8f0]">
              <span className="text-[9px] font-extrabold text-[#64748b] uppercase tracking-widest block">Resume Tailoring</span>
              
              {/* Hard Skills list */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-[#5925dc] uppercase tracking-wider block">• Hard Skills</span>
                <div className="space-y-1 text-[9px] font-semibold text-[#0f172a]/70">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#10b981] font-bold">✓</span>
                    <span>Facilitated enterprise growth</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#ef4444] font-bold">
                    <span>✗</span>
                    <span>User engagement metrics</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#ef4444] font-bold">
                    <span>✗</span>
                    <span>Reporting & pipeline dashboards</span>
                  </div>
                </div>
              </div>
              
              {/* Soft Skills list */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-[#19cc95] uppercase tracking-wider block">• Soft Skills</span>
                <div className="space-y-1 text-[9px] font-semibold text-[#0f172a]/70">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#10b981] font-bold">✓</span>
                    <span>Collaborative leadership</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: The Top-Card (Ethan Smith Premium Resume Sheet) */}
          <div className="absolute right-[2%] top-[4%] w-[350px] bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_25px_60px_rgba(15,23,42,0.08)] text-left z-20 overflow-visible pt-8">
            
            {/* Center-Aligned Avatar overlapping top edge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-[#fcfbf7] shadow-md flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-9 h-9 text-[#0f172a]/70">
                <circle cx="50" cy="35" r="20" fill="currentColor"/>
                <path d="M15 85c0-15 15-25 35-25s35 10 35 25v5H15v-5Z" fill="currentColor"/>
                <circle cx="41" cy="35" r="9" fill="#faf8f5"/>
                <circle cx="59" cy="35" r="9" fill="#faf8f5"/>
                <rect x="33" y="32" width="34" height="6" rx="2" fill="currentColor"/>
              </svg>
            </div>
            
            {/* Center-Aligned Profile Header */}
            <div className="text-center mt-2 border-b border-[#e2e8f0] pb-3 mb-3">
              <h4 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wide">Ethan Smith</h4>
              <span className="block text-[8px] font-bold text-[#64748b] leading-tight mt-1">
                Chief Experience Officer | Customer-Centric Strategies | Digital Transformation
              </span>
            </div>

            {/* Resume Summary */}
            <div className="space-y-1 mb-3">
              <span className="text-[7.5px] font-black text-[#19cc95] uppercase tracking-widest block">Summary</span>
              <p className="text-[7.5px] font-medium text-[#64748b] leading-normal">
                Over 10 years in customer experience management, leading cross-functional teams to build outreach tunnels. Proven track record of improving NPS by 35% through design-led execution.
              </p>
            </div>

            {/* Resume Experience */}
            <div className="space-y-2 mb-3">
              <span className="text-[7.5px] font-black text-[#19cc95] uppercase tracking-widest block">Experience</span>
              <div className="space-y-1">
                <div className="flex justify-between text-[7px] font-bold text-[#0f172a]">
                  <span>Chief Experience Officer</span>
                  <span className="text-[#64748b]">2022 - Present</span>
                </div>
                <span className="block text-[6.5px] font-semibold text-[#64748b] mt-[-2px]">TechWorld Solutions • Indianapolis</span>
                <p className="text-[7px] text-[#0f172a]/70 leading-normal mt-1">
                  • Spearheaded customer journey mappings, increasing conversions by 25%.
                </p>
                <p className="text-[7px] text-[#0f172a]/70 leading-normal">
                  • Conducted data analysis, reducing customer churn rates by 15%.
                </p>
              </div>
            </div>

            {/* Resume Languages & Education */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e2e8f0]">
              <div>
                <span className="text-[7.5px] font-black text-[#19cc95] uppercase tracking-widest block">Languages</span>
                <span className="block text-[7px] font-bold text-[#0f172a] mt-1">English <span className="text-[#64748b] font-medium">(Native)</span></span>
                <span className="block text-[7px] font-bold text-[#0f172a] mt-0.5">Spanish <span class="text-[#64748b] font-medium">(Fluent)</span></span>
              </div>
              <div>
                <span className="text-[7.5px] font-black text-[#19cc95] uppercase tracking-widest block">Education</span>
                <span class="block text-[7px] font-bold text-[#0f172a] mt-1 leading-tight">Master of Business Admin</span>
                <span className="block text-[6.5px] text-[#64748b]">Indiana University</span>
              </div>
            </div>

            {/* FLOATING AI ASSISTANT WIDGET (Purple Card) */}
            <div className="absolute -right-8 bottom-[16%] w-[180px] bg-[#5925dc] rounded-xl p-3 shadow-2xl text-left border border-white/20 animate-ai-float z-30 text-white">
              <div className="flex items-center gap-1 mb-2 border-b border-white/10 pb-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-200 flex items-center gap-1">
                  <span className="text-[10px]">✦</span> AI Assistant
                </span>
              </div>
              <div className="space-y-1.5 text-[7.5px] font-bold">
                <button 
                  onClick={() => navigate("/resume-tailor")}
                  className="w-full text-left bg-white/10 hover:bg-white/15 rounded px-2.5 py-1.5 transition flex items-center justify-between"
                >
                  <span>Generate Skills from Job</span>
                  <span className="opacity-65">→</span>
                </button>
                <button 
                  onClick={() => navigate("/resume-tailor")}
                  className="w-full text-left bg-white/10 hover:bg-white/15 rounded px-2.5 py-1.5 transition flex items-center justify-between"
                >
                  <span>Inspire Me</span>
                  <span className="opacity-65">→</span>
                </button>
              </div>
              <div className="mt-2.5 bg-white/10 border border-white/10 rounded px-2 py-1 text-[7px] text-white/50">
                Enter a custom request...
              </div>
            </div>

          </div>

          {/* Google Badge (Purple) - Floats outer right */}
          <div className="absolute -right-4 top-[4%] bg-[#5925dc] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-30 border border-white/20 animate-google-float">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span>Application at Google</span>
          </div>

          {/* Tesla Badge (Dark) - Floats bottom left */}
          <div className="absolute left-[20%] bottom-[8%] bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-30 border border-white/10 animate-tesla-float">
            <span class="w-1.5 h-1.5 rounded-full bg-[#19cc95]"></span>
            <span>Application at Tesla</span>
          </div>

        </div>

      </div>
    </div>
  );
}
