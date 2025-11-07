import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BoardView from "./pages/BoardView";
import Agenda from "./pages/Agenda";
import Pautas from "./pages/Pautas";
import EscalaFDS from "./pages/EscalaFDS";
import Contacts from "./pages/Contacts";
import AdminContacts from "./pages/AdminContacts";
import AgendaInstitucional from "./pages/AgendaInstitucional";
import RootLayout from "./components/layout/RootLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AdminRoute } from "./components/layout/AdminRoute";

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={
            <ProtectedRoute>
              <RootLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Index />} />
            <Route path="/board/:boardId" element={<BoardView />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pautas" element={<Pautas />} />
            <Route path="/escala-fds" element={<EscalaFDS />} />
            <Route path="/agenda-institucional" element={<AgendaInstitucional />} />
            <Route
              path="/contatos"
              element={
                <AdminRoute>
                  <AdminContacts />
                </AdminRoute>
              }
            />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
