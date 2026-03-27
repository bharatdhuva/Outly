import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BrandLogo } from "@/components/BrandLogo";
import { LoadingScreen } from "@/components/LoadingScreen";
import Overview from "./pages/Overview";
import ColdMail from "./pages/ColdMail";
import LinkedInPosts from "./pages/LinkedInPosts";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import Twitter from "./pages/Twitter";
import Reddit from "./pages/Reddit";
import { TelegramControl } from "./pages/TelegramControl";

const queryClient = new QueryClient();

const WelcomeOverlay = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.985 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-background"
      >
        <div className="welcome-screen__ambient welcome-screen__ambient--one" />
        <div className="welcome-screen__ambient welcome-screen__ambient--two" />
        <div className="welcome-screen__scanlines" />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex min-h-screen w-full flex-col items-center justify-center gap-10 px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1.18 }}
            transition={{
              delay: 0.18,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <BrandLogo className="welcome-screen__brand scale-[1.18]" />
          </motion.div>

          <div className="welcome-screen__copy">
            <p className="welcome-screen__eyebrow">READY</p>
            <h1 className="welcome-screen__heading">Welcome to Outly</h1>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  const [appStage, setAppStage] = useState<"loading" | "welcome" | "app">(
    "loading",
  );

  useEffect(() => {
    document.body.classList.toggle("app-loading", appStage !== "app");
    return () => {
      document.body.classList.remove("app-loading");
    };
  }, [appStage]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {appStage === "loading" ? (
          <LoadingScreen onComplete={() => setAppStage("welcome")} />
        ) : null}
        {appStage === "welcome" ? (
          <WelcomeOverlay onComplete={() => setAppStage("app")} />
        ) : null}
        {appStage === "app" ? (
          <BrowserRouter>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/cold-mail" element={<ColdMail />} />
                <Route path="/linkedin-posts" element={<LinkedInPosts />} />
                <Route path="/twitter" element={<Twitter />} />
                <Route path="/reddit" element={<Reddit />} />
                <Route path="/telegram" element={<TelegramControl />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DashboardLayout>
          </BrowserRouter>
        ) : null}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
