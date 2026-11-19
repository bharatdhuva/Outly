import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import Landing from "./pages/Landing";
import { PageTransition, GlobalPageTransitionInterceptor } from "./components/PageTransition";
import PageSkeleton from "./components/PageSkeleton";
import LimitReachedModal from "@/components/LimitReachedModal";
import { DemoSignupModal } from "@/components/DemoSignupModal";

// ─── Route-level code splitting with React.lazy ──────────────────────────────
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ColdMail = lazy(() => import("./pages/ColdMail"));
const Settings = lazy(() => import("./pages/Settings"));
const Logs = lazy(() => import("./pages/Logs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResumeTailorPage = lazy(() => import("./pages/ResumeTailor"));
const AtsScore = lazy(() => import("./pages/AtsScore"));
const Applications = lazy(() => import("./pages/Applications"));
const JobSearch = lazy(() => import("./pages/JobSearch"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ResumeVault = lazy(() => import("./pages/ResumeVault"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Support = lazy(() => import("./pages/Support"));
const MobileHub = lazy(() => import("./pages/MobileHub"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 mins cache freshness
      gcTime: 1000 * 60 * 60 * 24, // 24 hours persistence
      refetchOnWindowFocus: false, // Prevent jarring refetches when switching browser tabs
      retry: 1,
    },
  },
});

interface MobileRedirectProps {
  to: string;
  element: React.ReactNode;
}

const MobileRedirect = ({ to, element }: MobileRedirectProps) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.innerWidth < 768) {
      navigate(to, { replace: true });
    }
  }, [navigate, to]);
  return <>{element}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <GlobalPageTransitionInterceptor />
          <LimitReachedModal />
          <DemoSignupModal />
          <Routes>
            {/* Public Landing Page — eagerly loaded for 0ms instantaneous paint */}
            <Route
              path="/"
              element={
                <PageTransition>
                  <Landing />
                </PageTransition>
              }
            />

            {/* Public Login Page — lazy loaded with skeleton fallback */}
            <Route
              path="/login"
              element={
                <PageTransition>
                  <Suspense fallback={<PageSkeleton />}>
                    <Login />
                  </Suspense>
                </PageTransition>
              }
            />

            {/* Protected/Workspace Dashboard Pages — App shell stays mounted */}
            <Route
              path="/*"
              element={
                <DashboardLayout>
                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
                      <Route path="/dashboard" element={<PageTransition><Onboarding /></PageTransition>} />
                      <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
                      <Route path="/logs" element={<PageTransition><Logs /></PageTransition>} />
                      <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
                      <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
                      <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
                      <Route path="/resumes" element={<PageTransition><MobileHub category="resumes" /></PageTransition>} />
                      <Route path="/jobs" element={<PageTransition><MobileHub category="jobs" /></PageTransition>} />
                      <Route path="/tools" element={<PageTransition><MobileHub category="tools" /></PageTransition>} />

                      <Route path="/cold-mail" element={<PageTransition><MobileRedirect to="/tools?tab=mail" element={<ColdMail />} /></PageTransition>} />
                      <Route path="/resume-tailor" element={<PageTransition><MobileRedirect to="/resumes?tab=tailor" element={<ResumeTailorPage />} /></PageTransition>} />
                      <Route path="/resume-vault" element={<PageTransition><MobileRedirect to="/resumes?tab=vault" element={<ResumeVault />} /></PageTransition>} />
                      <Route path="/ats-score" element={<PageTransition><MobileRedirect to="/resumes?tab=ats" element={<AtsScore />} /></PageTransition>} />
                      <Route path="/applications" element={<PageTransition><MobileRedirect to="/jobs?tab=tracker" element={<Applications />} /></PageTransition>} />
                      <Route path="/job-search" element={<PageTransition><MobileRedirect to="/jobs?tab=search" element={<JobSearch />} /></PageTransition>} />

                      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                    </Routes>
                  </Suspense>
                </DashboardLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
