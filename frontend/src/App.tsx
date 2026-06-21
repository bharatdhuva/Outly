import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Overview from "./pages/Overview";
import ColdMail from "./pages/ColdMail";
import LinkedInPosts from "./pages/LinkedInPosts";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import Twitter from "./pages/Twitter";
import Reddit from "./pages/Reddit";
import { TelegramControl } from "./pages/TelegramControl";
import ResumeTailorPage from "./pages/ResumeTailor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
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
            <Route path="/resume-tailor" element={<ResumeTailorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
