
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Create from "./pages/Create";
import MyEvents from "./pages/MyEvents";
import Events from "./pages/Events";
import Auth from "./pages/Auth";
import Clubs from "./pages/Clubs";
import ClubCreate from "./pages/ClubCreate";
import ClubCreateMultiStep from "./pages/ClubCreateMultiStep";
import ClubEdit from "./pages/ClubEdit";
import EventEdit from "./pages/EventEdit";
import ClubProfile from "./pages/ClubProfile";
import RegularUserProfile from "./pages/RegularUserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<Events />} />
            <Route path="/create" element={<Create />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/club/create" element={<ClubCreateMultiStep />} />
            <Route path="/club/:clubId/edit" element={<ClubEdit />} />
            <Route path="/event/:eventId/edit" element={<EventEdit />} />
            <Route path="/club/:id" element={<ClubProfile />} />
            <Route path="/profile" element={<RegularUserProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
