import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTransition } from "../components/PageTransition";
import gsap from "gsap";
import confetti from "canvas-confetti";
import logoTransparent from "../assets/brand/logo_transparent.png";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// ─── TYPES & DATA STRUCTURES ───

interface EmailThread {
  id: "priya" | "atlas" | "openai";
  from: string;
  subject: string;
  time: string;
  body: string;
  bullets: string[];
  badge: string;
  badgeStyle: string;
  suggestions: string[];
  drafts: Record<number, string>;
}

interface PDFCard {
  id: string;
  filename: string;
  meta: string;
  status: string;
}

const initialEmails: Record<"priya" | "atlas" | "openai", EmailThread> = {
  priya: {
    id: "priya",
    from: "Priya Nair • to you, Sam — thread of 9",
    subject: "Contract renewal — need your sign-off by Friday",
    time: "8:42 AM",
    body: "Hi Maya, following up on the renewal terms we discussed last week. Legal already approved the redlines on Tuesday, so nothing is blocking. Can we get your sign-off today so we stay ahead of schedule? Let me know.",
    bullets: [
      "Renewal terms updated: 12-month term at the same rate, net-30 billing.",
      "Legal already approved the redlines on Tuesday — nothing is blocking."
    ],
    badge: "NEEDS REPLY",
    badgeStyle: "text-[8px] font-bold bg-outly-accent/10 text-outly-accent px-1.5 py-0.5 rounded shrink-0",
    suggestions: [
      "Looks good — signing today",
      "One question first",
      "Loop in Finance"
    ],
    drafts: {
      1: "Hi Priya, the 12-month terms look excellent and the net-30 billing is completely fine. I've signed the renewal agreement via DocuSign today. Looking forward to our continued partnership!",
      2: "Hi Priya, thanks for the update. Quick question on the net-30 terms — does this cover the March invoices as well, or will they be processed under the previous terms? Let me know, thanks!",
      3: "Hi Sam, forwarding this contract thread. Could you review the net-30 billing terms one final time from the finance perspective? If it looks good, I'll proceed with sign-off today. Thanks!"
    }
  },
  atlas: {
    id: "atlas",
    from: "Sam Lee • to you, Accounts — thread of 2",
    subject: "Invoice #2041 — March retainer",
    time: "8:15 AM",
    body: "Hi Maya, please find attached the invoice #2041 for the March retainer deliverables. Work has been delivered in full, matching our contract milestones. Let me know if everything looks correct for payment scheduling.",
    bullets: [
      "Retainer invoice amount: $2,500.00 USD.",
      "Deliverables verified: UI redesign and layout specifications completed in full.",
      "Due date: Net-15 terms (April 23, 2026)."
    ],
    badge: "INVOICE",
    badgeStyle: "text-[8px] font-bold bg-outly-dark/10 text-outly-dark/50 px-1.5 py-0.5 rounded shrink-0",
    suggestions: [
      "Approve & Schedule Payment",
      "Flag for internal review",
      "Ask for invoice PDF copy"
    ],
    drafts: {
      1: "Hi Sam, thanks for sending over the invoice. I've reviewed the March deliverables and everything matches our milestones. I have approved the payment and scheduled it for processing.",
      2: "Hi Sam, I noticed a slight mismatch in the milestone billing description on page 2. Let's do a quick sync tomorrow morning to clarify before I submit this for processing. Thanks!",
      3: "Hi Accounts Team, Sam's March deliverables are complete. Please process invoice #2041 under our standard retainers schedule. Let me know if you need additional documents."
    }
  },
  openai: {
    id: "openai",
    from: "Sarah (OpenAI Recruit) • to you — thread of 1",
    subject: "Product Lead role follow-up",
    time: "Yesterday",
    body: "Hi Maya, our team loved your portfolio and your contributions to design system architectures. We'd love to schedule a 30-minute introductory chat with our engineering manager, Sarah, to discuss the Product Lead opportunity. What does your availability look like this Friday?",
    bullets: [
      "OpenAI recruiter viewed your tailored resume and wants to schedule a chat.",
      "Role focus: Design systems, layout architecture, and user-facing dashboards.",
      "Key talking points generated: your recent Next.js system optimization work."
    ],
    badge: "READY",
    badgeStyle: "text-[8px] font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded shrink-0",
    suggestions: [
      "Available Friday at 10 AM",
      "Request details on team structure",
      "Confirm slot & send cheat-sheet"
    ],
    drafts: {
      1: "Hi Sarah, thank you for reaching out! I'm thrilled to hear the team enjoyed my portfolio. I'm available this Friday at 10:00 AM CET for an introductory chat. Looking forward to connecting!",
      2: "Hi Sarah, I would love to connect. Before our call, could you share a bit more context about the specific team structure under the Product Lead role? Looking forward to it!",
      3: "Hi Sarah, Friday at 2:00 PM works perfectly. I've confirmed the calendar invite. Looking forward to discussing design system architectures with you and the team!"
    }
  }
};

const weeklyPosts: Record<string, string> = {
  mon: "Draft: Re-writing my targeted outreach engine today. Found a way to scrape verified hiring emails in under 3 seconds using Node.js and REST APIs. #buildinpublic",
  tue: "Draft: Why are 95% of cold outreach emails ignored? No personalization. Adding real-time ATS keyword optimization to my resume builders. #careers",
  wed: "Draft: Quick performance optimization tip: Redesigned the landing page to load Google Fonts asynchronously. Reduced layout shift significantly. #webdev",
  thu: "Draft: Just integrated a custom weekly post scheduler into the Outly career suite. Keeping my professional brand active on autopilot. #automation",
  fri: "Draft: Just automated my targeted engineer manager outreach campaigns with Outly. 12 managers contacted at Stripe on autopilot. Excited for followups!",
  sat: "Draft: Weekly project review: Generated 3 tailored resume variants for target roles. Average ATS score is now 92%. Focus works. #careerautomation",
  sun: "Draft: Taking Sunday to plan next week's cold emails. Autopilot queue is set up and ready to launch. Tomorrow morning could feel different."
};

const vaultRoles = {
  spotify: {
    title: "Product Designer",
    meta: "Spotify • Stockholm / Remote",
    score: 98,
    analysis: "You match their requirement for Figma variables perfectly. Highlighting your recent Design System work at Stripe would be optimal.",
    keywords: ["Figma Variables", "Component Architectures", "Interactive States", "Prototyping Library"]
  },
  notion: {
    title: "Brand Lead",
    meta: "Notion • San Francisco",
    score: 72,
    analysis: "Your background matches writing guidelines, but the resume lacks experience in community-led growth strategies.",
    keywords: ["Brand Strategy", "Community Marketing", "Copywriting Systems", "Growth Metrics"]
  },
  stripe: {
    title: "Systems Engineer",
    meta: "Stripe • Dublin",
    score: 85,
    analysis: "Strong Node/TS core, but could emphasize distributed networks, API reliability rates, and payload packaging.",
    keywords: ["REST APIs", "API Gateway", "Distributed Networks", "Payload Structuring"]
  }
};

const pricingMatrix = {
  INR: {
    symbol: "₹",
    free: "₹0",
    freeMeta: "forever — you only pay your AI provider",
    pro: "₹1",
    proSlashed: "₹99",
    proDuration: "start 7-day trial"
  },
  USD: {
    symbol: "$",
    free: "$0",
    freeMeta: "forever — you only pay your AI provider",
    pro: "$0.99",
    proSlashed: "$4.99",
    proDuration: "one-time payment"
  }
};

