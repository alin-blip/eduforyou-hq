import { ExternalLink } from "lucide-react";

const projects = [
  {
    name: "EduForYou Main",
    description: "Platforma B2C — programe de educație și carieră",
    url: "https://eduforyou.ro",
    metric: { label: "Studenți activi", value: "2.4K" },
    accent: "from-primary/30 to-primary-glow/10",
  },
  {
    name: "Agent Hub",
    description: "Rețeaua de agenți de recrutare",
    url: "#",
    metric: { label: "Agenți onboarded", value: "187" },
    accent: "from-accent/30 to-accent/5",
  },
  {
    name: "Partners SAAS",
    description: "AgencyOS — partenerii B2B și agențiile",
    url: "#",
    metric: { label: "Parteneri activi", value: "42" },
    accent: "from-warning/30 to-warning/5",
  },
  {
    name: "Webinar EduForYou",
    description: "Funnel-ul de webinar și înscrieri",
    url: "#",
    metric: { label: "Înscrieri lună", value: "1.2K" },
    accent: "from-primary-glow/30 to-primary/5",
  },
];

export function ProjectQuickLinks() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">Project Hub</h3>
          <p className="text-xs text-muted-foreground">Acces rapid la ecosistem</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className={`group relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br ${p.accent} p-4 transition-all hover:border-primary/50 hover:shadow-card`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-foreground">
                {p.metric.value}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {p.metric.label}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
