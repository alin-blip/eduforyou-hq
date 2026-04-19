import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number; // % change
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  index?: number;
}

const toneStyles: Record<string, string> = {
  default: "from-primary/20 to-primary-glow/10 text-primary",
  success: "from-accent/20 to-accent/5 text-accent",
  warning: "from-warning/20 to-warning/5 text-warning",
  danger: "from-destructive/20 to-destructive/5 text-destructive",
};

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  tone = "default",
  index = 0,
}: KpiCardProps) {
  const positive = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass-card group relative overflow-hidden rounded-xl p-5 transition-all hover:border-primary/40 hover:shadow-elegant"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity group-hover:opacity-70",
          toneStyles[tone],
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg bg-card/80 backdrop-blur",
            toneStyles[tone].split(" ").pop(),
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {delta !== undefined && (
        <div className="relative mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              positive ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs luna trecută</span>
        </div>
      )}
    </motion.div>
  );
}