interface SearchJob {
  id: string;
  company: string;
  title: string;
  score: number;
  location: string;
  description: string;
}

const MOCK_SEARCH_JOBS: SearchJob[] = [
  {
    id: "netflix",
    company: "Netflix",
    title: "Senior UI Engineer",
    score: 95,
    location: "Los Gatos / Remote",
    description: "Design modular design systems, focus on performance, dynamic layouts, and web interfaces."
  },
  {
    id: "airbnb",
    company: "Airbnb",
    title: "Staff Product Designer",
    score: 92,
    location: "San Francisco / Remote",
    description: "Lead user experience design for host platform, design system architecture, and prototyping."
  },
  {
    id: "vercel",
    company: "Vercel",
    title: "Developer Relations Engineer",
    score: 91,
    location: "Remote",
    description: "Empower developers with beautiful web development patterns, write guides, and speak to community."
  },
  {
    id: "linear",
    company: "Linear",
    title: "Software Engineer",
    score: 94,
    location: "Remote",
    description: "Build the future of software development tracking tools. Heavy focus on performance and keyboard shortcuts."
  },
  {
    id: "google",
    company: "Google",
    title: "Frontend Engineer",
    score: 88,
    location: "Mountain View",
    description: "Develop and maintain accessible user-facing dashboard systems and next-generation cloud panels."
  },
  {
    id: "uber",
    company: "Uber",
    title: "Product Engineer",
    score: 87,
    location: "Seattle",
    description: "Design real-time driver dispatcher interfaces and web systems to optimize dispatcher workflow."
  }
];

