import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      icon={Settings}
      title="Settings & Organization"
      description="Profil companie, departamente, roluri, invitații membri, branding."
      wave={2}
      features={[
        "Profil companie: nume, logo, fuse orar, monedă",
        "Departamente configurabile cu manager și buget",
        "Roluri: CEO, Executive, Manager, Member · permisiuni granulare",
        "Invitații membri prin email cu rol predefinit",
        "Branding: temă, accent color, locale (RO/EN)",
      ]}
    />
  );
}
