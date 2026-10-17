"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconRobot,
  IconCalendar,
  IconCalendarEvent,
  IconClockPlay,
  IconUserCheck,
  IconUsers,
  IconStethoscope,
  IconDashboard,
  IconBook,
  IconTimeline,
  IconUser,
  IconLogout,
  IconLogin,
  IconBuildingHospital,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/api/types";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface SidebarNavClientProps {
  user: SessionUser | null;
}

export function SidebarNavClient({ user }: SidebarNavClientProps) {
  const pathname = usePathname();

  // Role-specific navigation sets
  const patientItems: NavItem[] = [
    { title: "AI Booking Assistant", href: "/assistant", icon: IconRobot },
    { title: "Book a Doctor", href: "/book", icon: IconCalendar },
    { title: "My Appointments", href: "/appointments", icon: IconCalendarEvent },
    { title: "Live Queue Track", href: "/track", icon: IconClockPlay },
  ];

  const doctorItems: NavItem[] = [
    { title: "Today's Consultations", href: "/today", icon: IconStethoscope },
    { title: "All Appointments", href: "/appointments", icon: IconCalendarEvent },
    { title: "Live Queue Board", href: "/queue", icon: IconUserCheck },
  ];

  const receptionistItems: NavItem[] = [
    { title: "Live Queue Board", href: "/queue", icon: IconUserCheck },
    { title: "Walk-in Booking", href: "/walk-in", icon: IconUsers },
    { title: "Book a Doctor", href: "/book", icon: IconCalendar },
  ];

  const adminItems: NavItem[] = [
    { title: "Analytics Dashboard", href: "/dashboard", icon: IconDashboard },
    { title: "Doctors & Schedules", href: "/doctors", icon: IconUsers },
    { title: "Clinic Knowledge Base", href: "/knowledge", icon: IconBook },
    { title: "Agent Traces", href: "/agent-traces", icon: IconTimeline },
    { title: "Live Queue Board", href: "/queue", icon: IconUserCheck },
    { title: "Walk-in Booking", href: "/walk-in", icon: IconUsers },
  ];

  // Determine what navigation sections to show based on authenticated role
  const isDoctor = user?.role === "DOCTOR";
  const isReceptionist = user?.role === "RECEPTIONIST";
  const isAdmin = user?.role === "ADMIN";
  const isPatientOrGuest = !user || user.role === "PATIENT";

  return (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto">
      {/* Navigation Sections */}
      <div className="space-y-6 px-3 py-3">
        {/* Doctor Navigation */}
        {isDoctor && (
          <div>
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Clinical Practice
            </div>
            <ul className="space-y-1">
              {doctorItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Receptionist Navigation */}
        {isReceptionist && (
          <div>
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Front Desk Operations
            </div>
            <ul className="space-y-1">
              {receptionistItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Admin Navigation */}
        {isAdmin && (
          <div>
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Clinic Administration
            </div>
            <ul className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Patient / Guest Navigation */}
        {isPatientOrGuest && (
          <div>
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Patient Care
            </div>
            <ul className="space-y-1">
              {patientItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* User Session Footer */}
      <div className="border-t border-border/50 p-3 mt-auto bg-muted/20">
        {user ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 truncate text-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                {user.name ? user.name[0] : <IconUser className="h-4 w-4" />}
              </div>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-foreground truncate">{user.name}</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {user.role}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <button
                onClick={() => logoutAction()}
                title="Sign Out"
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <IconLogout className="h-4 w-4" />
                <span className="sr-only">Sign out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <Link
              href="/login"
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-muted"
            >
              <IconLogin className="h-4 w-4" />
              <span>Staff Sign In</span>
            </Link>
            <ThemeToggle />
          </div>
        )}
      </div>
    </div>
  );
}

export function SidebarNavSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-between p-3 animate-pulse">
      <div className="space-y-4">
        <div className="h-3 w-20 rounded bg-muted/60" />
        <div className="space-y-2">
          <div className="h-8 rounded-lg bg-muted/40" />
          <div className="h-8 rounded-lg bg-muted/40" />
          <div className="h-8 rounded-lg bg-muted/40" />
        </div>
      </div>
      <div className="border-t border-border/50 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted/60" />
          <div className="space-y-1">
            <div className="h-3 w-16 rounded bg-muted/60" />
            <div className="h-2 w-10 rounded bg-muted/40" />
          </div>
        </div>
        <div className="h-7 w-7 rounded-md bg-muted/40" />
      </div>
    </div>
  );
}
