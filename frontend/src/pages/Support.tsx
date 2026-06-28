import React from "react";
import { 
  Globe, 
  HelpCircle, 
  User, 
  ExternalLink, 
  HeartHandshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import bharatDhuvaImg from "../assets/brand/bharat_dhuva.jpg";

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.017 4.025-1.099zm12.3-6.85c-.083-.138-.305-.222-.639-.388-.333-.167-1.972-.973-2.278-1.084-.306-.111-.528-.167-.75.167-.222.333-.861 1.084-1.056 1.306-.194.222-.389.25-.722.083-.333-.167-1.412-.521-2.69-1.66-.994-.888-1.666-1.984-1.861-2.317-.194-.333-.021-.513.145-.679.15-.15.333-.389.5-.583.167-.194.222-.333.333-.556.111-.222.056-.417-.028-.583-.083-.167-.75-1.806-1.028-2.472-.271-.647-.546-.56-.75-.57-.194-.01-.417-.01-.639-.01-.222 0-.583.083-.889.417-.306.333-1.167 1.139-1.167 2.778 0 1.639 1.194 3.222 1.361 3.444.167.222 2.349 3.587 5.691 5.033 2.784 1.203 3.35 1.077 4.542.972 1.192-.105 2.69-.1.996 3.079-1.473.389-.472.389-.861.305-1.084z" />
    </svg>
  );
}

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-10 animate-fade-in pb-16 text-left">
      
      {/* Hero Header */}
      <div className="space-y-3 bg-card border border-border/80 p-6 sm:p-8 rounded-3xl shadow-xs">
        <span className="text-[10px] font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/10 px-3.5 py-1.5 rounded-full inline-block border border-outly-accent/20">
          DEVELOPER CONTACT &amp; FEEDBACK
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
          Connect directly with the Developer
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-3xl leading-relaxed font-medium">
          Thank you so much for taking out your valuable time! I would genuinely love to hear your honest feedback and suggestions on what I should improve in this project.
        </p>
      </div>

      {/* Founder, WhatsApp & Portfolio Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Card 1: Founder Info */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-outly-accent/30 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-outly-accent/20 shrink-0 shadow-xs">
              <img src={bharatDhuvaImg} alt="Bharat Dhuva" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-outly-accent">FOUNDER &amp; DEVELOPER</span>
              <h3 className="text-lg font-bold text-foreground mt-0.5">Bharat Dhuva</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Software Engineer building Outly AI career automation platform.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/40 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-emerald-600">Online &amp; Active for Feedback</span>
          </div>
        </div>

        {/* Card 2: WhatsApp Direct */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center p-2.5 overflow-hidden shrink-0">
              <img 
                src="https://logo.clearbit.com/whatsapp.com" 
                alt="WhatsApp" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=whatsapp.com&sz=128";
                }}
              />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#25D366]">INSTANT WHATSAPP CHAT</span>
              <h3 className="text-lg font-bold text-foreground mt-0.5">+91 9624828661</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Share your thoughts, suggestions &amp; bugs directly on WhatsApp.
              </p>
            </div>
          </div>
          <Button 
            asChild
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-xs cursor-pointer"
          >
            <a href="https://wa.me/919624828661" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-white">
              <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.017 4.025-1.099zm12.3-6.85c-.083-.138-.305-.222-.639-.388-.333-.167-1.972-.973-2.278-1.084-.306-.111-.528-.167-.75.167-.222.333-.861 1.084-1.056 1.306-.194.222-.389.25-.722.083-.333-.167-1.412-.521-2.69-1.66-.994-.888-1.666-1.984-1.861-2.317-.194-.333-.021-.513.145-.679.15-.15.333-.389.5-.583.167-.194.222-.333.333-.556.111-.222.056-.417-.028-.583-.083-.167-.75-1.806-1.028-2.472-.271-.647-.546-.56-.75-.57-.194-.01-.417-.01-.639-.01-.222 0-.583.083-.889.417-.306.333-1.167 1.139-1.167 2.778 0 1.639 1.194 3.222 1.361 3.444.167.222 2.349 3.587 5.691 5.033 2.784 1.203 3.35 1.077 4.542.972 1.192-.105 2.69-.1.996 3.079-1.473.389-.472.389-.861.305-1.084z" />
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </Button>
        </div>

        {/* Card 3: Portfolio Link */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-blue-500/30 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center font-bold text-lg shrink-0">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">DEVELOPER PORTFOLIO</span>
              <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 truncate" title="bharatdhuva.vercel.app">
                bharatdhuva.vercel.app
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Explore my engineering work, projects &amp; background.
              </p>
            </div>
          </div>
          <Button 
            asChild
            variant="outline"
            className="w-full border-border hover:bg-secondary text-foreground font-bold text-xs h-10 rounded-xl gap-2 cursor-pointer"
          >
            <a href="https://bharatdhuva.vercel.app/" target="_blank" rel="noopener noreferrer">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>View Portfolio</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </Button>
        </div>

      </div>

      {/* Bottom Section: FAQ & Social Links */}
      <div className="space-y-4">
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 text-left">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-outly-accent" />
            Frequently Asked Questions
          </h3>

          <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed">
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-1">
              <p className="font-bold text-foreground">How does the ₹1 trial plan work?</p>
              <p className="text-muted-foreground text-[11px]">
                You get 7 full days of unrestricted access to all AI tools. Nominal ₹1 pricing is for server scalability verification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-1">
              <p className="font-bold text-foreground">Are my resume files secure?</p>
              <p className="text-muted-foreground text-[11px]">
                Yes, 100%. All uploaded resumes in Vault are encrypted and only processed for your ATS score and tailoring.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-1">
              <p className="font-bold text-foreground">How do I configure Cold Mail details?</p>
              <p className="text-muted-foreground text-[11px]">
                Go to Settings page to update your experience and tech stack. Cold Mail automatically pulls your latest details!
              </p>
            </div>
          </div>
        </div>

        {/* Social Links Badge */}
        <div className="p-4 rounded-2xl bg-outly-accent/5 border border-outly-accent/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-foreground">
          <span className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-outly-accent shrink-0" />
            Connect with Bharat Dhuva across social platforms
          </span>
          <div className="flex items-center gap-4">
            <a 
              href="https://linkedin.com/in/bharatdhuva27/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-foreground hover:text-outly-accent transition-colors text-xs font-bold flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-xl border border-border/60 shadow-2xs"
            >
              <img 
                src="https://logo.clearbit.com/linkedin.com" 
                alt="LinkedIn" 
                className="w-4 h-4 object-contain rounded-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128";
                }}
              />
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>

            <a 
              href="https://github.com/bharatdhuva" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-foreground hover:text-outly-accent transition-colors text-xs font-bold flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-xl border border-border/60 shadow-2xs"
            >
              <img 
                src="https://logo.clearbit.com/github.com" 
                alt="GitHub" 
                className="w-4 h-4 object-contain rounded-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=github.com&sz=128";
                }}
              />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
