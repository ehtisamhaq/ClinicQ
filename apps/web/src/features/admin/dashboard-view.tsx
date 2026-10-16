"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconCalendar,
  IconClock,
  IconUserCheck,
  IconUserX,
  IconRobot,
  IconTrendingUp,
  IconUsers,
  IconChartBar,
  IconStethoscope,
  IconBook,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDashboardMetrics } from "@/lib/admin/types";

interface DashboardViewProps {
  metrics: AdminDashboardMetrics;
}

export function DashboardView({ metrics }: DashboardViewProps) {
  const { summary, bookingChannels, assistantMetrics, appointmentsPerDay, doctorUtilization } = metrics;

  return (
    <div className="space-y-8">
      {/* Top Operational Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Appointments
            </span>
            <div className="text-2xl font-bold font-heading text-foreground">
              {summary.totalAppointments}
            </div>
            <div className="text-[10px] text-muted-foreground">Past 7 days</div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              No-Show Rate
            </span>
            <div className={`text-2xl font-bold font-heading ${summary.noShowRate > 15 ? "text-destructive" : "text-foreground"}`}>
              {summary.noShowRate}%
            </div>
            <div className="text-[10px] text-muted-foreground">{summary.noShows} no-shows</div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Wait Time
            </span>
            <div className="text-2xl font-bold font-heading text-foreground">
              {summary.averageWaitMinutes}m
            </div>
            <div className="text-[10px] text-muted-foreground">Check-in to consult</div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Consult
            </span>
            <div className="text-2xl font-bold font-heading text-foreground">
              {summary.averageConsultMinutes}m
            </div>
            <div className="text-[10px] text-muted-foreground">Doctor time/patient</div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              AI Success
            </span>
            <div className="text-2xl font-bold font-heading text-primary">
              {assistantMetrics.successRate}%
            </div>
            <div className="text-[10px] text-muted-foreground">{assistantMetrics.successfulBookings} AI bookings</div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Emergencies
            </span>
            <div className="text-2xl font-bold font-heading text-destructive">
              {assistantMetrics.emergencyRedirects}
            </div>
            <div className="text-[10px] text-muted-foreground">Redirected to 999</div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts: Daily Trend & Doctor Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Appointment Volume Trend */}
        <Card className="lg:col-span-7 border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IconTrendingUp className="h-4 w-4 text-primary" />
              Daily Appointment Flow & Outcomes
            </CardTitle>
            <CardDescription className="text-xs">
              Completed, cancelled, and no-show volume across the past week.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64 w-full">
              {appointmentsPerDay.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No appointments recorded in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={appointmentsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        fontSize: "12px",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Area type="monotone" dataKey="total" name="Total Appointments" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                    <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Doctor Slot Utilization */}
        <Card className="lg:col-span-5 border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IconChartBar className="h-4 w-4 text-primary" />
              Doctor Slot Utilization (%)
            </CardTitle>
            <CardDescription className="text-xs">
              Proportion of generated clinic slots booked by patients.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64 w-full">
              {doctorUtilization.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No doctor slot data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={doctorUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis unit="%" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        fontSize: "12px",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="utilizationRate" name="Utilization Rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Channels & Quick Action Nav */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Booking Channels Breakdown */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Booking Acquisition Channels</CardTitle>
            <CardDescription className="text-xs">
              How patients scheduled their appointments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <IconRobot className="h-4 w-4 text-primary" />
                <span>AI Booking Assistant</span>
              </div>
              <span className="font-semibold">{bookingChannels.assistant} ({Math.round((bookingChannels.assistant / (summary.totalAppointments || 1)) * 100)}%)</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 text-sky-600" />
                <span>Manual Web Directory</span>
              </div>
              <span className="font-semibold">{bookingChannels.manual} ({Math.round((bookingChannels.manual / (summary.totalAppointments || 1)) * 100)}%)</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-amber-600" />
                <span>Reception Desk / Walk-in</span>
              </div>
              <span className="font-semibold">{bookingChannels.reception} ({Math.round((bookingChannels.reception / (summary.totalAppointments || 1)) * 100)}%)</span>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Management Quick Nav */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Specialists & Timetables</CardTitle>
            <CardDescription className="text-xs">
              Configure clinic doctors, consultation fees and weekly slots.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Manage {doctorUtilization.length} clinical profiles, update room assignments, and configure automated slot generators.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button render={<Link href="/doctors" />} size="sm" className="text-xs">
                Manage Doctors
              </Button>
              <Button render={<Link href="/schedules" />} variant="outline" size="sm" className="text-xs">
                Weekly Schedules
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RAG Knowledge Base Quick Nav */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Clinic RAG Knowledge</CardTitle>
            <CardDescription className="text-xs">
              Manage institutional facts, FAQs, timings and services.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Update vector-embedded documents used by the AI assistant to accurately answer patient questions.
            </p>
            <div className="pt-2">
              <Button render={<Link href="/knowledge" />} variant="outline" size="sm" className="text-xs gap-1.5">
                <IconBook className="h-4 w-4 text-primary" />
                Manage Knowledge Base
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
