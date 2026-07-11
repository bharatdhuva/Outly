import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Onboarding from "./pages/Onboarding";
import ColdMail from "./pages/ColdMail";
import ContentScheduler from "./pages/ContentScheduler";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import ResumeTailorPage from "./pages/ResumeTailor";
import AtsScore from "./pages/AtsScore";
import Applications from "./pages/Applications";
import JobSearch from "./pages/JobSearch";
import Analytics from "./pages/Analytics";
import ResumeVault from "./pages/ResumeVault";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import MobileHub from "./pages/MobileHub";
import { PageTransition, GlobalPageTransitionInterceptor } from "./components/PageTransition";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <GlobalPageTransitionInterceptor />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />

          {/* Public Login Page */}
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />

          {/* Protected/Workspace Dashboard Pages */}
          <Route
            path="/*"
            element={
              <DashboardLayout>
                <Routes>
                  <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
                  <Route path="/cold-mail" element={<PageTransition><ColdMail /></PageTransition>} />
                  <Route path="/content-scheduler" element={<PageTransition><ContentScheduler /></PageTransition>} />
                  <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
                  <Route path="/logs" element={<PageTransition><Logs /></PageTransition>} />
                  <Route path="/resume-tailor" element={<PageTransition><ResumeTailorPage /></PageTransition>} />
                  <Route path="/resume-vault" element={<PageTransition><ResumeVault /></PageTransition>} />
                  <Route path="/ats-score" element={<PageTransition><AtsScore /></PageTransition>} />
                  <Route path="/applications" element={<PageTransition><Applications /></PageTransition>} />
                  <Route path="/job-search" element={<PageTransition><JobSearch /></PageTransition>} />
                  <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
                  <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
                  <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
                  <Route path="/resumes" element={<PageTransition><MobileHub category="resumes" /></PageTransition>} />
                  <Route path="/jobs" element={<PageTransition><MobileHub category="jobs" /></PageTransition>} />
                  <Route path="/tools" element={<PageTransition><MobileHub category="tools" /></PageTransition>} />
                  <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                </Routes>
              </DashboardLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
