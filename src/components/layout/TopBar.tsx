import { LogOut, Search, Plus, User as UserIcon, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsBell } from "./NotificationsBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useCopilot } from "@/hooks/useCopilot";
import { EntitySwitcher } from "./EntitySwitcher";
import { SyncAlert } from "./SyncAlert";

const roleLabel: Record<string, string> = {
  ceo: "CEO",
  executive: "Executive",
  manager: "Manager",
  member: "Member",
};

export function TopBar() {
  const { user, roles, signOut } = useAuth();
  const { setOpen: setCopilotOpen } = useCopilot();
  const primaryRole = roles[0] ?? "member";
  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <EntitySwitcher />

      <div className="hidden flex-1 items-center md:flex">
        <button
          onClick={() => setCopilotOpen(true)}
          className="group relative w-full max-w-md text-left"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <div className="flex h-9 w-full items-center rounded-lg border border-border/60 bg-card/50 pl-9 pr-3 text-sm text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:bg-card">
            Întreabă AI Copilot sau caută…
          </div>
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <SyncAlert />

        <Button
          size="sm"
          variant="outline"
          onClick={() => setCopilotOpen(true)}
          className="hidden gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 sm:inline-flex"
        >
          <Sparkles className="h-3.5 w-3.5" /> AI Copilot
        </Button>

        <Button
          asChild
          size="sm"
          className="hidden bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90 sm:inline-flex"
        >
          <Link to="/okr">
            <Plus className="h-4 w-4" />
            Obiectiv
          </Link>
        </Button>

        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 p-1 pr-3 transition-colors hover:bg-card">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-primary text-[11px] font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col leading-tight md:flex">
                <span className="max-w-[140px] truncate text-xs font-semibold text-foreground">
                  {email}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-primary">
                  {roleLabel[primaryRole] ?? "Member"}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-xs font-medium">{email}</span>
                <span className="text-[10px] text-muted-foreground">
                  Roluri: {roles.map((r) => roleLabel[r]).join(", ") || "—"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <UserIcon className="mr-2 h-3.5 w-3.5" />
                Profil & Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Deconectare
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
