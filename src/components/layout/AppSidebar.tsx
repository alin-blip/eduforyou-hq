import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Users,
  CalendarClock,
  CheckSquare,
  Wallet,
  Plug,
  FolderKanban,
  BarChart3,
  Settings,
  Sparkles,
  Eye,
  GitBranch,
  TrendingUp,
  ShieldCheck,
  Activity,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Overview",
    items: [{ title: "CEO Cockpit", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Strategy",
    items: [
      { title: "Vivid VISION", url: "/vision", icon: Eye },
      { title: "Strategy Trees", url: "/strategy-trees", icon: GitBranch },
      { title: "OKR & KPI", url: "/okr", icon: Target },
      { title: "Accountability", url: "/accountability", icon: ShieldCheck },
    ],
  },
  {
    label: "Execution",
    items: [
      { title: "Teams", url: "/teams", icon: Users },
      { title: "CICLES", url: "/cicles", icon: CalendarClock },
      { title: "Tasks", url: "/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Ops Scoreboard", url: "/ops", icon: Activity },
      { title: "Sales Pipeline", url: "/sales", icon: TrendingUp },
      { title: "Virtual CFO", url: "/cfo", icon: Wallet },
      { title: "Project Hub", url: "/projects", icon: FolderKanban },
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Data",
    items: [
      { title: "Integrations", url: "/integrations", icon: Plug },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold text-sidebar-accent-foreground">
                EduForYou
              </span>
              <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                Operating System
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    item.url === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <RouterNavLink
                          to={item.url}
                          end={item.url === "/"}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-primary" />
                          )}
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              active ? "text-primary" : "text-sidebar-foreground/70",
                            )}
                          />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </RouterNavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
