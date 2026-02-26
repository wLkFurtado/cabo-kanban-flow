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
import Roadmap from "./pages/Roadmap";
import Melhorias from "./pages/Melhorias";
import AITextGenerator from "./pages/AITextGenerator";
import Equipamentos from "./pages/Equipamentos";
import Carros from "./pages/Carros";
import Relatorios from "./pages/Relatorios";
import RootLayout from "./components/layout/RootLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AdminRoute } from "./components/layout/AdminRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Create QueryClient outside component to prevent recreation
// Configuração otimizada para reduzir egress do Supabase e melhorar responsividade
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 30 * 1000, // 30 segundos - balance entre performance e dados frescos
      cacheTime: 10 * 60 * 1000, // 10 minutos - cache mantido por 10min
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      networkMode: 'online', // Somente executar mutations quando online
    },
  },
});

const App = () => (
  <ErrorBoundary>
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
              <Route path="/" element={<Agenda />} />
              <Route path="/board/:boardId" element={<BoardView />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/pautas" element={<Pautas />} />
              <Route path="/escala-fds" element={<EscalaFDS />} />
              <Route path="/agenda-institucional" element={<AgendaInstitucional />} />
              <Route path="/melhorias" element={<Melhorias />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/gerador-texto" element={<AITextGenerator />} />
              <Route path="/equipamentos" element={<Equipamentos />} />
              <Route path="/carros" element={<Carros />} />
              <Route path="/relatorios" element={<Relatorios />} />
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
  </ErrorBoundary>
);

export default App;

