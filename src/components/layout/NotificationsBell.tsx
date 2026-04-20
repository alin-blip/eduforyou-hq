import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Calendar, Target, RefreshCw, UserPlus, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNotifications, type Notification, type NotificationKind } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const kindIcon: Record<NotificationKind, typeof Bell> = {
  task: Check,
  meeting: Calendar,
  okr: Target,
  sync: RefreshCw,
  invite: UserPlus,
  system: Info,
};

const severityColor = {
  info: "text-primary",
  success: "text-success",
  warning: "text-amber-500",
  critical: "text-destructive",
} as const;

const severityBg = {
  info: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-amber-500/10",
  critical: "bg-destructive/10",
} as const;

export function NotificationsBell() {
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = async (n: Notification) => {
    if (!n.read) await markRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificări">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-destructive p-0 px-1 text-[9px] text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/50 p-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Notificări</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 gap-1 text-xs">
                <CheckCheck className="h-3 w-3" /> Marchează toate citite
              </Button>
            )}
          </div>
          <SheetDescription className="text-xs">
            {unreadCount > 0 ? `${unreadCount} necitite` : "Toate citite"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nicio notificare</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {notifications.map((n) => {
                const Icon = kindIcon[n.kind] ?? Info;
                const isCritical = n.severity === "critical";
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "group relative flex gap-3 p-4 transition-colors hover:bg-muted/30",
                      !n.read && "bg-primary/[0.03]",
                    )}
                  >
                    <button
                      onClick={() => handleClick(n)}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          severityBg[n.severity],
                        )}
                      >
                        {isCritical ? (
                          <AlertTriangle className={cn("h-4 w-4", severityColor[n.severity])} />
                        ) : (
                          <Icon className={cn("h-4 w-4", severityColor[n.severity])} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "line-clamp-2 text-sm leading-snug",
                              !n.read ? "font-semibold text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {n.title}
                          </p>
                          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                        {n.message && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ro })}
                        </p>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n.id);
                      }}
                      className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Șterge"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
