"use client";

import { createContext, useContext } from "react";

type AgentsShellContextValue = {
  closeMobileSidebar: () => void;
};

const AgentsShellContext = createContext<AgentsShellContextValue | null>(null);

export function AgentsShellProvider({
  closeMobileSidebar,
  children,
}: {
  closeMobileSidebar: () => void;
  children: React.ReactNode;
}) {
  return (
    <AgentsShellContext.Provider value={{ closeMobileSidebar }}>
      {children}
    </AgentsShellContext.Provider>
  );
}

export function useAgentsShell() {
  const context = useContext(AgentsShellContext);
  return context ?? { closeMobileSidebar: () => {} };
}
