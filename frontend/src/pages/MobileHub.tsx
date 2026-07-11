import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { 
  ScrollText, 
  Sparkles, 
  Search, 
  Mail, 
  Calendar, 
  ChevronRight, 
  Briefcase,
  FileText
} from "lucide-react";

interface MobileHubProps {
  category: "resumes" | "jobs" | "tools";
}

export default function MobileHub({ category }: MobileHubProps) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set page title
  useEffect(() => {
    const titles = {
      resumes: "Resume Hub",
      jobs: "Jobs Hub",
      tools: "Tools Hub",
    };
    document.title = `Outly - ${titles[category]}`;
  }, [category]);

  // If not on mobile, redirect to default sub-feature
  if (!isMobile) {
    const redirects = {
      resumes: "/resume-vault",
      jobs: "/applications",
      tools: "/cold-mail",
    };
    return <Navigate to={redirects[category]} replace />;
  }

  const categoryDetails = {
    resumes: {
      title: "Resumes Hub",
      subtitle: "Optimize, tailor, and vault your CVs",
      items: [
        {
          title: "ATS Resume Checker",
          description: "Analyze your resume against ATS algorithms to boost your score.",
          path: "/ats-score",
          icon: <ScrollText className="h-6 w-6 text-primary" />,
          bgColor: "bg-primary/10",
        },
        {
          title: "Tailor Resume",
          description: "Tailor your CV for specific job descriptions with AI precision.",
          path: "/resume-tailor",
          icon: <Sparkles className="h-6 w-6 text-amber-500 fill-amber-500/10" />,
          bgColor: "bg-amber-500/10",
        },
        {
          title: "Resume Vault",
          description: "Manage saved resumes, tailored versions, and PDF outputs.",
          path: "/resume-vault",
          icon: <FileText className="h-6 w-6 text-blue-500" />,
          bgColor: "bg-blue-500/10",
        },
      ],
    },
    jobs: {
      title: "Jobs Hub",
      subtitle: "Track applications and search listings",
      items: [
        {
          title: "Job Tracker",
          description: "Organize your applications in a visual Kanban board pipeline.",
          path: "/applications",
          icon: <Briefcase className="h-6 w-6 text-emerald-500" />,
          bgColor: "bg-emerald-500/10",
        },
        {
          title: "Job Search",
          description: "Search across LinkedIn, Naukri, and Wellfound instantly.",
          path: "/job-search",
          icon: <Search className="h-6 w-6 text-indigo-500" />,
          bgColor: "bg-indigo-500/10",
        },
      ],
    },
    tools: {
      title: "Tools Hub",
      subtitle: "Outreach engines and schedulers",
      items: [
        {
          title: "Cold Mail Automation",
          description: "Automate personalized emails and pitches directly to recruiters.",
          path: "/cold-mail",
          icon: <Mail className="h-6 w-6 text-teal-500" />,
          bgColor: "bg-teal-500/10",
        },
        {
          title: "Content Post Scheduler",
          description: "Automate, queue, and schedule your professional posts.",
          path: "/content-scheduler",
          icon: <Calendar className="h-6 w-6 text-rose-500" />,
          bgColor: "bg-rose-500/10",
        },
      ],
    },
  };

  const currentHub = categoryDetails[category];

  return (
    <div className="relative flex-1 min-h-[calc(100vh-8rem)] w-full select-none pb-8 font-sans text-outly-dark animate-fade-in text-left">
      <style>{`
        .glowing-bg-mesh {
          background:
            radial-gradient(circle at 80% 20%, rgba(45, 192, 141, 0.08), transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(89, 37, 220, 0.06), transparent 50%),
            #faf8f5;
        }
      `}</style>
      <div className="glowing-bg-mesh absolute inset-0 -z-10 w-full h-full" />

      <div className="px-6 py-8 space-y-7 max-w-md mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
            {category} hub
          </span>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-none">
            {currentHub.title}
          </h1>
          <p className="text-muted-foreground text-xs leading-relaxed font-medium">
            {currentHub.subtitle}
          </p>
        </div>

        {/* Cards list */}
        <div className="flex flex-col gap-4 pt-2">
          {currentHub.items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-4 rounded-3xl p-4 bg-white border border-[#e8e2d5] hover:border-primary/30 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200 text-left w-full cursor-pointer group"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.bgColor} transition-transform duration-200 group-hover:scale-105`}>
                {item.icon}
              </div>
              <div className="flex-1 pr-2">
                <span className="block text-sm font-extrabold text-outly-dark group-hover:text-primary transition-colors">
                  {item.title}
                </span>
                <span className="block text-[11px] text-muted-foreground mt-1 leading-normal font-medium">
                  {item.description}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/60 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
