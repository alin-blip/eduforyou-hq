import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEntity } from "@/hooks/useEntity";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function EntitySwitcher() {
  const { entities, current, setCurrent } = useEntity();
  const { isAdmin } = useAuth();

  if (!current) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 border border-border/50 bg-card/50 px-2.5 hover:bg-card"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-primary">
            <Building2 className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="hidden max-w-[120px] truncate text-xs font-medium sm:inline">
            {current.name}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Entități
        </DropdownMenuLabel>
        {entities.map((e) => (
          <DropdownMenuItem
            key={e.id}
            onClick={() => setCurrent(e)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs font-medium">{e.name}</span>
                {e.description && (
                  <span className="line-clamp-1 text-[10px] text-muted-foreground">
                    {e.description}
                  </span>
                )}
              </div>
            </div>
            {current.id === e.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              <Plus className="mr-2 h-3 w-3" />
              Adaugă entitate (în curând)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
