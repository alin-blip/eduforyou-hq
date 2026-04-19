import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Entity {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_default: boolean;
}

interface EntityContextValue {
  entities: Entity[];
  current: Entity | null;
  setCurrent: (e: Entity) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const EntityContext = createContext<EntityContextValue | undefined>(undefined);

export function EntityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [current, setCurrentState] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name");
    if (!error && data) {
      setEntities(data as Entity[]);
      const stored = localStorage.getItem("efy_entity_id");
      const found = data.find((e) => e.id === stored) ?? data.find((e) => e.is_default) ?? data[0];
      if (found) setCurrentState(found as Entity);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) load();
    else {
      setEntities([]);
      setCurrentState(null);
      setIsLoading(false);
    }
  }, [user]);

  const setCurrent = (e: Entity) => {
    setCurrentState(e);
    localStorage.setItem("efy_entity_id", e.id);
  };

  return (
    <EntityContext.Provider value={{ entities, current, setCurrent, isLoading, refresh: load }}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntity must be used within EntityProvider");
  return ctx;
}
