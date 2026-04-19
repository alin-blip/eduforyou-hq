import { createContext, useContext, useState, type ReactNode } from "react";

interface CopilotContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const CopilotContext = createContext<CopilotContextValue | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CopilotContext.Provider value={{ open, setOpen, toggle: () => setOpen((v) => !v) }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider");
  return ctx;
}
