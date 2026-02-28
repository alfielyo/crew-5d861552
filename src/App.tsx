import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Consent from "./pages/Consent";
import Onboarding from "./pages/Onboarding";
import HomePage from "./pages/HomePage";
import MyRun from "./pages/MyRun";
import Profile from "./pages/Profile";
import BookingConfirm from "./pages/BookingConfirm";
import BookingSuccess from "./pages/BookingSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/onboarding/:step" element={<Onboarding />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/my-run" element={<MyRun />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/booking/confirm" element={<BookingConfirm />} />
          <Route path="/booking/success" element={<BookingSuccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
