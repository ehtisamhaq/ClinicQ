import * as React from "react";
import { AppShell } from "./app-shell";
import { SidebarNav, SidebarNavSkeleton } from "./sidebar-nav";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      sidebar={
        <React.Suspense fallback={<SidebarNavSkeleton />}>
          <SidebarNav />
        </React.Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
