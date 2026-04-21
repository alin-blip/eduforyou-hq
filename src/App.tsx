import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/hooks/useAuth";
import { EntityProvider } from "@/hooks/useEntity";
import { CopilotProvider } from "@/hooks/useCopilot";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { CopilotDrawer } from "@/components/copilot/CopilotDrawer";

import Index from "./pages/Index.tsx";
import AuthPage from "./pages/Auth.tsx";
import OkrPage from "./pages/Okr.tsx";
import VisionPage from "./pages/Vision.tsx";
import StrategyTreesPage from "./pages/StrategyTrees.tsx";
import TeamsPage from "./pages/Teams.tsx";
import CiclesPage from "./pages/Cicles.tsx";
import TasksPage from "./pages/Tasks.tsx";
import CfoPage from "./pages/Cfo.tsx";
import SalesPage from "./pages/Sales.tsx";
import OpsPage from "./pages/Ops.tsx";
import AccountabilityPage from "./pages/Accountability.tsx";
import ProjectsPage from "./pages/Projects.tsx";
import IntegrationsPage from "./pages/Integrations.tsx";
import ReportsPage from "./pages/Reports.tsx";
import SettingsPage from "./pages/Settings.tsx";
import GhlUsersPage from "./pages/GhlUsers.tsx";
import DailyReportPage from "./pages/DailyReport.tsx";
import WeeklyKpisPage from "./pages/WeeklyKpis.tsx";
import SlaTrackerPage from "./pages/SlaTracker.tsx";
import StudentPipelinePage from "./pages/StudentPipeline.tsx";
import MonthlyDashboardPage from "./pages/MonthlyDashboard.tsx";
import AgentsPage from "./pages/Agents.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <EntityProvider>
            <NotificationsProvider>
              <CopilotProvider>
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
                  <Route path="/vision" element={<VisionPage />} />
                  <Route path="/strategy-trees" element={<StrategyTreesPage />} />
                  <Route path="/okr" element={<OkrPage />} />
                  <Route path="/accountability" element={<AccountabilityPage />} />
                  <Route path="/teams" element={<TeamsPage />} />
                  <Route path="/cicles" element={<CiclesPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/ops" element={<OpsPage />} />
                  <Route path="/cfo" element={<CfoPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/ghl-users" element={<GhlUsersPage />} />
                  <Route path="/daily-report" element={<DailyReportPage />} />
                  <Route path="/weekly-kpis" element={<WeeklyKpisPage />} />
                  <Route path="/sla-tracker" element={<SlaTrackerPage />} />
                  <Route path="/pipeline" element={<StudentPipelinePage />} />
                  <Route path="/monthly-dashboard" element={<MonthlyDashboardPage />} />
                  <Route path="/agents" element={<AgentsPage />} />
                </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CopilotDrawer />
              </CopilotProvider>
            </NotificationsProvider>
          </EntityProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
