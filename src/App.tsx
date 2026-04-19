import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import Index from "./pages/Index.tsx";
import AuthPage from "./pages/Auth.tsx";
import OkrPage from "./pages/Okr.tsx";
import TeamsPage from "./pages/Teams.tsx";
import CiclesPage from "./pages/Cicles.tsx";
import TasksPage from "./pages/Tasks.tsx";
import CfoPage from "./pages/Cfo.tsx";
import ProjectsPage from "./pages/Projects.tsx";
import IntegrationsPage from "./pages/Integrations.tsx";
import ReportsPage from "./pages/Reports.tsx";
import SettingsPage from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/okr" element={<OkrPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/cicles" element={<CiclesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/cfo" element={<CfoPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