export default function Landing() {
  // ─── REFS FOR ANIMATIONS ───
  const cardBriefRef = useRef<HTMLDivElement>(null);
  const cardCalRef = useRef<HTMLDivElement>(null);
  const cardDraftRef = useRef<HTMLDivElement>(null);
  const cardMeetingRef = useRef<HTMLDivElement>(null);
  const cardNudgeRef = useRef<HTMLDivElement>(null);
  const paperPlaneRef = useRef<SVGSVGElement>(null);
  const navigateTo = usePageTransition();

  // ─── STATE MANAGEMENT ───
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("outly_token"));
  }, []);

  const [scrolled, setScrolled] = useState(false);
  const [visibleCards, setVisibleCards] = useState(false);
  const featuresGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCards(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (featuresGridRef.current) {
      observer.observe(featuresGridRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const [heroTypedText, setHeroTypedText] = useState("");
  const [heroCursor, setHeroCursor] = useState(true);
  const [mobileInboxView, setMobileInboxView] = useState<"list" | "detail">("list");

  // Dragging/offsets state for hero elements
  const [offsets, setOffsets] = useState({
    brief: { x: 0, y: 0 },
    cal: { x: 0, y: 0 },
    meeting: { x: 0, y: 0 },
    draft: { x: 0, y: 0 },
    nudge: { x: 0, y: 0 },
  });
  const [draggingCard, setDraggingCard] = useState<string | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, cardKey: keyof typeof offsets) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDraggingCard(cardKey);
    
    const startX = clientX - offsets[cardKey].x;
    const startY = clientY - offsets[cardKey].y;
    
    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      setOffsets(prev => ({
        ...prev,
        [cardKey]: {
          x: currentX - startX,
          y: currentY - startY
        }
      }));
    };
    
    const handleDragEnd = () => {
      setDraggingCard(null);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('touchend', handleDragEnd);
  };

  // Rich-text highlight parser for the hero typing brief (Outly career-centric highlights)
  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    return text.split(/(3 active applications|Spotify interview|outreach draft)/g).map((part, index) => {
      if (part === "3 active applications" || part === "Spotify interview" || part === "outreach draft") {
        return (
          <span key={index} className="bg-outly-accent/10 text-outly-accent px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Knowledge Hub state
  const [infoTab, setInfoTab] = useState<"about" | "features" | "why-us">("about");

  // Job Tracker state
  const [selectedTrackerJob, setSelectedTrackerJob] = useState<string>("spotify");
  const [jobsSubTab, setJobsSubTab] = useState<"tracker" | "search">("tracker");
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobTrackerData, setJobTrackerData] = useState<Record<string, Array<{ id: string, company: string, title: string, score: number, location: string }>>>({
    applied: [
      { id: "notion", company: "Notion", title: "Brand Lead", score: 72, location: "San Francisco" },
      { id: "figma", company: "Figma", title: "Product Designer", score: 91, location: "Remote" }
    ],
    interviewing: [
      { id: "spotify", company: "Spotify", title: "Product Designer", score: 98, location: "Stockholm" },
      { id: "stripe", company: "Stripe", title: "Systems Engineer", score: 85, location: "Dublin" }
    ],
    offer: [
      { id: "openai", company: "OpenAI", title: "Product Lead", score: 96, location: "San Francisco" }
    ]
  });

  // Vault/ATS state
  const [currentVaultRole, setCurrentVaultRole] = useState<"spotify" | "notion" | "stripe">("spotify");
  const [atsMatchScore, setAtsMatchScore] = useState(98);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorLogs, setTailorLogs] = useState<string[]>([]);
  const [tailoredPDFs, setTailoredPDFs] = useState<PDFCard[]>([
    { id: "1", filename: "spotify_variant_optimized.pdf", meta: "Created April 8 • 98% Match", status: "READY" }
  ]);
  const [tailorSuccess, setTailorSuccess] = useState(false);

  // Pricing state
  const [billingDuration, setBillingDuration] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // 3 days in milliseconds: 3 * 24 * 60 * 60 * 1000 = 259200000 ms
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    
    // Check if target date is already in localStorage
    let targetTime = localStorage.getItem("outly_launch_offer_target");
    
    if (!targetTime) {
      const newTarget = Date.now() + THREE_DAYS_MS;
      localStorage.setItem("outly_launch_offer_target", newTarget.toString());
      targetTime = newTarget.toString();
    }

    const targetDate = parseInt(targetTime, 10);

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        // If expired, restart to keep the offer active in the demo
        const newTarget = Date.now() + THREE_DAYS_MS;
        localStorage.setItem("outly_launch_offer_target", newTarget.toString());
        setTimeLeft("3d 00h 00m 00s");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, "0");

      setTimeLeft(`${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const togglePricingDuration = () => {
    setBillingDuration(prev => prev === "monthly" ? "yearly" : "monthly");
  };

  const changePricingCurrency = (curr: "INR" | "USD") => {
    setCurrency(curr);
  };

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 95; // Account for the sticky header height + safety padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      // Update hash without browser jumping
      window.history.pushState(null, "", `#${sectionId}`);
    }
  };

  // Chart data state
  const [chartData, setChartData] = useState([
    { name: "Wk 1", sent: 12, replies: 2 },
    { name: "Wk 2", sent: 19, replies: 5 },
    { name: "Wk 3", sent: 26, replies: 8 },
    { name: "Wk 4", sent: 32, replies: 9 },
    { name: "Wk 5", font: "Inter", sent: 40, replies: 12 },
    { name: "Wk 6", sent: 48, replies: 14 }
  ]);

  // ─── SCROLL & LOAD EFFECTS ───
  useEffect(() => {
    // Load Google Font: Rubik dynamically for the landing page
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(link);

    document.title = "Outly - Your Career, Already Sorted";
    
    // Scroll header styling
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Hero loading entrance animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });
    tl.fromTo(".hero-tag", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0.2)
      .fromTo(".hero-title", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, 0.4)
      .fromTo(".hero-subtitle", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0.6)
      .fromTo(".hero-buttons", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0.8)
      .fromTo(".hero-meta", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 1.0)
      .fromTo(cardNudgeRef.current, { opacity: 0, y: 30, rotation: 0 }, { opacity: 1, y: 0, rotation: 1, duration: 1 }, 1.0)
      .fromTo(cardBriefRef.current, { opacity: 0, y: 30, rotation: 0 }, { opacity: 1, y: 0, rotation: -1, duration: 1 }, 1.1)
      .fromTo(cardCalRef.current, { opacity: 0, y: 30, rotation: 0 }, { opacity: 1, y: 0, rotation: 2, duration: 1 }, 1.2)
      .fromTo(cardMeetingRef.current, { opacity: 0, y: 30, rotation: 0 }, { opacity: 1, y: 0, rotation: -1, duration: 1 }, 1.3)
      .fromTo(cardDraftRef.current, { opacity: 0, y: 30, rotation: 0 }, { opacity: 1, y: 0, rotation: -2, duration: 1 }, 1.4);

    // Continuous floating orbits
    gsap.to(cardNudgeRef.current, {
      y: -6,
      rotation: 0.5,
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.1
    });

    gsap.to(cardBriefRef.current, {
      y: -12,
      rotation: -0.5,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.5
    });

    gsap.to(cardCalRef.current, {
      y: 10,
      rotation: 3,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.2
    });

    gsap.to(cardMeetingRef.current, {
      y: 6,
      rotation: 1,
      duration: 4.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.4
    });

    gsap.to(cardDraftRef.current, {
      y: -8,
      rotation: -3.5,
      duration: 3.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.8
    });

    let isCancelled = false;
    
    // Clear and reset state on mount to avoid HMR overlaps
    setHeroTypedText("");
    
    const targetText = "3 active applications. Spotify interview scheduled. Recruiter outreach draft ready.";
    let typeIndex = 0;
    let typeTimer: NodeJS.Timeout;

    const typeNextChar = () => {
      if (isCancelled) return;
      if (typeIndex < targetText.length) {
        setHeroTypedText(targetText.slice(0, typeIndex + 1));
        typeIndex++;
        typeTimer = setTimeout(typeNextChar, 30 + Math.random() * 15);
      } else {
        setHeroCursor(false); // Hide cursor when typing is complete
      }
    };

    const startTypingTimer = setTimeout(typeNextChar, 1500);

    return () => {
      isCancelled = true;
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(startTypingTimer);
      clearTimeout(typeTimer);
      document.head.removeChild(link);
    };
  }, []);

  // ─── SHOWCASE INTERACTION HANDLERS ───

  // Tab switching
  const handleTabSwitch = (tab: "brief" | "inbox" | "calendar" | "vault") => {
    if (activeTab === tab) return;
    
    const panel = document.getElementById("showcase-panel-wrapper");
    if (panel) {
      gsap.to(panel, {
        opacity: 0,
        y: 10,
        duration: 0.15,
        onComplete: () => {
          setActiveTab(tab);
          gsap.fromTo(panel, 
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
          );
        }
      });
    } else {
      setActiveTab(tab);
    }
  };

  // Inbox: select email
  const handleSelectEmail = (emailId: "priya" | "atlas" | "openai") => {
    setMobileInboxView("detail");
    if (activeEmailId === emailId || isTyping) return;
    
    const detail = document.getElementById("inbox-detail-container");
    if (detail) {
      gsap.to(detail, {
        opacity: 0,
        x: 15,
        duration: 0.15,
        onComplete: () => {
          setActiveEmailId(emailId);
          setAutopilotDraftActive(false);
          setAutopilotTypedText("");
          gsap.fromTo(detail,
            { opacity: 0, x: -15 },
            { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" }
          );
        }
      });
    } else {
      setActiveEmailId(emailId);
      setAutopilotDraftActive(false);
      setAutopilotTypedText("");
    }
  };

  // Inbox: trigger reply composer typing
  const handleTriggerReply = (suggestionIndex: number) => {
    if (isTyping) return;

    const email = emails[activeEmailId];
    if (!email) return;
    
    const draftText = email.drafts[suggestionIndex];
    
    setAutopilotDraftActive(true);
    setAutopilotTypedText("");
    setIsTyping(true);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < draftText.length) {
        setAutopilotTypedText((prev) => prev + draftText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15 + Math.random() * 10);
  };

  // Inbox: discard draft
  const handleDiscardDraft = () => {
    if (isTyping) return;
    setAutopilotDraftActive(false);
    setAutopilotTypedText("");
  };

  // Inbox: send draft
  const handleSendDraft = () => {
    if (isTyping) return;

    const plane = paperPlaneRef.current;
    if (plane) {
      gsap.to(plane, {
        x: 40,
        y: -40,
        opacity: 0,
        scale: 0.5,
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => {
          // Confetti explosion
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ["#f23c5d", "#1a1a1a", "#e8e2d5"]
          });

          // Animate thread list item removal
          const targetEl = document.getElementById(`inbox-thread-item-${activeEmailId}`);
          if (targetEl) {
            gsap.to(targetEl, {
              height: 0,
              opacity: 0,
              padding: 0,
              borderWidth: 0,
              duration: 0.4,
              ease: "power2.inOut",
              onComplete: () => {
                // Update badge and sent metrics
                setInboxBadgeCount((prev) => Math.max(0, prev - 1));
                setTotalMailsSent((prev) => {
                  const nextVal = prev + 1;
                  // Update chart data with the new point
                  setChartData((prevData) => {
                    const nextData = [...prevData];
                    nextData[nextData.length - 1] = {
                      ...nextData[nextData.length - 1],
                      sent: nextVal
                    };
                    return nextData;
                  });
                  return nextVal;
                });

                // Remove thread from state
                setEmails((prev) => {
                  const updated = { ...prev };
                  delete updated[activeEmailId];
                  
                  // Pick next remaining thread
                  const remainingKeys = Object.keys(updated) as Array<"priya" | "atlas" | "openai">;
                  if (remainingKeys.length > 0) {
                    setActiveEmailId(remainingKeys[0]);
                  }
                  return updated;
                });

                setAutopilotDraftActive(false);
                setAutopilotTypedText("");
              }
            });
          }
          
          // Reset plane
          gsap.set(plane, { x: 0, y: 0, opacity: 1, scale: 1, delay: 0.5 });
        }
      });
    }
  };

  // Job Tracker: Move a job application card to the next stage
  const handleMoveJobStage = (jobId: string, currentStage: "applied" | "interviewing" | "offer") => {
    const jobList = jobTrackerData[currentStage];
    const job = jobList.find(j => j.id === jobId);
    if (!job) return;

    let nextStage: "applied" | "interviewing" | "offer" | null = null;
    if (currentStage === "applied") nextStage = "interviewing";
    else if (currentStage === "interviewing") nextStage = "offer";

    if (!nextStage) return;

    setJobTrackerData(prev => {
      const updatedCurrent = prev[currentStage].filter(j => j.id !== jobId);
      const updatedNext = [...prev[nextStage], job];
      return {
        ...prev,
        [currentStage]: updatedCurrent,
        [nextStage]: updatedNext
      };
    });

    if (nextStage === "offer") {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#19cc95", "#5925dc"]
      });
    }
  };

  // Job Search: Add a job to the tracker under Applied column
  const handleAddJobToTracker = (job: SearchJob) => {
    // Check if already exists to avoid duplicates
    const allJobs = [
      ...jobTrackerData.applied,
      ...jobTrackerData.interviewing,
      ...jobTrackerData.offer
    ];
    if (allJobs.some(j => j.id === job.id)) {
      setJobsSubTab("tracker");
      setSelectedTrackerJob(job.id);
      return;
    }

    setJobTrackerData(prev => ({
      ...prev,
      applied: [
        ...prev.applied,
        {
          id: job.id,
          company: job.company,
          title: job.title,
          score: job.score,
          location: job.location.split(" / ")[0]
        }
      ]
    }));

    setSelectedTrackerJob(job.id);
    setJobsSubTab("tracker");

    // Burst confetti for delight!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#19cc95", "#5925dc"]
    });
  };

  // Kanban Drag and Drop Event Handlers
  const handleDragStartKanban = (e: React.DragEvent, jobId: string, sourceStage: "applied" | "interviewing" | "offer") => {
    e.dataTransfer.setData("jobId", jobId);
    e.dataTransfer.setData("sourceStage", sourceStage);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropKanban = (e: React.DragEvent, targetStage: "applied" | "interviewing" | "offer") => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    const sourceStage = e.dataTransfer.getData("sourceStage") as "applied" | "interviewing" | "offer";
    
    if (!jobId || !sourceStage || sourceStage === targetStage) return;

    // Find the job in the source stage
    const job = jobTrackerData[sourceStage].find(j => j.id === jobId);
    if (!job) return;

    // Move the job state
    setJobTrackerData(prev => {
      const updatedSource = prev[sourceStage].filter(j => j.id !== jobId);
      const updatedTarget = [...prev[targetStage], job];
      return {
        ...prev,
        [sourceStage]: updatedSource,
        [targetStage]: updatedTarget
      };
    });

    setSelectedTrackerJob(jobId);

    // Burst confetti if moved to Offers stage
    if (targetStage === "offer") {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#19cc95", "#5925dc"]
      });
    }
  };

  // Vault: change role
  const handleVaultRoleChange = (roleId: "spotify" | "notion" | "stripe") => {
    setCurrentVaultRole(roleId);
    setAtsMatchScore(vaultRoles[roleId].score);
    setIsTailoring(false);
    setTailorLogs([]);
    setTailorSuccess(false);
  };

  // Vault: run AI tailor sequence
  const handleRunTailor = () => {
    if (isTailoring) return;

    setIsTailoring(true);
    setTailorLogs([]);
    setTailorSuccess(false);

    const logs = [
      "Analyzing target description criteria...",
      "Identifying core skill gaps in resume text...",
      `Injecting keyword: "${vaultRoles[currentVaultRole].keywords[0]}"...`,
      `Injecting keyword: "${vaultRoles[currentVaultRole].keywords[1]}"...`,
      `Injecting keyword: "${vaultRoles[currentVaultRole].keywords[2]}"...`,
      "Optimizing bullet structures for ATS scoring...",
      "Compiling clean optimized PDF structure..."
    ];

    let logIndex = 0;
    const timer = setInterval(() => {
      if (logIndex < logs.length) {
        setTailorLogs((prev) => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(timer);
        setAtsMatchScore(99); // Increase score on success
        setTailorSuccess(true);
        setIsTailoring(false);

        // Burst confetti
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { x: 0.5, y: 0.6 },
          colors: ["#f23c5d", "#1a1a1a"]
        });

        // Add new document card
        const newCard: PDFCard = {
          id: Date.now().toString(),
          filename: `${currentVaultRole}_optimized_v2.pdf`,
          meta: `Created just now • 99% Match`,
          status: "READY"
        };
        setTailoredPDFs((prev) => [newCard, ...prev]);
      }
    }, 400);
  };

  // Pricing: display data calculations
  const priceData = pricingMatrix[currency];

  return (
    <div className="bg-outly-cream text-outly-dark font-['Rubik',sans-serif] selection:bg-outly-accent/20 min-h-screen">
      
      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-outly-cream/80 backdrop-blur-md border-b border-outly-border shadow-soft py-4" 
          : "bg-outly-cream/40 backdrop-blur-sm border-b border-outly-border/30 py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-3 items-center">
          
          {/* Left: Logo */}
          <div className="flex justify-start">
            <div className="flex items-center gap-1 font-bold text-xl sm:text-2xl tracking-tight cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <img src={logoTransparent} alt="Outly Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <span className="text-outly-logo">Outly</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center justify-center gap-8 font-schibsted text-[17px] font-medium text-[#4E4638]">
            <a className="hover:text-outly-dark transition cursor-pointer" href="#features" onClick={(e) => handleScrollToSection(e, "features")}>Features</a>
            <a className="hover:text-outly-dark transition cursor-pointer" href="#demo" onClick={(e) => handleScrollToSection(e, "demo")}>How it Works</a>
            <a className="hover:text-outly-dark transition cursor-pointer" href="#pricing" onClick={(e) => handleScrollToSection(e, "pricing")}>Pricing</a>
          </nav>
          
          {/* Right: Buttons */}
          <div className="flex items-center justify-end gap-2 sm:gap-4">
            <button onClick={() => navigateTo(isLoggedIn ? "/onboarding" : "/login")} className="border border-outly-border px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-sans text-[13px] sm:text-[16px] font-medium text-outly-dark hover:bg-outly-border/20 hover:border-outly-dark/40 active:scale-[0.98] transition-all duration-200 text-center cursor-pointer">
              {isLoggedIn ? "Dashboard" : "Sign in"}
            </button>
          </div>
          
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative overflow-hidden pt-24 sm:pt-32 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Hero Text */}
          <div className="md:col-span-6 z-10 hero-text-container">
            <div className="flex items-center gap-4 mb-4 sm:mb-8 hero-tag opacity-0 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase select-none">
              <span className="text-outly-accent flex items-center gap-2">
                <span className="w-6 h-0.5 bg-outly-accent"></span>
                Careers + Automation + AI
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-[72px] font-medium tracking-tight mb-5 sm:mb-8 leading-[1.05] text-left hero-title opacity-0">
              Your career,<br />already <span className="relative inline-block italic-serif text-outly-accent">
                sorted.
                {/* Hand-drawn animated underline SVG */}
                <svg className="absolute left-0 -bottom-2 sm:-bottom-4 w-full h-[10px] sm:h-[14px] overflow-visible" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
                  <path 
                    d="M 4 9 Q 50 3 100 8 T 196 7" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="7" 
                    strokeLinecap="round"
                    className="animate-drawline"
                  />
                </svg>
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-outly-dark/60 mb-6 sm:mb-10 max-w-full sm:max-w-lg text-left leading-relaxed font-medium hero-subtitle opacity-0">
              Outly automates your job hunt so you don't have to. Personalized outreach, resume tailoring, and interview prep in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 justify-start hero-buttons opacity-0">
              <button onClick={() => navigateTo(isLoggedIn ? "/onboarding" : "/login")} className="w-full sm:w-auto bg-outly-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-sans text-[14px] sm:text-[16px] font-medium hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-outly-accent/25 cursor-pointer">
                {isLoggedIn ? "Go to Dashboard" : "Get started — it's free"}
              </button>
              <button onClick={() => navigateTo(isLoggedIn ? "/onboarding" : "/login")} className="w-full sm:w-auto bg-white border border-outly-border hover:border-outly-dark/40 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-sans text-[14px] sm:text-[16px] font-medium hover:bg-outly-dark/5 active:scale-[0.98] transition-all duration-200 cursor-pointer">
                {isLoggedIn ? "Dashboard" : "Sign in"}
              </button>
            </div>

            <div className="mb-6 block md:hidden rounded-2xl sm:rounded-3xl border border-outly-border bg-white/95 p-4 sm:p-5 shadow-lg shadow-outly-accent/10 text-outly-dark">
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                Outly keeps mobile lean: one quick brief, simple recruiter updates, and fast draft-ready follow-ups without bulky dashboards.
              </p>
            </div>

            <p className="text-[10px] sm:text-[11px] font-medium text-outly-dark/40 text-left hero-meta opacity-0">
              ✓ Free, because your data is our key. No card needed.
            </p>
          </div>

          {/* Right Column: Interactive Floating Cards */}
          <div className="hidden md:flex md:col-span-6 relative h-auto sm:h-[360px] md:h-[520px] w-full flex items-center justify-center z-10 select-none">
            
            {/* Concentric Orbits Background */}
            <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none overflow-hidden z-0">
              <div className="w-[280px] h-[280px] rounded-full border border-outly-dark/5 absolute"></div>
              <div className="w-[440px] h-[440px] rounded-full border border-outly-dark/5 absolute"></div>
              <div className="w-[600px] h-[600px] rounded-full border border-outly-dark/5 absolute"></div>
              <div className="w-[760px] h-[760px] rounded-full border border-outly-dark/5 absolute"></div>
            </div>

            {/* Draggable Parent for Nudge Card */}
            <div 
              className="absolute z-40 cursor-grab hidden sm:block"
              style={{
                left: "15%",
                top: "-2%",
                transform: `translate3d(${offsets.nudge.x}px, ${offsets.nudge.y}px, 0)`,
                transition: draggingCard === 'nudge' ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseDown={(e) => handleDragStart(e, 'nudge')}
              onTouchStart={(e) => handleDragStart(e, 'nudge')}
            >
              <div 
                ref={cardNudgeRef}
                className={`bg-outly-dark text-white rounded-full px-5 py-2.5 flex items-center gap-3 shadow-lg select-none transition-shadow duration-300 border border-white/10 ${
                  draggingCard === 'nudge' ? 'cursor-grabbing shadow-2xl scale-[1.02]' : ''
                }`}
              >
                <span className="text-amber-400 text-sm">🔔</span>
                <span className="text-[11px] font-semibold tracking-wide">
                  Nudge: <span className="text-white/80">Stripe recruiter replied — reply before Friday</span>
                </span>
              </div>
            </div>



            {/* Draggable Parent for Calendar Card */}
            <div 
              className="absolute z-10 cursor-grab hidden sm:block"
              style={{
                right: "5%",
                top: "5%",
                transform: `translate3d(${offsets.cal.x}px, ${offsets.cal.y}px, 0)`,
                transition: draggingCard === 'cal' ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseDown={(e) => handleDragStart(e, 'cal')}
              onTouchStart={(e) => handleDragStart(e, 'cal')}
            >
              <div 
                ref={cardCalRef} 
                className={`w-56 bg-white rounded-xl shadow-lg border border-outly-border p-4 transform rotate-2 select-none transition-shadow duration-300 ${
                  draggingCard === 'cal' ? 'cursor-grabbing shadow-2xl scale-[1.02]' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-3 text-[9px] font-bold text-outly-dark/30 tracking-widest uppercase">
                  <span>April</span>
                  <span>2026</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[9px] text-center font-bold">
                  <div className="text-outly-dark/20">M</div><div className="text-outly-dark/20">T</div><div className="text-outly-dark/20">W</div><div className="text-outly-dark/20">T</div><div className="text-outly-dark/20">F</div><div className="text-outly-dark/20">S</div><div className="text-outly-dark/20">S</div>
                  <div className="py-0.5">6</div>
                  <div className="py-0.5">7</div>
                  <div className="bg-outly-accent text-white rounded-full w-4 h-4 flex items-center justify-center mx-auto py-0.5">8</div>
                  <div className="py-0.5">9</div>
                  <div className="py-0.5">10</div>
                  <div className="py-0.5">11</div>
                  <div className="py-0.5">12</div>
                </div>
              </div>
            </div>

            {/* Draggable Parent for 1:1 Meeting Card */}
            <div 
              className="absolute z-30 cursor-grab hidden sm:block"
              style={{
                right: "2%",
                top: "45%",
                transform: `translate3d(${offsets.meeting.x}px, ${offsets.meeting.y}px, 0)`,
                transition: draggingCard === 'meeting' ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseDown={(e) => handleDragStart(e, 'meeting')}
              onTouchStart={(e) => handleDragStart(e, 'meeting')}
            >
              <div 
                ref={cardMeetingRef}
                className={`w-[220px] bg-white rounded-xl shadow-md border-l-4 border-teal-500 border border-outly-border p-3.5 transform -rotate-1 select-none transition-shadow duration-300 ${
                  draggingCard === 'meeting' ? 'cursor-grabbing shadow-2xl scale-[1.02]' : ''
                }`}
              >
                <div className="text-xs font-bold text-outly-dark">Stripe Interview</div>
                <div className="text-[10px] font-semibold text-outly-dark/50 mt-1">Scheduled for 2:30 PM — calendar synced</div>
              </div>
            </div>

            {/* Draggable Parent for Draft Card */}
            <div 
              className="absolute z-25 cursor-grab hidden sm:block"
              style={{
                left: "8%",
                bottom: "10%",
                transform: `translate3d(${offsets.draft.x}px, ${offsets.draft.y}px, 0)`,
                transition: draggingCard === 'draft' ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseDown={(e) => handleDragStart(e, 'draft')}
              onTouchStart={(e) => handleDragStart(e, 'draft')}
            >
              <div 
                ref={cardDraftRef} 
                className={`w-64 bg-white rounded-xl shadow-md border border-outly-border p-4 transform rotate-1 select-none transition-shadow duration-300 ${
                  draggingCard === 'draft' ? 'cursor-grabbing shadow-2xl scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-outly-accent">+ Draft Ready</span>
                </div>
                <p className="text-[10px] font-semibold text-outly-dark/70 italic leading-relaxed">
                  "Hi Sarah — thanks for reaching out, I'd love to discuss the Engineer role at Stripe..."
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>



      {/* WHY OUTLY - INTERACTIVE KNOWLEDGE HUB */}
      <section id="why-outly" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center">
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
          <div className="h-px w-8 bg-outly-accent"></div>
          <div className="text-outly-accent font-bold text-[9px] sm:text-[10px] tracking-[0.3em] uppercase">KNOWLEDGE HUB</div>
          <div className="h-px w-8 bg-outly-accent"></div>
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-7xl font-medium tracking-tight mb-4 sm:mb-10 leading-[1.05] text-outly-dark">
          Everything you need to know<br />about <span className="italic-serif text-outly-accent">Outly.</span>
        </h2>
        <p className="text-outly-dark/50 text-xs sm:text-base md:text-lg mb-8 sm:mb-16 max-w-2xl mx-auto font-medium leading-relaxed">
          Outly is a privacy-first, zero-setup dashboard designed to streamline your professional journey, keep your search organized, and help you land your next role faster.
        </p>

        {/* Interactive Tabs Header */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 border-b border-outly-border pb-3 max-w-lg mx-auto">
          <button
            onClick={() => setInfoTab("about")}
            className={`text-xs sm:text-sm font-bold pb-2 px-4 transition-all relative ${
              infoTab === "about" ? "text-outly-accent" : "text-outly-dark/40 hover:text-outly-dark"
            }`}
          >
            What is Outly?
            {infoTab === "about" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-outly-accent rounded-full animate-fade-in"></div>
            )}
          </button>
          <button
            onClick={() => setInfoTab("features")}
            className={`text-xs sm:text-sm font-bold pb-2 px-4 transition-all relative ${
              infoTab === "features" ? "text-outly-accent" : "text-outly-dark/40 hover:text-outly-dark"
            }`}
          >
            Core Features
            {infoTab === "features" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-outly-accent rounded-full animate-fade-in"></div>
            )}
          </button>
          <button
            onClick={() => setInfoTab("why-us")}
            className={`text-xs sm:text-sm font-bold pb-2 px-4 transition-all relative ${
              infoTab === "why-us" ? "text-outly-accent" : "text-outly-dark/40 hover:text-outly-dark"
            }`}
          >
            Why Choose Us?
            {infoTab === "why-us" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-outly-accent rounded-full animate-fade-in"></div>
            )}
          </button>
        </div>

        {/* Interactive Content Area */}
        <div className="max-w-4xl mx-auto min-h-[350px]">
          {infoTab === "about" && (
            <div className="grid md:grid-cols-2 gap-8 items-center text-left animate-fade-in">
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-outly-dark tracking-tight">
                  Your complete professional <span className="italic-serif text-outly-accent font-normal">command center.</span>
                </h3>
                <p className="text-xs sm:text-sm text-outly-dark/70 leading-relaxed font-medium">
                  Outly is built for professionals who want to take control of their career growth. Instead of juggling spreadsheets, email threads, and multiple resume versions, Outly aggregates everything into a single, beautifully designed dashboard.
                </p>
                <p className="text-xs sm:text-sm text-outly-dark/70 leading-relaxed font-medium">
                  We believe that job searching shouldn't feel like a second full-time job. By bringing structure, clarity, and organization to your daily outreach, Outly lets you focus on what really matters: preparing for interviews and doing great work.
                </p>
              </div>
              <div className="bg-outly-cream/40 rounded-3xl p-6 sm:p-10 border border-outly-border shadow-soft space-y-4 flex flex-col justify-center">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-outly-accent/10 flex items-center justify-center text-outly-accent shrink-0 select-none">🛡️</div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-outly-dark">100% Private & Secure</h5>
                    <p className="text-[10px] sm:text-xs text-outly-dark/50 leading-relaxed mt-1">Your data is stored locally or securely in your private cloud. We never sell your personal information or resume data.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-outly-accent/10 flex items-center justify-center text-outly-accent shrink-0 select-none">⚡</div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-outly-dark">Zero Configuration</h5>
                    <p className="text-[10px] sm:text-xs text-outly-dark/50 leading-relaxed mt-1">No complicated setup. Just upload your master resume and start managing your applications instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {infoTab === "features" && (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-left animate-fade-in">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-outly-accent/10 flex items-center justify-center text-outly-accent mb-4 select-none">📊</div>
                  <h4 className="font-bold text-sm sm:text-base text-outly-dark mb-2">Application Tracker</h4>
                  <p className="text-[11px] sm:text-xs text-outly-dark/50 leading-relaxed">
                    A visual Kanban board to track your job applications from applied to interviewing to offer stage.
                  </p>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-outly-accent/10 flex items-center justify-center text-outly-accent mb-4 select-none">📁</div>
                  <h4 className="font-bold text-sm sm:text-base text-outly-dark mb-2">Resume Vault</h4>
                  <p className="text-[11px] sm:text-xs text-outly-dark/50 leading-relaxed">
                    Store your master resume and manage all tailored variants in one secure, accessible repository.
                  </p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-outly-accent/10 flex items-center justify-center text-outly-accent mb-4 select-none">✉️</div>
                  <h4 className="font-bold text-sm sm:text-base text-outly-dark mb-2">Outreach Manager</h4>
                  <p className="text-[11px] sm:text-xs text-outly-dark/50 leading-relaxed">
                    Organize your recruiter conversations, track follow-ups, and make sure you never miss a reply.
                  </p>
                </div>
              </div>
              {/* Feature 4 */}
              <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-outly-accent/10 flex items-center justify-center text-outly-accent mb-4 select-none">📝</div>
                  <h4 className="font-bold text-sm sm:text-base text-outly-dark mb-2">ATS Analysis</h4>
                  <p className="text-[11px] sm:text-xs text-outly-dark/50 leading-relaxed">
                    Analyze job descriptions to see how well your profile matches, with actionable tips to optimize it.
                  </p>
                </div>
              </div>
              {/* Feature 5 */}
              <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-outly-accent/10 flex items-center justify-center text-outly-accent mb-4 select-none">📅</div>
                  <h4 className="font-bold text-sm sm:text-base text-outly-dark mb-2">Content Scheduler</h4>
                  <p className="text-[11px] sm:text-xs text-outly-dark/50 leading-relaxed">
                    Build your professional brand by scheduling posts for LinkedIn and Twitter directly from your dashboard.
                  </p>
                </div>
              </div>
              {/* Feature 6 */}
              <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-outly-accent/10 flex items-center justify-center text-outly-accent mb-4 select-none">🔍</div>
                  <h4 className="font-bold text-sm sm:text-base text-outly-dark mb-2">Smart Search</h4>
                  <p className="text-[11px] sm:text-xs text-outly-dark/50 leading-relaxed">
                    Filter and find jobs across multiple platforms based on your exact skills and experience level.
                  </p>
                </div>
              </div>
            </div>
          )}

          {infoTab === "why-us" && (
            <div className="grid md:grid-cols-2 gap-8 text-left animate-fade-in">
              <div className="bg-white rounded-3xl border border-outly-border p-6 sm:p-8 shadow-soft flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-[9px] font-bold text-outly-accent uppercase tracking-widest block">THE OUTLY DIFFERENCE</span>
                  <h4 className="text-xl sm:text-2xl font-bold text-outly-dark tracking-tight">
                    Built for <span className="italic-serif text-outly-accent font-normal">privacy,</span> not data harvesting.
                  </h4>
                  <p className="text-xs sm:text-sm text-outly-dark/60 leading-relaxed font-medium">
                    Most career platforms make money by selling your resume data to recruiters or third parties. Outly is different. Your workspace belongs entirely to you. We charge a flat, transparent fee for our cloud features, ensuring our incentives align with your success.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 select-none font-bold">✓</div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-outly-dark">No Ads or Spam</h5>
                    <p className="text-[10px] sm:text-xs text-outly-dark/50 leading-relaxed mt-1">A clean, distraction-free interface focused purely on your productivity.</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 select-none font-bold">✓</div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-outly-dark">Lightning Fast Performance</h5>
                    <p className="text-[10px] sm:text-xs text-outly-dark/50 leading-relaxed mt-1">Optimized React architecture designed for instant transitions and smooth animations.</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-outly-border p-5 shadow-soft flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 select-none font-bold">✓</div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-outly-dark">Active Support</h5>
                    <p className="text-[10px] sm:text-xs text-outly-dark/50 leading-relaxed mt-1">Direct access to our support team to resolve any queries or custom feature requests.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FEATURE GRID */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="h-px w-8 bg-outly-accent"></div>
          <div className="text-outly-accent font-bold text-[9px] sm:text-[10px] tracking-[0.3em] uppercase">FEATURES</div>
        </div>
        <div className="mb-10 sm:mb-20">
          <h2 className="text-3xl sm:text-6xl md:text-7xl font-medium tracking-tight leading-[1] text-outly-dark">
            Less searching.<br /><span className="italic-serif text-outly-accent">More actual work.</span>
          </h2>
        </div>
        <div ref={featuresGridRef} className="grid md:grid-cols-3 gap-4 sm:gap-8 mb-4 sm:mb-8">
          
          {/* Card 1 */}
          <div className={`bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-outly-border shadow-soft flex flex-col items-start group cursor-pointer transform transition-all duration-700 ease-out delay-100 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl ${visibleCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-full h-28 sm:h-40 bg-outly-cream/50 rounded-xl sm:rounded-2xl mb-6 sm:mb-10 flex items-center justify-center border border-outly-border/50 overflow-hidden">
              <div className="flex flex-col gap-3 w-2/3">
                <div className="h-1 w-full bg-outly-accent/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-outly-accent/40 rounded-full transition-all duration-1000 ${visibleCards ? 'w-full' : 'w-0'} group-hover:w-full`}></div>
                </div>
                <div className="h-1 w-5/6 bg-outly-accent/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-outly-accent/40 rounded-full transition-all duration-1000 delay-100 ${visibleCards ? 'w-5/6' : 'w-0'} group-hover:w-5/6`}></div>
                </div>
                <div className="h-1 w-full bg-outly-accent/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-outly-accent/40 rounded-full transition-all duration-1000 delay-200 ${visibleCards ? 'w-full' : 'w-0'} group-hover:w-full`}></div>
                </div>
                <div className="flex gap-2 items-center mt-2">
                  <div className={`w-4 h-4 rounded-full bg-outly-accent/20 transition-transform duration-500 ${visibleCards ? 'scale-110' : ''} group-hover:scale-125`}></div>
                  <div className="h-1 w-12 bg-outly-accent/20 rounded-full"></div>
                </div>
              </div>
            </div>
            <h4 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-4 tracking-tight transition-colors ${visibleCards ? 'text-outly-accent' : ''} group-hover:text-outly-accent`}>Smart Outreach</h4>
            <p className="text-outly-dark/50 leading-relaxed text-xs sm:text-sm font-medium">Outly identifies the best recruiters and drafts personalized messages that sound exactly like you.</p>
          </div>

          {/* Card 2 */}
          <div className={`bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-outly-border shadow-soft flex flex-col items-start group cursor-pointer transform transition-all duration-700 ease-out delay-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl ${visibleCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-full h-28 sm:h-40 bg-outly-cream/50 rounded-xl sm:rounded-2xl mb-6 sm:mb-10 flex items-center justify-center border border-outly-border/50">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full border-2 border-outly-accent/20 flex items-center justify-center transition-transform duration-700 ${visibleCards ? 'rotate-180 scale-105' : ''} group-hover:rotate-180 group-hover:scale-110`}>
                  <div className="w-6 h-6 rounded-full bg-outly-accent/20"></div>
                </div>
                <div className={`absolute -top-2 -right-2 w-4 h-4 bg-outly-accent rounded-full border-2 border-white transition-transform duration-500 ${visibleCards ? 'scale-125 animate-pulse' : ''} group-hover:scale-150`}></div>
              </div>
            </div>
            <h4 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-4 tracking-tight transition-colors ${visibleCards ? 'text-outly-accent' : ''} group-hover:text-outly-accent`}>ATS Scoring</h4>
            <p className="text-outly-dark/50 leading-relaxed text-xs sm:text-sm font-medium">Every job application is instantly scored against your profile with tips to hit 95%+ every time.</p>
          </div>

          {/* Card 3 */}
          <div className={`bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-outly-border shadow-soft flex flex-col items-start group cursor-pointer transform transition-all duration-700 ease-out delay-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl ${visibleCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-full h-28 sm:h-40 bg-outly-cream/50 rounded-xl sm:rounded-2xl mb-6 sm:mb-10 flex items-center justify-center border border-outly-border/50">
              <div className={`w-16 h-20 bg-white border border-outly-border rounded shadow-sm relative p-2 transition-transform duration-500 ${visibleCards ? 'scale-105 -rotate-2 shadow-md' : ''} group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-lg`}>
                <div className="h-1 w-full bg-outly-dark/10 rounded mb-1"></div>
                <div className="h-1 w-2/3 bg-outly-dark/10 rounded mb-4"></div>
                <div className="h-4 w-full bg-outly-accent/10 rounded overflow-hidden">
                  <div className={`h-full bg-outly-accent/30 rounded transition-all duration-1000 delay-300 ${visibleCards ? 'w-full' : 'w-0'} group-hover:w-full`}></div>
                </div>
              </div>
            </div>
            <h4 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-4 tracking-tight transition-colors ${visibleCards ? 'text-outly-accent' : ''} group-hover:text-outly-accent`}>Resume Vault</h4>
            <p className="text-outly-dark/50 leading-relaxed text-xs sm:text-sm font-medium">Outly auto-generates tailored resume versions for every single application, saved and ready to send.</p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className="mb-12 sm:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="h-px w-8 bg-outly-accent"></div>
              <div className="text-outly-accent font-bold text-[9px] sm:text-[10px] tracking-[0.3em] uppercase">PRICING</div>
            </div>
            <h2 className="text-3xl sm:text-6xl md:text-8xl font-medium tracking-tight mb-4 sm:mb-10 leading-[0.95]">
              Free <span className="italic-serif text-outly-accent">by nature.</span><br />
              Paid <span className="italic-serif text-outly-accent">for convenience.</span>
            </h2>
            <p className="text-outly-dark/50 text-base sm:text-xl max-w-2xl leading-relaxed font-medium">
              Outly is built around a simple idea: the tool is free. Your data is our key, so it always stays private and secure — or let us handle the cloud setup and pay one calm price.
            </p>
          </div>
          
          {/* Pricing Switcher Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 bg-white border border-outly-border p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-soft shrink-0">
            
            {/* Currency switcher */}
            <div className="flex items-center gap-2 select-none">
              <span className="text-xs font-bold text-outly-dark/40">Currency:</span>
              <div className="flex bg-outly-cream border border-outly-border rounded-lg p-0.5">
                <button
                  className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all ${
                    currency === "INR" ? "bg-white text-outly-dark shadow-sm" : "text-outly-dark/40"
                  }`}
                  onClick={() => changePricingCurrency("INR")}
                >
                  INR (₹)
                </button>
                <button
                  className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all ${
                    currency === "USD" ? "bg-white text-outly-dark shadow-sm" : "text-outly-dark/40"
                  }`}
                  onClick={() => changePricingCurrency("USD")}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-stretch">
          
          {/* Outly Free Card */}
          <div className="bg-white rounded-[24px] sm:rounded-[48px] p-6 sm:p-12 md:p-16 shadow-soft border border-outly-border flex flex-col hover:border-outly-accent/20 transition-all duration-500">
            <div className="mb-6 sm:mb-10">
              <span className="bg-outly-dark/5 text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-widest text-outly-dark/50">YOUR DATA IS OUR KEY</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-medium mb-3 sm:mb-6 tracking-tight">Outly Free</h3>
            <p className="text-xs sm:text-[13px] text-outly-dark/40 font-medium mb-6 sm:mb-12">Complete privacy. Your data stays yours, and is never sold.</p>
            <div className="flex items-baseline gap-2 sm:gap-3 mb-6 sm:mb-12">
              <span className="text-4xl sm:text-7xl font-medium">{priceData.free}</span>
              <span className="text-outly-dark/30 text-xs font-medium">{priceData.freeMeta}</span>
            </div>
            <ul className="space-y-4 sm:space-y-6 mb-8 sm:mb-16 flex-1">
              <li className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-outly-dark/70">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Basic Resume ATS Score checking
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-outly-dark/30 line-through">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-outly-dark/20 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Unlimited resume tailoring &amp; optimization
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-outly-dark/30 line-through">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-outly-dark/20 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Job search, tracking &amp; AI cold mail writing
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-10 select-none">
              <span className="text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-1 bg-outly-cream rounded border border-outly-border text-outly-dark/30 uppercase tracking-widest">OpenAI</span>
              <span className="text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-1 bg-outly-cream rounded border border-outly-border text-outly-dark/30 uppercase tracking-widest">Anthropic</span>
              <span className="text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-1 bg-outly-cream rounded border border-outly-border text-outly-dark/30 uppercase tracking-widest">Google Gemini</span>
              <span className="text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-1 bg-outly-cream rounded border border-outly-border text-outly-dark/30 uppercase tracking-widest">Groq</span>
            </div>
            <button onClick={() => navigateTo("/login")} className="w-full border-2 border-outly-border hover:border-outly-dark/40 py-3.5 sm:py-5 rounded-full font-sans text-[14px] sm:text-[16px] font-medium hover:bg-outly-dark/5 active:scale-[0.98] transition-all duration-200 text-center select-none block cursor-pointer">Start free</button>
          </div>
          
          {/* Outly Cloud Card */}
          <div className="bg-foreground rounded-[24px] sm:rounded-[48px] p-6 sm:p-12 md:p-16 text-white flex flex-col relative overflow-hidden shadow-2xl shadow-outly-accent/10 border border-outly-accent/20 hover:shadow-outly-accent/20 transition-all duration-500">
            <div className="mb-6 sm:mb-10 flex flex-wrap gap-2 items-center">
              <span className="bg-outly-accent text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-widest">SPECIAL LAUNCH OFFER</span>
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3.5 py-1.5 rounded-full tracking-wider font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                <span>{timeLeft || "3d 00h 00m 00s"} LEFT</span>
              </span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-medium mb-3 sm:mb-6 tracking-tight">Outly Cloud</h3>
            <p className="text-xs sm:text-[13px] text-white/40 font-medium mb-6 sm:mb-12">No setup, no hassle. Outly Cloud tuned for speed — it just works.</p>
            <div className="flex items-baseline gap-2 sm:gap-3 mb-6 sm:mb-12">
              <span className="text-4xl sm:text-7xl font-medium">{priceData.pro}</span>
              <span className="text-white/20 text-lg sm:text-xl font-medium line-through leading-none">{priceData.proSlashed}</span>
              <span className="text-white/40 text-xs sm:text-sm font-medium">{priceData.proDuration}</span>
            </div>
            <ul className="space-y-4 sm:space-y-6 mb-8 sm:mb-16 flex-1">
              <li className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-white/90">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-outly-accent shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Unlimited Resume Tailoring &amp; ATS Score Checking
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-white/90">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-outly-accent shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                AI Job Search &amp; Visual Job Tracker
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-white/90">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-outly-accent shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                LinkedIn &amp; Twitter Post Schedulers
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-white/90">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-outly-accent shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                AI Cold Mail Writer &amp; Automations
              </li>
              <li className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-white/90">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-outly-accent shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Get hired faster with AI — 7-day trial @ ₹1/-
              </li>
            </ul>
            <button onClick={() => navigateTo("/login")} className="w-full bg-outly-accent py-3.5 sm:py-5 rounded-full font-sans text-[14px] sm:text-[16px] font-medium hover:brightness-115 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-2xl shadow-outly-accent/35 text-center select-none block cursor-pointer text-white">Get Outly Cloud</button>
          </div>
        </div>
        
        {/* Security Alert Note */}
        <div className="mt-8 sm:mt-16 bg-white rounded-[20px] sm:rounded-[32px] p-5 sm:p-8 max-w-2xl mx-auto flex gap-4 sm:gap-6 items-center border border-outly-border shadow-soft">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#5e7d5e]/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#5e7d5e] shrink-0 border border-[#5e7d5e]/20">
            <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div>
            <h5 className="text-xs sm:text-sm font-bold text-outly-dark mb-1">Your data is our key and stays yours</h5>
            <p className="text-[11px] sm:text-xs text-outly-dark/40 leading-relaxed font-medium">Maintain complete control over your private information. Your data is <span className="text-outly-dark font-bold">fully encrypted and localized before it's stored</span>, and never written to logs or trained on external models.</p>
          </div>
        </div>
        <p className="text-center mt-6 sm:mt-12 text-[9px] sm:text-[10px] font-bold text-outly-dark/30 uppercase tracking-widest">Either way, your email never trains anyone's models. That's a promise, not a setting.</p>
      </section>

      {/* BOTTOM CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center relative">
        <div className="relative inline-block mb-6 sm:mb-12 select-none">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-outly-accent rounded-full mx-auto flex items-center justify-center overflow-hidden">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full mt-3 sm:mt-4"></div>
          </div>
          <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 w-px h-8 sm:h-10 bg-outly-accent/20"></div>
        </div>
        <h2 className="text-4xl sm:text-7xl md:text-[90px] font-medium tracking-tight mb-6 sm:mb-10 leading-[0.9] text-outly-dark">
          Tomorrow morning<br />could feel <span className="italic-serif text-outly-accent">different.</span>
        </h2>
        <p className="text-outly-dark/40 text-base sm:text-lg mb-8 sm:mb-12 leading-relaxed max-w-xl mx-auto font-medium">
          Outly is free to start — sign up and get your first morning brief tomorrow.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button onClick={() => navigateTo("/login")} className="w-full sm:w-auto bg-outly-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-sans text-[14px] sm:text-[16px] font-medium hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-outly-accent/25 cursor-pointer">
            Get started — it's free
          </button>
          <button onClick={() => navigateTo("/login")} className="w-full sm:w-auto bg-white border border-outly-border hover:border-outly-dark/40 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-sans text-[14px] sm:text-[16px] font-medium hover:bg-outly-dark/5 active:scale-[0.98] transition-all duration-200 cursor-pointer">
            Sign in
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-12 border-t border-outly-border/50 font-sans">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Brand Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <img src={logoTransparent} alt="Outly Logo" className="w-6 h-6 object-contain" />
              <span className="text-outly-logo">Outly</span>
            </div>
            <p className="text-[11px] font-medium text-outly-dark/40 mt-1">
              © 2026 Outly. All rights reserved.
            </p>
          </div>

          {/* Developer & Support Contact Links */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-outly-dark/40">
              Developer Contact
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold text-outly-dark/80">
              {/* Email */}
              <a
                href="mailto:bharatdhuva27@gmail.com"
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-outly-dark/5 hover:bg-outly-accent/10 hover:text-outly-accent transition-all group border border-outly-border/40"
              >
                <svg className="w-4 h-4 text-outly-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>bharatdhuva27@gmail.com</span>
              </a>

              {/* Phone */}
              <a
                href="tel:+919624828661"
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-outly-dark/5 hover:bg-outly-accent/10 hover:text-outly-accent transition-all group border border-outly-border/40"
              >
                <svg className="w-4 h-4 text-outly-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91 96248 28661</span>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/bharatdhuva27/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-outly-dark/5 hover:bg-[#0a66c2]/10 hover:text-[#0a66c2] transition-all group border border-outly-border/40"
              >
                <svg className="w-4 h-4 text-[#0a66c2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>LinkedIn</span>
              </a>

              {/* Portfolio */}
              <a
                href="https://bharatdhuva.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-outly-dark/5 hover:bg-outly-accent/10 hover:text-outly-accent transition-all group border border-outly-border/40"
              >
                <svg className="w-4 h-4 text-outly-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                <span>Portfolio</span>
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

// Pricing state and currency transitions are managed locally within the component.
