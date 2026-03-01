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
import AdminLayout from "./components/AdminLayout";
import AdminGuard from "./components/AdminGuard";
import Dashboard from "./pages/admin/Dashboard";
import Runs from "./pages/admin/Runs";
import Bookings from "./pages/admin/Bookings";
import Groups from "./pages/admin/Groups";

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
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Dashboard />} />
            <Route path="runs" element={<Runs />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="groups" element={<Groups />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
