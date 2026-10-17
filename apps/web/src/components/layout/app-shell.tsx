"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHeartbeat, IconChevronRight } from "@tabler/icons-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function AppShell({ children, sidebar }: AppShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="border-b border-border/50 p-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all group-hover:scale-105">
                <IconHeartbeat className="h-5 w-5" />
              </div>
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-base font-bold tracking-tight">
                    Clinic<span className="text-primary font-semibold">Q</span>
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5 font-semibold">
                    PRO
                  </Badge>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                  Dhaka Central Clinic
                </span>
              </div>
            </Link>
          </SidebarHeader>

          {sidebar}
        </Sidebar>

        <SidebarInset className="flex flex-col min-w-0">
          {/* Header banner */}
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <IconChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground capitalize">
                {pathname.replace(/^\//, "").replace(/-/g, " ") || "Dashboard"}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>Live Sync • Dhaka Central</span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
