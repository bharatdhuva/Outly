import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import confetti from "canvas-confetti";
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
    monthly: {
      free: "₹0",
      freeMeta: "forever — you only pay your AI provider",
      pro: "₹999",
      proSlashed: "₹1,249",
      proDuration: "per month"
    },
    yearly: {
      free: "₹0",
      freeMeta: "forever — you only pay your AI provider",
      pro: "₹749",
      proSlashed: "₹999",
      proDuration: "per month, billed annually"
    }
  },
  USD: {
    symbol: "$",
    monthly: {
      free: "$0",
      freeMeta: "forever — you only pay your AI provider",
      pro: "$19",
      proSlashed: "$25",
      proDuration: "per month"
    },
    yearly: {
      free: "$0",
      freeMeta: "forever — you only pay your AI provider",
      pro: "$15",
      proSlashed: "$20",
      proDuration: "per month, billed annually"
    }
  }
};

export default function Landing() {
  // ─── REFS FOR ANIMATIONS ───
  const cardBriefRef = useRef<HTMLDivElement>(null);
  const cardCalRef = useRef<HTMLDivElement>(null);
  const cardDraftRef = useRef<HTMLDivElement>(null);
  const cardMeetingRef = useRef<HTMLDivElement>(null);
  const cardNudgeRef = useRef<HTMLDivElement>(null);
  const paperPlaneRef = useRef<SVGSVGElement>(null);

  // ─── STATE MANAGEMENT ───
  const [scrolled, setScrolled] = useState(false);
  const [heroTypedText, setHeroTypedText] = useState("");
  const [heroCursor, setHeroCursor] = useState(true);

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
    return text.split(/(3 applications|interview stage|interview with Stripe|Notion)/g).map((part, index) => {
      if (part === "3 applications" || part === "interview stage" || part === "interview with Stripe" || part === "Notion") {
        return (
          <span key={index} className="bg-outly-accent/10 text-outly-accent px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Showcase state
  const [activeTab, setActiveTab] = useState<"brief" | "inbox" | "calendar" | "vault">("inbox");
  
  // Inbox client state
  const [emails, setEmails] = useState<Record<string, EmailThread>>(initialEmails);
  const [activeEmailId, setActiveEmailId] = useState<"priya" | "atlas" | "openai">("priya");
  const [autopilotDraftActive, setAutopilotDraftActive] = useState(false);
  const [autopilotTypedText, setAutopilotTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [inboxBadgeCount, setInboxBadgeCount] = useState(3);
  const [totalMailsSent, setTotalMailsSent] = useState(48);

  // Scheduler state
  const [activeCalendarDay, setActiveCalendarDay] = useState<string>("wed");
  const [calendarComposerText, setCalendarComposerText] = useState(weeklyPosts.wed);
  const [calendarStatuses, setCalendarStatuses] = useState<Record<string, "SENT" | "DRAFT" | "IDLE">>({
    mon: "SENT",
    tue: "SENT",
    wed: "DRAFT",
    thu: "IDLE",
    fri: "IDLE",
    sat: "IDLE",
    sun: "IDLE"
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

    // Hero typing effect simulation
    const targetText = "3 applications updated — Spotify is in the interview stage. Your interview with Stripe is scheduled for 2:30pm, so your afternoon is clear for prep. I drafted a personalized email for Notion; one tap to send. |";
    let typeIndex = 0;
    let typeTimer: NodeJS.Timeout;

    const typeNextChar = () => {
      if (typeIndex < targetText.length - 1) {
        setHeroTypedText((prev) => prev + targetText.charAt(typeIndex));
        typeIndex++;
        typeTimer = setTimeout(typeNextChar, 35 + Math.random() * 20);
      } else {
        setHeroCursor(true);
      }
    };

    const startTypingTimer = setTimeout(typeNextChar, 1800);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(startTypingTimer);
      clearTimeout(typeTimer);
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

  // Calendar: select day
  const handleSelectCalendarDay = (day: string) => {
    setActiveCalendarDay(day);
    setCalendarComposerText(weeklyPosts[day]);
    
    // Check if we should mark it as draft
    setCalendarStatuses((prev) => {
      const updated = { ...prev };
      if (updated[day] === "IDLE") {
        updated[day] = "DRAFT";
      }
      return updated;
    });
  };

  // Calendar: publish post
  const handlePublishPost = () => {
    confetti({
      particleCount: 40,
      spread: 40,
      origin: { x: 0.8, y: 0.6 },
      colors: ["#f23c5d", "#1a1a1a"]
    });

    setCalendarStatuses((prev) => ({
      ...prev,
      [activeCalendarDay]: "SENT"
    }));
  };

  // Calendar: regenerate draft
  const handleRegeneratePostDraft = () => {
    const originalText = calendarComposerText;
    setCalendarComposerText("Regenerating draft using ZenScale AI...");
    
    setTimeout(() => {
      setCalendarComposerText(originalText + " (Optimized for higher reach by adding #tech trends)");
    }, 600);
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
  const priceData = pricingMatrix[currency][billingDuration];

  return (
    <div className="bg-outly-cream text-outly-dark font-sans selection:bg-outly-accent/20 min-h-screen">
      
      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-outly-cream/80 backdrop-blur-md border-b border-outly-border shadow-soft py-4" 
          : "bg-outly-cream/40 backdrop-blur-sm border-b border-outly-border/30 py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="w-8 h-8 bg-outly-accent rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
              </div>
              Outly <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outly-accent ml-2">Beta</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-outly-dark/70">
              <a className="hover:text-outly-dark transition cursor-pointer" href="#features" onClick={(e) => handleScrollToSection(e, "features")}>Features</a>
              <a className="hover:text-outly-dark transition cursor-pointer" href="#demo" onClick={(e) => handleScrollToSection(e, "demo")}>How it Works</a>
              <a className="hover:text-outly-dark transition cursor-pointer" href="#pricing" onClick={(e) => handleScrollToSection(e, "pricing")}>Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-semibold text-outly-dark/70 hover:text-outly-dark transition">Sign in</Link>
            <Link to="/login" className="bg-outly-dark text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-black transition">Get started</Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative overflow-hidden pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Text */}
          <div className="md:col-span-6 z-10 hero-text-container">
            <div className="flex items-center gap-4 mb-8 hero-tag opacity-0 text-[10px] font-bold tracking-[0.2em] uppercase select-none">
              <span className="text-outly-accent flex items-center gap-2">
                <span className="w-6 h-0.5 bg-outly-accent"></span>
                Careers + Automation + AI
              </span>
              <span className="text-outly-dark/45 bg-outly-dark/5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-normal">
                Now in Beta
              </span>
            </div>
            
            <h1 className="text-6xl md:text-[80px] font-medium tracking-tight mb-8 leading-[0.95] text-left hero-title opacity-0">
              Your career,<br />already <span className="relative inline-block italic-serif text-outly-accent">
                sorted.
                {/* Hand-drawn animated underline SVG */}
                <svg className="absolute left-0 -bottom-4 w-full h-[14px] overflow-visible" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
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
            
            <p className="text-base md:text-lg text-outly-dark/60 mb-10 max-w-lg text-left leading-relaxed font-medium hero-subtitle opacity-0">
              Outly automates your job hunt so you don't have to. Personalized outreach, resume tailoring, and interview prep in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 justify-start hero-buttons opacity-0">
              <Link to="/login" className="bg-outly-accent text-white px-8 py-4 rounded-full font-bold text-base hover:brightness-105 transition shadow-lg shadow-outly-accent/20">
                Get started — it's free
              </Link>
              <Link to="/login" className="bg-white border border-outly-border px-8 py-4 rounded-full font-bold text-base hover:bg-outly-border/30 transition">
                Sign in
              </Link>
            </div>
            
            <p className="text-[11px] font-medium text-outly-dark/40 text-left hero-meta opacity-0">
              ✓ Now in open beta — free with your own API keys. No card needed.
            </p>
          </div>

          {/* Right Column: Interactive Floating Cards */}
          <div className="md:col-span-6 relative h-[520px] w-full flex items-center justify-center z-10 select-none">
            
            {/* Concentric Orbits Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
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

            {/* Draggable Parent for Daily Brief Card */}
            <div 
              className="absolute z-20 cursor-grab"
              style={{
                left: "2%",
                top: "12%",
                transform: `translate3d(${offsets.brief.x}px, ${offsets.brief.y}px, 0)`,
                transition: draggingCard === 'brief' ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseDown={(e) => handleDragStart(e, 'brief')}
              onTouchStart={(e) => handleDragStart(e, 'brief')}
            >
              <div 
                ref={cardBriefRef} 
                className={`w-[360px] sm:w-[380px] bg-white rounded-2xl shadow-xl border border-outly-border p-5 transform -rotate-1 select-none transition-shadow duration-300 ${
                  draggingCard === 'brief' ? 'cursor-grabbing shadow-2xl scale-[1.02]' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-outly-accent/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-outly-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 9.293a1 1 0 01-1.414 0L10 8.414l-2.293 2.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 010 1.414z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-outly-dark/40">Your morning brief</div>
                      <div className="text-[11px] font-bold">Wednesday, April 8 • 7:00 AM</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs md:text-sm font-medium leading-relaxed min-h-[3.5rem] text-outly-dark/80">
                    Good morning, Maya. <span className="text-outly-dark">{renderHighlightedText(heroTypedText)}</span>
                    {heroCursor && <span className="text-outly-accent font-bold animate-pulse">|</span>}
                  </div>
                </div>
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
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-outly-accent"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-outly-accent">Outreach Draft</span>
                </div>
                <p className="text-[10px] font-medium text-outly-dark/60 italic leading-relaxed">
                  "Hi Sarah — thanks for reaching out, I'd love to discuss the Engineer role at Stripe..."
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* FEATURE: THE DAILY BRIEF */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-outly-dark rounded-[48px] p-12 md:p-20 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
          <div className="md:w-1/2 z-10">
            <div className="w-12 h-0.5 bg-[#c5a880] mb-10"></div>
            <p className="text-[10px] font-bold tracking-[0.3em] text-[#c5a880] uppercase mb-8">THE DAILY BRIEF</p>
            <h2 className="text-5xl md:text-6xl text-white font-medium mb-10 leading-[1.05] tracking-tight">
              Open Outly.<br />Read one thing.<br /><span className="italic-serif text-[#c5a880] text-6xl md:text-7xl">Know your whole search.</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-md font-medium">
              Every morning at 7, Outly summarizes your outreach progress, new job matches, and provides interview tips — all in thirty seconds of reading.
            </p>
          </div>
          <div className="md:w-1/2 w-full z-10">
            <div className="bg-white rounded-[32px] p-10 text-outly-dark shadow-2xl border border-outly-border/45">
              <div className="flex justify-between items-baseline mb-10 border-b border-outly-border/50 pb-6">
                <h4 className="font-serif italic text-2xl tracking-tight">Wednesday, April 8</h4>
                <span className="text-[10px] text-outly-dark/40 font-bold tracking-widest uppercase">7:00 AM BRIEF</span>
              </div>
              <div className="space-y-6">
                
                {/* Row 1 */}
                <div className="flex gap-6 items-start group cursor-pointer">
                  <span className="text-xs font-bold text-outly-accent w-20 pt-0.5 shrink-0 text-left transition-transform duration-300 group-hover:translate-x-1">First</span>
                  <p className="text-xs md:text-sm leading-relaxed text-outly-dark/70 transition-colors duration-300 group-hover:text-outly-dark">
                    <span className="font-bold text-outly-dark transition-colors duration-300 group-hover:text-outly-accent">Reply to Stripe</span> — interview scheduling requested by Friday. Outreach draft is ready.
                  </p>
                </div>

                {/* Row 2 */}
                <div className="flex gap-6 items-start group cursor-pointer">
                  <span className="text-xs font-bold text-outly-accent w-20 pt-0.5 shrink-0 text-left transition-transform duration-300 group-hover:translate-x-1">9:30 AM</span>
                  <p className="text-xs md:text-sm leading-relaxed text-outly-dark/70 transition-colors duration-300 group-hover:text-outly-dark">
                    <span className="font-bold text-outly-dark transition-colors duration-300 group-hover:text-outly-accent">Spotify prep</span> — review tailored pitch brief and 3 key talking points.
                  </p>
                </div>

                {/* Row 3 */}
                <div className="flex gap-6 items-start group cursor-pointer">
                  <span className="text-xs font-bold text-outly-accent w-20 pt-0.5 shrink-0 text-left transition-transform duration-300 group-hover:translate-x-1">2:30 PM</span>
                  <p className="text-xs md:text-sm leading-relaxed text-outly-dark/70 transition-colors duration-300 group-hover:text-outly-dark">
                    <span className="font-bold text-outly-dark transition-colors duration-300 group-hover:text-outly-accent">Notion call</span> — recruiter conversation. Calendar invite synced.
                  </p>
                </div>

                {/* Row 4 */}
                <div className="flex gap-6 items-start group cursor-pointer">
                  <span className="text-xs font-bold text-outly-accent w-20 pt-0.5 shrink-0 text-left transition-transform duration-300 group-hover:translate-x-1">Heads up</span>
                  <p className="text-xs md:text-sm leading-relaxed text-outly-dark/70 transition-colors duration-300 group-hover:text-outly-dark">
                    <span className="font-bold text-outly-dark transition-colors duration-300 group-hover:text-outly-accent">OpenAI viewed resume</span> — 96% profile match rating on your tailored variant.
                  </p>
                </div>

                {/* Row 5 */}
                <div className="flex gap-6 items-start group cursor-pointer">
                  <span className="text-xs font-bold text-outly-accent w-20 pt-0.5 shrink-0 text-left transition-transform duration-300 group-hover:translate-x-1">Quiet</span>
                  <p className="text-xs md:text-sm leading-relaxed text-outly-dark/50 transition-colors duration-300 group-hover:text-outly-dark">
                    Your afternoon after 3 is clear. Protected for interview prep.
                  </p>
                </div>

              </div>
            </div>
          </div>
          
          {/* Subtle gold wavy lines matching the ZenScail background theme */}
          <svg className="absolute bottom-0 left-0 w-[400px] h-[200px] text-[#c5a880]/10 pointer-events-none z-0" viewBox="0 0 100 50" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-10 50 C 20 42, 50 48, 110 25" stroke="currentColor" strokeWidth="0.5" fill="none"/>
            <path d="M-10 50 C 30 35, 60 40, 110 15" stroke="currentColor" strokeWidth="0.5" fill="none"/>
          </svg>

          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-outly-accent/5 blur-[120px] rounded-full z-0"></div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="mb-20">
          <h2 className="text-6xl md:text-7xl font-medium tracking-tight leading-[1] text-outly-dark">
            Less searching.<br /><span className="italic-serif text-outly-accent">More actual work.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          
          {/* Card 1 */}
          <div className="bg-white p-10 rounded-3xl border border-outly-border shadow-soft hover:shadow-lg transition-all duration-500 flex flex-col items-start group cursor-pointer">
            <div className="w-full h-40 bg-outly-cream/50 rounded-2xl mb-10 flex items-center justify-center border border-outly-border/50 overflow-hidden">
              <div className="flex flex-col gap-3 w-2/3">
                <div className="h-1 w-full bg-outly-accent/10 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-outly-accent/40 rounded-full transition-all duration-1000 group-hover:w-full"></div>
                </div>
                <div className="h-1 w-5/6 bg-outly-accent/10 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-outly-accent/40 rounded-full transition-all duration-1000 group-hover:w-5/6 delay-100"></div>
                </div>
                <div className="h-1 w-full bg-outly-accent/10 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-outly-accent/40 rounded-full transition-all duration-1000 group-hover:w-full delay-200"></div>
                </div>
                <div className="flex gap-2 items-center mt-2">
                  <div className="w-4 h-4 rounded-full bg-outly-accent/20 transition-transform duration-500 group-hover:scale-125"></div>
                  <div className="h-1 w-12 bg-outly-accent/20 rounded-full"></div>
                </div>
              </div>
            </div>
            <h4 className="text-xl font-bold mb-4 tracking-tight group-hover:text-outly-accent transition-colors">Smart Outreach</h4>
            <p class="text-outly-dark/50 leading-relaxed text-sm font-medium">Outly identifies the best recruiters and drafts personalized messages that sound exactly like you.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-10 rounded-3xl border border-outly-border shadow-soft hover:shadow-lg transition-all duration-500 flex flex-col items-start group cursor-pointer">
            <div className="w-full h-40 bg-outly-cream/50 rounded-2xl mb-10 flex items-center justify-center border border-outly-border/50">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-outly-accent/20 flex items-center justify-center transition-transform duration-500 group-hover:rotate-180">
                  <div className="w-6 h-6 rounded-full bg-outly-accent/20"></div>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-outly-accent rounded-full border-2 border-white transition-transform duration-500 group-hover:scale-150"></div>
              </div>
            </div>
            <h4 className="text-xl font-bold mb-4 tracking-tight group-hover:text-outly-accent transition-colors">ATS Scoring</h4>
            <p className="text-outly-dark/50 leading-relaxed text-sm font-medium">Every job application is instantly scored against your profile with tips to hit 95%+ every time.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-10 rounded-3xl border border-outly-border shadow-soft hover:shadow-lg transition-all duration-500 flex flex-col items-start group cursor-pointer">
            <div className="w-full h-40 bg-outly-cream/50 rounded-2xl mb-10 flex items-center justify-center border border-outly-border/50">
              <div className="w-16 h-20 bg-white border border-outly-border rounded shadow-sm relative p-2 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                <div className="h-1 w-full bg-outly-dark/10 rounded mb-1"></div>
                <div className="h-1 w-2/3 bg-outly-dark/10 rounded mb-4"></div>
                <div className="h-4 w-full bg-outly-accent/10 rounded overflow-hidden">
                  <div className="h-full w-0 bg-outly-accent/30 rounded transition-all duration-1000 group-hover:w-full"></div>
                </div>
              </div>
            </div>
            <h4 className="text-xl font-bold mb-4 tracking-tight group-hover:text-outly-accent transition-colors">Resume Vault</h4>
            <p className="text-outly-dark/50 leading-relaxed text-sm font-medium">Outly auto-generates tailored resume versions for every single application, saved and ready to send.</p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE WORKSPACE SHOWCASE */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="text-outly-accent font-bold text-[10px] tracking-[0.3em] uppercase mb-8">TRY IT RIGHT HERE</div>
        <h2 className="text-6xl md:text-7xl font-medium tracking-tight mb-8 leading-[1]">
          Go on, <span className="italic-serif text-outly-accent">click around.</span>
        </h2>
        <p className="text-outly-dark/50 text-xl mb-20 max-w-2xl mx-auto font-medium">
          This is a living preview of Outly. Manage your daily schedule, customize resumes, and send automated responses on autopilot.
        </p>
        
        {/* Browser Mockup Container */}
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-outly-border text-left max-w-5xl mx-auto">
          
          {/* Browser Header */}
          <div className="bg-outly-cream/40 px-6 py-4 border-b border-outly-border flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-outly-dark/10"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-outly-dark/10"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-outly-dark/10"></div>
            </div>
            <div className="bg-white border border-outly-border rounded-lg px-4 py-1 text-[10px] font-bold text-outly-dark/30 mx-auto select-none">
              outly.com/<span>{activeTab === "brief" ? "dashboard" : activeTab}</span>
            </div>
            <div className="text-[10px] font-bold text-outly-accent flex items-center gap-1.5 select-none">
              <div className="w-1.5 h-1.5 rounded-full bg-outly-accent animate-pulse"></div>
              Interactive Demo
            </div>
          </div>
          
          {/* Workspace Body */}
          <div className="flex flex-col md:flex-row h-[620px] md:h-[550px] overflow-hidden">
            
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-outly-cream/10 border-b md:border-b-0 md:border-r border-outly-border p-6 md:p-8 flex flex-row md:flex-col justify-between shrink-0 overflow-x-auto no-scrollbar">
              <div className="flex flex-row md:flex-col gap-6 md:gap-6 w-full">
                
                {/* Brief Tab Button */}
                <div className={`flex items-center gap-3 text-sm font-bold transition cursor-pointer select-none py-1 ${
                  activeTab === "brief" ? "text-outly-accent" : "text-outly-dark/40 hover:text-outly-dark"
                }`} onClick={() => handleTabSwitch("brief")}>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Daily brief
                </div>
                
                {/* Inbox Tab Button */}
                <div className={`flex items-center justify-between text-sm font-bold transition cursor-pointer select-none py-1 w-full ${
                  activeTab === "inbox" ? "text-outly-accent" : "text-outly-dark/40 hover:text-outly-dark"
                }`} onClick={() => handleTabSwitch("inbox")}>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    Inbox
                  </div>
                  {inboxBadgeCount > 0 && (
                    <span className="bg-outly-accent text-white text-[9px] px-1.5 rounded transition-all duration-300">{inboxBadgeCount}</span>
                  )}
                </div>
                
                {/* Calendar Tab Button */}
                <div className={`flex items-center gap-3 text-sm font-bold transition cursor-pointer select-none py-1 ${
                  activeTab === "calendar" ? "text-outly-accent" : "text-outly-dark/40 hover:text-outly-dark"
                }`} onClick={() => handleTabSwitch("calendar")}>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Calendar
                </div>

                {/* Vault Tab Button */}
                <div className={`flex items-center gap-3 text-sm font-bold transition cursor-pointer select-none py-1 ${
                  activeTab === "vault" ? "text-outly-accent" : "text-outly-dark/40 hover:text-outly-dark"
                }`} onClick={() => handleTabSwitch("vault")}>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  Resume Vault
                </div>
              </div>
              
              <div className="hidden md:block select-none">
                <div className="text-[10px] font-bold text-outly-dark/30 uppercase tracking-widest mb-1">Maya's workspace •</div>
                <div className="text-[10px] font-bold text-outly-dark/30 uppercase tracking-widest">Wednesday, April 8</div>
              </div>
            </div>
            
            {/* View Panel Content */}
            <div id="showcase-panel-wrapper" className="flex-1 overflow-hidden">
              
              {/* TAB 1: DAILY BRIEF */}
              {activeTab === "brief" && (
                <div className="h-full p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                      <h3 class="font-bold text-2xl tracking-tight">Morning Analytics</h3>
                      <p className="text-xs text-outly-dark/40 font-medium">Outreach metrics and match rate summaries.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-outly-border shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outly-dark/60">Live Updates</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl border border-outly-border shadow-soft">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-outly-dark/30 block mb-1">Total Mails</span>
                      <div className="text-2xl font-semibold tracking-tight text-outly-dark">{totalMailsSent}</div>
                      <span className="text-[9px] text-green-600 font-bold">↑ 18%</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-outly-border shadow-soft">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-outly-dark/30 block mb-1">Responses</span>
                      <div className="text-2xl font-semibold tracking-tight text-outly-dark">28.4%</div>
                      <span className="text-[9px] text-outly-accent font-bold">+4.2%</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-outly-border shadow-soft">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-outly-dark/30 block mb-1 font-sans">ATS Score</span>
                      <div className="text-2xl font-semibold tracking-tight text-outly-dark">94.2%</div>
                      <span className="text-[9px] text-green-600 font-bold">✓ Excellent</span>
                    </div>
                  </div>
                  
                  {/* Recharts Graphical Dashboard */}
                  <div className="bg-white p-5 rounded-3xl border border-outly-border shadow-soft flex-1 min-h-[220px] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2 select-none">
                      <span className="text-[10px] font-bold text-outly-dark/60 uppercase tracking-widest">Outreach Performance</span>
                      <span className="text-[9px] font-bold text-outly-dark/30">6-WEEK PERFORMANCE</span>
                    </div>
                    <div className="w-full h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#71717a" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 8, fill: "#71717a" }} axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                          <Line type="monotone" dataKey="sent" stroke="#1a1a1a" strokeWidth={2} dot={{ r: 1 }} activeDot={{ r: 4 }} name="Mails Sent" />
                          <Line type="monotone" dataKey="replies" stroke="#f23c5d" strokeWidth={2} dot={{ r: 1 }} activeDot={{ r: 4 }} name="Replies" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              
              {/* TAB 2: INBOX */}
              {activeTab === "inbox" && (
                <div className="flex h-full overflow-hidden">
                  
                  {/* Thread list */}
                  <div className="w-1/2 md:w-72 border-r border-outly-border flex flex-col h-full bg-white">
                    <div className="p-4 border-b border-outly-border bg-outly-cream/10 flex justify-between items-center shrink-0 select-none">
                      <span className="text-[10px] font-bold text-outly-dark/40 uppercase tracking-wider">All Threads</span>
                      <span className="text-[8px] font-bold text-outly-accent bg-outly-accent/10 px-1.5 py-0.5 rounded">AUTO WATCH</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {Object.values(emails).map((email) => (
                        <div
                          key={email.id}
                          id={`inbox-thread-item-${email.id}`}
                          className={`p-4 border-b border-outly-border cursor-pointer border-l-4 select-none transition-all ${
                            activeEmailId === email.id
                              ? "bg-outly-accent/5 border-l-outly-accent"
                              : "hover:bg-outly-cream/10 border-l-transparent"
                          }`}
                          onClick={() => handleSelectEmail(email.id)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-xs text-outly-dark block truncate w-2/3">{email.from.split(" • ")[0]}</span>
                            <span className={email.badgeStyle}>{email.badge}</span>
                          </div>
                          <span className="text-[10px] font-bold text-outly-dark/70 block truncate mb-0.5">{email.subject}</span>
                          <p className="text-[10px] text-outly-dark/40 line-clamp-2">{email.body}</p>
                        </div>
                      ))}
                      {Object.keys(emails).length === 0 && (
                        <div className="p-8 text-center text-outly-dark/30 text-xs font-semibold select-none">No messages in queue</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Thread detail */}
                  {emails[activeEmailId] ? (
                    <div className="flex-1 flex flex-col h-full bg-outly-cream/5 relative overflow-hidden" id="inbox-detail-container">
                      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar pb-24">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg mb-1 text-outly-dark leading-tight">{emails[activeEmailId].subject}</h4>
                            <p className="text-[9px] font-bold text-outly-dark/40">{emails[activeEmailId].from}</p>
                          </div>
                          <span className="text-[9px] font-mono text-outly-dark/40">{emails[activeEmailId].time}</span>
                        </div>
                        
                        <div className="bg-white border border-outly-border rounded-xl p-4 text-xs text-outly-dark/70 leading-relaxed shadow-sm">
                          {emails[activeEmailId].body}
                        </div>
                        
                        {/* ZenScale summary card */}
                        <div className="bg-white border border-outly-border rounded-xl p-5 shadow-sm">
                          <div className="text-[9px] font-bold text-outly-accent tracking-widest uppercase mb-4 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-outly-accent animate-pulse"></span>
                            • ZenScale AI Summary
                          </div>
                          <ul className="space-y-3">
                            {emails[activeEmailId].bullets.map((bullet, idx) => (
                              <li key={idx} className="flex gap-2 text-[11px] font-medium leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-outly-accent mt-1 shrink-0"></div>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Autopilot Typist Box */}
                        {autopilotDraftActive && (
                          <div className="bg-white border border-outly-accent/30 rounded-xl p-5 shadow-md relative overflow-hidden animate-slide-up">
                            <div className="text-[9px] font-bold text-outly-accent tracking-widest uppercase mb-3 flex items-center justify-between select-none">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-outly-accent animate-pulse"></span>
                                • Autopilot Draft Writer
                              </span>
                              <span className="text-outly-dark/40 font-mono text-[8px]">{autopilotTypedText.length} chars</span>
                            </div>
                            <div className="text-xs text-outly-dark/80 font-medium leading-relaxed min-h-[60px] max-h-[100px] overflow-y-auto outline-none custom-scrollbar italic" contentEditable suppressContentEditableWarning>
                              {autopilotTypedText}
                            </div>
                            <div className="flex justify-end gap-3 mt-4 border-t border-outly-border pt-3">
                              <button className="px-3 py-1.5 rounded-lg border border-outly-border text-[9px] font-bold hover:bg-outly-cream transition select-none" onClick={handleDiscardDraft}>Discard</button>
                              <button
                                className={`bg-outly-accent text-white px-4 py-1.5 rounded-lg text-[9px] font-bold transition shadow-sm select-none flex items-center gap-1.5 ${
                                  isTyping ? "opacity-50 pointer-events-none" : "hover:brightness-105"
                                }`}
                                onClick={handleSendDraft}
                              >
                                <span>Send Draft</span>
                                <svg ref={paperPlaneRef} className="w-3 h-3 transform transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action footer */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-outly-border bg-white flex items-center justify-between gap-3 shrink-0">
                        <span className="text-[9px] font-bold text-outly-dark/40 uppercase hidden md:inline">Reply in Maya's voice:</span>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <button className="flex-1 md:flex-none bg-white border border-outly-border px-4 py-2.5 rounded-lg text-[10px] font-bold hover:bg-outly-cream/40 transition select-none shadow-sm" onClick={() => handleTriggerReply(1)}>
                            {emails[activeEmailId].suggestions[0]}
                          </button>
                          <button className="flex-1 md:flex-none bg-white border border-outly-border px-4 py-2.5 rounded-lg text-[10px] font-bold hover:bg-outly-cream/40 transition select-none shadow-sm" onClick={() => handleTriggerReply(2)}>
                            {emails[activeEmailId].suggestions[1]}
                          </button>
                        </div>
                        <button className="text-outly-accent text-[10px] font-bold hover:underline select-none whitespace-nowrap hidden md:inline animate-pulse-subtle" onClick={() => handleTriggerReply(3)}>
                          {emails[activeEmailId].suggestions[2]}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-8 select-none">
                      <div>
                        <div className="w-12 h-12 rounded-full bg-[#5e7d5e]/10 flex items-center justify-center text-[#5e7d5e] mx-auto mb-4">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                          </svg>
                        </div>
                        <h4 className="font-bold text-base text-outly-dark mb-1">Inbox completely clear</h4>
                        <p className="text-xs text-outly-dark/40 max-w-xs leading-relaxed mx-auto font-medium">All pending outreach drafts have been successfully handled.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* TAB 3: CALENDAR */}
              {activeTab === "calendar" && (
                <div className="h-full p-6 md:p-8 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-2xl tracking-tight">Social Post Scheduler</h3>
                      <p className="text-xs text-outly-dark/40 font-medium">Keep your professional brand active on autopilot.</p>
                    </div>
                    <div className="text-[10px] font-bold text-outly-accent bg-outly-accent/10 px-3 py-1.5 rounded-full select-none uppercase">
                      QUEUED FOR {activeCalendarDay.toUpperCase()}DAY
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
                    {/* Calendar grid */}
                    <div className="flex-1">
                      <div className="grid grid-cols-7 gap-3 mb-4 text-center select-none">
                        <div className="text-[10px] font-bold text-outly-dark/30 uppercase">Mon</div>
                        <div className="text-[10px] font-bold text-outly-dark/30 uppercase">Tue</div>
                        <div className="text-[10px] font-bold text-outly-dark/30 uppercase">Wed</div>
                        <div className="text-[10px] font-bold text-outly-dark/30 uppercase">Thu</div>
                        <div className="text-[10px] font-bold text-outly-dark/30 uppercase">Fri</div>
                        <div className="text-[10px] font-bold text-outly-dark/30 uppercase">Sat</div>
                        <div className="text-[10px] font-bold text-outly-dark/30 uppercase">Sun</div>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-3">
                        {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day, idx) => {
                          const status = calendarStatuses[day];
                          const isActive = activeCalendarDay === day;
                          
                          let statusStyle = "text-outly-dark/20";
                          if (status === "SENT") statusStyle = "text-green-500";
                          if (status === "DRAFT") statusStyle = "text-outly-accent";
                          
                          return (
                            <div
                              key={day}
                              className={`aspect-square rounded-2xl flex flex-col justify-between p-3 cursor-pointer transition-all duration-300 ${
                                isActive
                                  ? "bg-outly-accent/5 border-2 border-outly-accent"
                                  : "bg-white border border-outly-border hover:border-outly-accent"
                              }`}
                              onClick={() => handleSelectCalendarDay(day)}
                            >
                              <span className={`text-xs font-bold ${isActive ? "text-outly-accent" : "text-outly-dark/30"}`}>{idx + 6}</span>
                              <span className={`text-[9px] font-bold select-none ${statusStyle}`}>{status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Post composer panel */}
                    <div className="w-full md:w-80 bg-outly-cream/20 border border-outly-border rounded-3xl p-6 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-outly-dark/40 uppercase tracking-widest block mb-4">Post Draft Preview</span>
                        <textarea
                          value={calendarComposerText}
                          onChange={(e) => setCalendarComposerText(e.target.value)}
                          className="w-full h-32 bg-white border border-outly-border rounded-2xl p-4 text-xs font-medium focus:ring-1 focus:ring-outly-accent focus:border-outly-accent outline-none resize-none custom-scrollbar leading-relaxed"
                          placeholder="Write post..."
                        />
                        <div className="flex justify-between items-center mt-2 text-[9px] font-bold text-outly-dark/30 px-1">
                          <span>Target: LinkedIn & Twitter</span>
                          <span>{calendarComposerText.length} characters</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-6">
                        <button className="w-full bg-outly-accent text-white py-3 rounded-xl text-xs font-bold hover:brightness-105 transition shadow-md select-none" onClick={handlePublishPost}>Publish Post Now</button>
                        <button className="w-full bg-white border border-outly-border text-outly-dark py-3 rounded-xl text-xs font-bold hover:bg-outly-cream/50 transition select-none" onClick={handleRegeneratePostDraft}>Regenerate Draft</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* TAB 4: RESUME VAULT */}
              {activeTab === "vault" && (
                <div className="h-full p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                      <h3 className="font-bold text-2xl tracking-tight">Resume Vault &amp; ATS Score Checker</h3>
                      <p className="text-xs text-outly-dark/40 font-medium">Auto-generate hyper-tailored variants for target job posts.</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Left config */}
                    <div className="flex-1 space-y-6">
                      <div>
                        <label className="text-[9px] font-bold text-outly-dark/40 uppercase tracking-wider block mb-2">Select Target Role</label>
                        <select
                          value={currentVaultRole}
                          onChange={(e) => handleVaultRoleChange(e.target.value as any)}
                          className="w-full bg-white border border-outly-border rounded-xl px-4 py-3 text-xs font-semibold focus:ring-1 focus:ring-outly-accent focus:border-outly-accent outline-none cursor-pointer"
                        >
                          <option value="spotify">Spotify • Product Designer (Stockholm / Remote)</option>
                          <option value="notion">Notion • Brand Lead (San Francisco)</option>
                          <option value="stripe">Stripe • Systems Engineer (Dublin)</option>
                        </select>
                      </div>
                      
                      {/* Score card */}
                      <div className="bg-white border border-outly-border rounded-2xl p-6 shadow-soft flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-outly-accent uppercase tracking-wider">{atsMatchScore}% Match</span>
                          <h5 className="font-bold text-base">{vaultRoles[currentVaultRole].title}</h5>
                          <p className="text-xs font-semibold text-outly-dark/40">{vaultRoles[currentVaultRole].meta}</p>
                        </div>
                        
                        {/* Circular Score Dial */}
                        <div className="relative w-20 h-20 shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path class="text-outly-cream" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path
                              className="text-outly-accent transition-all duration-1000 ease-out"
                              strokeDasharray={`${atsMatchScore}, 100`}
                              strokeWidth="3"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-outly-dark">{atsMatchScore}%</div>
                        </div>
                      </div>
                      
                      <button
                        className={`w-full text-xs font-bold py-4 rounded-xl shadow-lg tracking-widest uppercase select-none transition-all duration-300 ${
                          isTailoring
                            ? "bg-outly-dark text-white pointer-events-none"
                            : tailorSuccess
                            ? "bg-green-600 text-white pointer-events-none"
                            : "bg-outly-accent text-white shadow-outly-accent/10 hover:brightness-105 active:scale-95"
                        }`}
                        onClick={handleRunTailor}
                      >
                        {isTailoring ? "Analyzing JD keywords..." : tailorSuccess ? "Optimized ✓ PDF Ready" : "Tailor Resume Now"}
                      </button>
                    </div>
                    
                    {/* Right side status logs and document lists */}
                    <div className="w-full md:w-80 space-y-6">
                      <div className="bg-outly-cream/20 border border-outly-border rounded-2xl p-6 relative">
                        <span className="text-[10px] font-bold text-outly-dark/30 mb-4 uppercase tracking-[0.2em] block">AI Analysis</span>
                        <p className="text-sm font-medium mb-6 italic-serif leading-relaxed text-outly-dark/80">
                          "{vaultRoles[currentVaultRole].analysis}"
                        </p>
                        
                        {/* Terminal log panel */}
                        {(isTailoring || tailorSuccess) && (
                          <div className="bg-white border border-outly-border rounded-xl p-4 animate-slide-up">
                            <div className="text-[9px] font-bold text-green-600 tracking-wider uppercase mb-2">Keyword Injection Log</div>
                            <div className="space-y-1.5 text-[9px] font-mono text-outly-dark/60">
                              {tailorLogs.map((log, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                                  <span>{log}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Document vault list */}
                      <div className="bg-white border border-outly-border rounded-2xl p-6 shadow-soft space-y-4">
                        <span className="text-[9px] font-bold text-outly-dark/40 uppercase tracking-widest block">Tailored PDF Outputs</span>
                        <div className="space-y-3 max-h-[140px] overflow-y-auto custom-scrollbar">
                          {tailoredPDFs.map((pdf) => (
                            <div key={pdf.id} className="flex justify-between items-center p-3 border border-outly-border rounded-xl bg-outly-cream/10 select-none animate-fade-in">
                              <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-outly-dark/40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                                <div>
                                  <span className="font-bold text-[11px] text-outly-dark block truncate max-w-[120px]">{pdf.filename}</span>
                                  <span className="text-[8px] text-outly-dark/40 block leading-none mt-0.5">{pdf.meta}</span>
                                </div>
                              </div>
                              <span className="text-[8px] bg-green-600 text-white px-2 py-0.5 rounded font-bold uppercase select-none cursor-pointer hover:brightness-105 transition">DOWNLOAD</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-40">
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-outly-accent"></div>
              <div className="text-outly-accent font-bold text-[10px] tracking-[0.3em] uppercase">PRICING</div>
            </div>
            <h2 className="text-6xl md:text-8xl font-medium tracking-tight mb-10 leading-[0.95]">
              Free <span className="italic-serif text-outly-accent">by nature.</span><br />
              Paid <span className="italic-serif text-outly-accent">for convenience.</span>
            </h2>
            <p className="text-outly-dark/50 text-xl max-w-2xl leading-relaxed font-medium">
              Outly is built around a simple idea: the tool is free. Bring your own AI keys and pay nothing — or let us handle the AI and pay one calm price.
            </p>
          </div>
          
          {/* Pricing Switcher Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-white border border-outly-border p-4 rounded-3xl shadow-soft shrink-0">
            
            {/* Term toggle */}
            <div className="flex items-center gap-3 select-none">
              <span className={`text-xs font-bold transition-colors ${billingDuration === "monthly" ? "text-outly-dark" : "text-outly-dark/40"}`}>Monthly</span>
              <div className="w-12 h-6 bg-outly-border rounded-full p-0.5 cursor-pointer relative" onClick={togglePricingDuration}>
                <div className={`w-5 h-5 bg-outly-accent rounded-full shadow-md transform transition-transform duration-300 ${
                  billingDuration === "yearly" ? "translate-x-6" : "translate-x-0"
                }`}></div>
              </div>
              <span className={`text-xs font-medium transition-colors flex items-center gap-1.5 ${billingDuration === "yearly" ? "text-outly-dark font-bold" : "text-outly-dark/40"}`}>
                Yearly
                {billingDuration === "yearly" && (
                  <span className="bg-outly-accent text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">Save 25%</span>
                )}
              </span>
            </div>
            
            <div className="hidden sm:block w-px h-6 bg-outly-border"></div>
            
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
        
        <div className="grid md:grid-cols-2 gap-10 items-stretch">
          
          {/* Outly Free Card */}
          <div className="bg-white rounded-[48px] p-12 md:p-16 shadow-soft border border-outly-border flex flex-col hover:border-outly-accent/20 transition-all duration-500">
            <div className="mb-10">
              <span class="bg-outly-dark/5 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest text-outly-dark/50">BRING YOUR OWN KEYS</span>
            </div>
            <h3 className="text-4xl font-medium mb-6 tracking-tight">Outly Free</h3>
            <p className="text-[13px] text-outly-dark/40 font-medium mb-12">Plug in your own API keys. The whole app, no meter running.</p>
            <div className="flex items-baseline gap-3 mb-12">
              <span className="text-7xl font-medium">{priceData.free}</span>
              <span className="text-outly-dark/30 text-xs font-medium">{priceData.freeMeta}</span>
            </div>
            <ul className="space-y-6 mb-16 flex-1">
              <li className="flex items-center gap-4 text-sm font-bold text-outly-dark/70">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Every feature — daily brief, summaries, drafts
              </li>
              <li className="flex items-center gap-4 text-sm font-bold text-outly-dark/70">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Your keys, your models, your data
              </li>
              <li className="flex items-center gap-4 text-sm font-bold text-outly-dark/70">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Unlimited accounts and calendars
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 mb-10 select-none">
              <span className="text-[10px] font-bold px-3 py-1 bg-outly-cream rounded border border-outly-border text-outly-dark/30 uppercase tracking-widest">OpenAI</span>
              <span className="text-[10px] font-bold px-3 py-1 bg-outly-cream rounded border border-outly-border text-outly-dark/30 uppercase tracking-widest">Anthropic</span>
              <span className="text-[10px] font-bold px-3 py-1 bg-outly-cream rounded border border-outly-border text-outly-dark/30 uppercase tracking-widest">Google Gemini</span>
              <span className="text-[10px] font-bold px-3 py-1 bg-outly-cream rounded border border-outly-border text-outly-dark/30 uppercase tracking-widest">Groq</span>
            </div>
            <Link to="/login" className="w-full border-2 border-outly-border py-5 rounded-full font-bold text-lg hover:bg-outly-cream transition text-center select-none block">Start free</Link>
          </div>
          
          {/* Outly Cloud Card */}
          <div className="bg-outly-dark rounded-[48px] p-12 md:p-16 text-white flex flex-col relative overflow-hidden shadow-2xl hover:shadow-outly-accent/5 transition-all duration-500">
            <div className="mb-10">
              <span className="bg-outly-accent text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">25% OFF IN BETA</span>
            </div>
            <h3 className="text-4xl font-medium mb-6 tracking-tight">Outly Cloud</h3>
            <p className="text-[13px] text-white/40 font-medium mb-12">No keys, no setup. Our models, tuned for email — it just works.</p>
            <div className="flex items-baseline gap-3 mb-12">
              <span className="text-7xl font-medium">{priceData.pro}</span>
              <span className="text-white/20 text-xl font-medium line-through leading-none">{priceData.proSlashed}</span>
              <span className="text-white/40 text-sm font-medium">{priceData.proDuration}</span>
            </div>
            <ul className="space-y-6 mb-16 flex-1">
              <li className="flex items-center gap-4 text-sm font-bold text-white/90">
                <svg className="w-5 h-5 text-outly-accent shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Everything in Free, zero configuration
              </li>
              <li className="flex items-center gap-4 text-sm font-bold text-white/90">
                <svg className="w-5 h-5 text-outly-accent shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                AI usage included — no token math, no surprise bills
              </li>
              <li className="flex items-center gap-4 text-sm font-bold text-white/90">
                <svg className="w-5 h-5 text-outly-accent shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                Priority support and early features
              </li>
            </ul>
            <Link to="/login" className="w-full bg-outly-accent py-5 rounded-full font-bold text-lg hover:brightness-110 transition shadow-2xl shadow-outly-accent/30 text-center select-none block">Get Outly Cloud</Link>
          </div>
        </div>
        
        {/* Security Alert Note */}
        <div className="mt-16 bg-white rounded-[32px] p-8 max-w-2xl mx-auto flex gap-6 items-center border border-outly-border shadow-soft">
          <div className="w-14 h-14 bg-[#5e7d5e]/10 rounded-2xl flex items-center justify-center text-[#5e7d5e] shrink-0 border border-[#5e7d5e]/20">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-bold text-outly-dark mb-1">Your API keys are encrypted and stay yours</h5>
            <p className="text-xs text-outly-dark/40 leading-relaxed font-medium">Bring your own keys with total peace of mind. Your key is <span className="text-outly-dark font-bold">encrypted with AES-256 before it's stored</span>, and never written to logs or shown back to you.</p>
          </div>
        </div>
        <p className="text-center mt-12 text-[10px] font-bold text-outly-dark/30 uppercase tracking-widest">Either way, your email never trains anyone's models. That's a promise, not a setting.</p>
      </section>

      {/* BOTTOM CTA */}
      <section className="max-w-5xl mx-auto px-6 py-48 text-center relative">
        <div className="relative inline-block mb-12 select-none">
          <div className="w-10 h-10 bg-outly-accent rounded-full mx-auto flex items-center justify-center overflow-hidden">
            <div className="w-6 h-6 bg-white rounded-full mt-4"></div>
          </div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-px h-10 bg-outly-accent/20"></div>
        </div>
        <h2 className="text-7xl md:text-[90px] font-medium tracking-tight mb-10 leading-[0.9] text-outly-dark">
          Tomorrow morning<br />could feel <span className="italic-serif text-outly-accent">different.</span>
        </h2>
        <p className="text-outly-dark/40 text-lg mb-12 leading-relaxed max-w-xl mx-auto font-medium">
          Outly is in open beta and free to start — sign up and get your first morning brief tomorrow.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login" className="bg-outly-accent text-white px-8 py-4 rounded-full font-bold text-base hover:brightness-105 transition shadow-xl shadow-outly-accent/20">
            Get started — it's free
          </Link>
          <Link to="/login" className="bg-white border border-outly-border px-8 py-4 rounded-full font-bold text-base hover:bg-outly-border/30 transition">
            Sign in
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white pt-24 pb-12 border-t border-outly-border/50">
        <div className="max-w-7xl mx-auto px-10 grid md:grid-cols-4 gap-20 pb-20 mb-12">
          <div className="col-span-1">
            <div className="flex items-center gap-2 font-bold text-xl mb-6 tracking-tight">
              <div className="w-6 h-6 bg-outly-accent rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm rotate-45"></div>
              </div>
              Outly
            </div>
            <p className="text-xs text-outly-dark/40 leading-relaxed font-medium">
              Email and calendar, gathered into one calm morning brief. Built for people who'd rather be working.
            </p>
            <div className="flex gap-4 mt-8">
              <a className="text-outly-dark/20 hover:text-outly-accent transition" href="#">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </a>
              <a className="text-outly-dark/20 hover:text-outly-accent transition" href="#">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h6 className="text-[10px] font-bold text-outly-dark/30 uppercase tracking-widest mb-8">Product</h6>
            <ul className="space-y-4 text-xs font-bold text-outly-dark/60">
              <li><a className="hover:text-outly-accent transition cursor-pointer" href="#features" onClick={(e) => handleScrollToSection(e, "features")}>Features</a></li>
              <li><a className="hover:text-outly-accent transition cursor-pointer" href="#demo" onClick={(e) => handleScrollToSection(e, "demo")}>Live demo</a></li>
              <li><a className="hover:text-outly-accent transition cursor-pointer" href="#pricing" onClick={(e) => handleScrollToSection(e, "pricing")}>Pricing</a></li>
            </ul>
          </div>
          <div>
            <h6 className="text-[10px] font-bold text-outly-dark/30 uppercase tracking-widest mb-8">Company</h6>
            <ul className="space-y-4 text-xs font-bold text-outly-dark/60">
              <li><a className="hover:text-outly-accent transition" href="#">About</a></li>
              <li><a className="hover:text-outly-accent transition" href="#">Founder</a></li>
              <li><a className="hover:text-outly-accent transition" href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <h6 className="text-[10px] font-bold text-outly-dark/30 uppercase tracking-widest mb-8">Trust</h6>
            <ul className="space-y-4 text-xs font-bold text-outly-dark/60">
              <li><a className="hover:text-outly-accent transition" href="#">Privacy</a></li>
              <li><a className="hover:text-outly-accent transition" href="#">Security</a></li>
              <li><a className="hover:text-outly-accent transition" href="#">Terms</a></li>
              <li><a className="hover:text-outly-accent transition" href="#">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-outly-dark/20 tracking-widest uppercase select-none">
          <p>© 2026 Outly, All rights reserved. • team@outly.com</p>
          <div className="flex items-center gap-6 mt-8 md:mt-0">
            <p>Made with care, before 9 AM</p>
            <div className="flex items-center gap-2 bg-outly-cream px-4 py-2 rounded-full border border-outly-border text-outly-dark/50 shadow-sm">
              <div className="w-1.5 h-1.5 bg-outly-accent rounded-full animate-pulse"></div>
              Ask Outly <span className="text-outly-dark/20 ml-1">from your favorite AI</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

// Pricing state and currency transitions are managed locally within the component.
