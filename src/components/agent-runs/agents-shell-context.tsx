"use client";

import { createContext, useContext } from "react";

type AgentsShellContextValue = {
  closeMobileSidebar: () => void;
  focusSidebarSearch: () => void;
};

const AgentsShellContext = createContext<AgentsShellContextValue | null>(null);

export function AgentsShellProvider({
  closeMobileSidebar,
  focusSidebarSearch,
  children,
}: {
  closeMobileSidebar: () => void;
  focusSidebarSearch: () => void;
  children: React.ReactNode;
}) {
  return (
    <AgentsShellContext.Provider
      value={{ closeMobileSidebar, focusSidebarSearch }}
    >
      {children}
    </AgentsShellContext.Provider>
  );
}

export function useAgentsShell() {
  const context = useContext(AgentsShellContext);
  return (
    context ?? {
      closeMobileSidebar: () => {},
      focusSidebarSearch: () => {},
    }
  );
}
