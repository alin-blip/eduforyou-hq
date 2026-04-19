import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaceScoreProps {
  score: number; // 0-100
  breakdown: { label: string; value: number }[];
}

export function PaceScore({ score, breakdown }: PaceScoreProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const tier =
    score >= 80
      ? { label: "Excellent", color: "text-accent" }
      : score >= 60
        ? { label: "Healthy", color: "text-primary" }
        : score >= 40
          ? { label: "At Risk", color: "text-warning" }
          : { label: "Critical", color: "text-destructive" };

  return (
    <div className="glass-card relative overflow-hidden rounded-xl p-6">
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
        <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              strokeWidth="10"
              className="fill-none stroke-muted/40"
            />
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              strokeWidth="10"
              strokeLinecap="round"
              className="fill-none"
              stroke="url(#paceGradient)"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            />
            <defs>
              <linearGradient id="paceGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex flex-col items-center text-center">
            <span className="font-display text-5xl font-bold gradient-text">{score}</span>
            <span className={cn("text-xs font-semibold uppercase tracking-widest", tier.color)}>
              {tier.label}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-display text-lg font-semibold">PACE™ Score</h3>
            <p className="text-sm text-muted-foreground">
              Sănătatea operațională a companiei pe 4 dimensiuni
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {breakdown.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border/50 bg-card/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="font-mono text-sm font-semibold">{item.value}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
