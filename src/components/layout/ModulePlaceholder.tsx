import { type LucideIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  wave: 2 | 3;
}

export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
  features,
  wave,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-warning" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Val {wave} · în pregătire
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card relative overflow-hidden rounded-xl p-8"
      >
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-glow" />

        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div className="flex flex-col items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
              <Icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Modul în construcție</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Acest modul se livrează în <strong className="text-foreground">Val {wave}</strong>{" "}
                al planului EduForYou OS. Foundation-ul (Val 1) este live — următorul pas
                construiește acest spațiu cu date reale și interacțiuni complete.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {wave === 2 ? "Următorul val" : "Val final"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Ce va include
            </p>
            <ul className="space-y-2">
              {features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/40 p-3"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-primary" />
                  <span className="text-sm text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
