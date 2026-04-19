import { Bell, Search, Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="hidden flex-1 items-center md:flex">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Caută OKR, task, persoană, proiect…"
            className="h-9 w-full rounded-lg border border-border/60 bg-card/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" className="hidden bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90 sm:inline-flex">
          <Plus className="h-4 w-4" />
          Nou
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-destructive p-0 text-[9px] text-destructive-foreground">
            3
          </Badge>
        </Button>

        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 p-1 pr-3">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-primary text-[11px] font-semibold text-primary-foreground">
              CE
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-xs font-semibold text-foreground">Cătălin E.</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">CEO</span>
          </div>
        </div>
      </div>
    </header>
  );
}
