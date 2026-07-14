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

      {/* Founder & Portfolio Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        
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

        {/* Card 2: Portfolio Link */}
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
              <p className="font-bold text-foreground">How does the ₹1 lifetime plan work?</p>
              <p className="text-muted-foreground text-[11px]">
                You get lifetime unrestricted access to all AI tools. Nominal ₹1 pricing is for server scalability verification.
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
