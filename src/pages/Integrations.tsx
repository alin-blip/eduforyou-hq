import { Plug } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function IntegrationsPage() {
  return (
    <ModulePlaceholder
      icon={Plug}
      title="Integrări Marketing & Data"
      description="Meta Ads, Google Analytics, GTM, GoHighLevel, SimilarWeb — date reale, refresh automat."
      wave={3}
      features={[
        "Meta Ads (Facebook + Instagram) — campanii, spend, ROAS, CPL",
        "Google Analytics 4 — sesiuni, conversii, surse trafic, funnel",
        "Google Tag Manager — listă tag-uri, status, audit",
        "GoHighLevel (GHL) — leads, pipeline, contacte, conversii",
        "SimilarWeb — trafic competitori, ranking, growth signals",
        "OAuth + refresh token management prin edge functions",
      ]}
    />
  );
}
