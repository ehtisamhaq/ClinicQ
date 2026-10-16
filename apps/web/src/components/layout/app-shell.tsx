"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHeartbeat,
  IconRobot,
  IconCalendar,
  IconClockPlay,
  IconUserCheck,
  IconStethoscope,
  IconDashboard,
  IconUsers,
  IconCalendarEvent,
  IconBook,
  IconTimeline,
  IconLogin,
  IconUser,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface AppShellProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "PATIENT" | "RECEPTIONIST" | "DOCTOR" | "ADMIN";
  } | null;
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();

  // Navigation sections based on active user or guest preview
  const patientItems: NavItem[] = [
    { title: "AI Booking Assistant", href: "/assistant", icon: IconRobot },
    { title: "Book a Doctor", href: "/book", icon: IconCalendar },
    { title: "My Appointments", href: "/appointments", icon: IconCalendarEvent },
    { title: "Live Queue Track", href: "/track", icon: IconClockPlay },
  ];

  const staffItems: NavItem[] = [
    { title: "Live Queue Board", href: "/queue", icon: IconUserCheck },
    { title: "Walk-in Booking", href: "/walk-in", icon: IconUsers },
  ];

  const doctorItems: NavItem[] = [
    { title: "Today's Consultations", href: "/today", icon: IconStethoscope },
  ];

  const adminItems: NavItem[] = [
    { title: "Analytics Dashboard", href: "/dashboard", icon: IconDashboard },
    { title: "Doctors & Schedules", href: "/doctors", icon: IconUsers },
    { title: "Clinic Knowledge Base", href: "/knowledge", icon: IconBook },
    { title: "Agent Traces", href: "/agent-traces", icon: IconTimeline },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="border-b border-border/50 p-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
                <IconHeartbeat className="h-5 w-5" />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-heading text-base font-bold tracking-tight">
                  Clinic<span className="text-primary font-normal">Q</span>
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                  Dhaka Central Clinic
                </span>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-2 py-3">
            {/* Patient navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2">
                Patient Care
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {patientItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                              {item.badge}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Reception / Staff (Visible to reception or admin) */}
            {(!user || user.role === "RECEPTIONIST" || user.role === "ADMIN") && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2">
                  Reception
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {staffItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            render={<Link href={item.href} />}
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Doctor Navigation */}
            {(!user || user.role === "DOCTOR" || user.role === "ADMIN") && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2">
                  Doctor
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {doctorItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            render={<Link href={item.href} />}
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Admin Management */}
            {(!user || user.role === "ADMIN") && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2">
                  Administration
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            render={<Link href={item.href} />}
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-border/50 p-3">
            <div className="flex items-center justify-between gap-2">
              {user ? (
                <div className="flex items-center gap-2 truncate text-xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    <IconUser className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="font-medium truncate">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{user.role}</span>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <IconLogin className="h-4 w-4" />
                  <span>Staff / Sign In</span>
                </Link>
              )}
              <ThemeToggle />
            </div>
          </SidebarFooter>
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
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* Page body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
