"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconRobot,
  IconUser,
  IconSend,
  IconSparkles,
  IconAlertTriangle,
  IconCheck,
  IconCalendar,
  IconClock,
  IconStethoscope,
  IconTicket,
  IconArrowRight,
  IconLoader,
  IconStopwatch,
  IconLanguage,
  IconHelpCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { AssistantMessage, SlotProposal, BookingConfirmedData } from "@/lib/assistant/types";
import { streamAssistantConversation } from "@/lib/assistant/sse-client";

const STARTER_PROMPTS = [
  {
    label: "Headache & Nausea",
    prompt: "I have had a severe throbbing headache and nausea since yesterday.",
  },
  {
    label: "Orthopedic Specialist",
    prompt: "I need to see an orthopedic doctor tomorrow for knee pain under ৳1500.",
  },
  {
    label: "Clinic Timings & Fees",
    prompt: "What are your clinic visiting hours, consultation fees, and available services?",
  },
  {
    label: "Bangla Symptom Triage",
    prompt: "আমার বুকে হালকা চাপ লাগছে এবং শ্বাসকষ্ট হচ্ছে।",
  },
];

interface AssistantChatProps {
  initialLanguage?: string;
}

export function AssistantChat({ initialLanguage = "en" }: AssistantChatProps) {
  const [messages, setMessages] = React.useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        initialLanguage === "bn"
          ? "স্বাগতম! আমি ClinicQ এর এআই বুকিং সহকারী। আপনার স্বাস্থ্য সমস্যা বা প্রয়োজনীয় বিশেষজ্ঞ সম্পর্কে বলুন, আমি সঠিক ডাক্তার ও সময়সূচী খুঁজে দেব।"
          : "Hello! I am ClinicQ's AI Booking Assistant. Describe your symptoms or what specialist you need, and I'll find the best doctor and slot for you.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = React.useState("");
  const [locale, setLocale] = React.useState<string>(initialLanguage);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [currentToolStatus, setCurrentToolStatus] = React.useState<string | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolStatus]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isStreaming) return;

    setInput("");
    const userMsgId = `user-${crypto.randomUUID()}`;
    const userMsg: AssistantMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsStreaming(true);
    setCurrentToolStatus(null);

    const assistantMsgId = `assistant-${crypto.randomUUID()}`;
    let accumulatedText = "";
    let capturedProposal: SlotProposal | null = null;
    let capturedConfirmed: BookingConfirmedData | null = null;
    let capturedEmergency: boolean = false;

    // Temporary placeholder for streaming message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Map history for backend engine format
      const apiPayloadMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const stream = streamAssistantConversation(
        apiPayloadMessages,
        locale,
        abortController.signal
      );

      for await (const event of stream) {
        if (event.event === "text") {
          const textChunk = (event.data as { text?: string })?.text || "";
          accumulatedText = textChunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulatedText, toolStatus: null }
                : m
            )
          );
        } else if (event.event === "tool_status") {
          const statusMsg = (event.data as { message?: string })?.message || "Thinking...";
          setCurrentToolStatus(statusMsg);
        } else if (event.event === "proposal") {
          capturedProposal = event.data as SlotProposal;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, proposal: capturedProposal } : m
            )
          );
        } else if (event.event === "booking_confirmed") {
          capturedConfirmed = event.data as BookingConfirmedData;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, bookingConfirmed: capturedConfirmed }
                : m
            )
          );
          toast.success("Appointment successfully booked by assistant!");
        } else if (event.event === "emergency") {
          capturedEmergency = true;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, isEmergency: true } : m
            )
          );
        } else if (event.event === "error") {
          const errText = (event.data as { message?: string })?.message || "An error occurred";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, error: errText } : m
            )
          );
        } else if (event.event === "done") {
          setCurrentToolStatus(null);
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        // User stopped generation
      } else {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Could not connect to the booking assistant. You can use manual booking below.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    accumulatedText ||
                    "I encountered an issue connecting to the clinical engine. Please try again or use the manual doctor directory.",
                  error: errorMsg,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setCurrentToolStatus(null);
      abortControllerRef.current = null;
    }
  };

  const handleStopStream = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setCurrentToolStatus(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <IconRobot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                ClinicQ AI Assistant
              </h2>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Adaptive Triage
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Conversational slot finder, constraint replanner & emergency screener
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5 bg-background">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                locale === "en"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale("bn")}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                locale === "bn"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              বাংলা
            </button>
          </div>

          <Button
            render={<Link href="/book" />}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
          >
            <IconCalendar className="h-3.5 w-3.5" />
            Manual Calendar
          </Button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconRobot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] space-y-2 rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/40 border border-border/80 text-foreground shadow-xs"
                }`}
              >
                {/* Emergency Alert Banner */}
                {msg.isEmergency && (
                  <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 space-y-1 text-destructive font-medium">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                      <IconAlertTriangle className="h-4 w-4 text-destructive" />
                      Critical Emergency Warning
                    </div>
                    <p className="text-xs">
                      If you or someone nearby is experiencing acute chest pain, severe shortness of breath, or sudden weakness, call <strong>999</strong> or proceed immediately to the nearest hospital emergency department.
                    </p>
                  </div>
                )}

                {/* Message Text Content */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content || (
                    <span className="inline-flex items-center gap-1 text-muted-foreground animate-pulse">
                      <IconSparkles className="h-3.5 w-3.5" /> Thinking...
                    </span>
                  )}
                </div>

                {/* Slot Proposal Card */}
                {msg.proposal && (
                  <Card className="border-primary/40 bg-card shadow-sm mt-3 text-foreground">
                    <CardHeader className="p-3.5 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                            <IconStethoscope className="h-4 w-4 text-primary" />
                            Dr. {msg.proposal.doctorName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {msg.proposal.specialty}
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="text-xs">
                          ৳{msg.proposal.fee}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-3.5 pt-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconClock className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {new Date(msg.proposal.startsAt).toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(msg.proposal.startsAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Replanned Relaxations Note */}
                      {msg.proposal.changesRelaxed && msg.proposal.changesRelaxed.length > 0 && (
                        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-300">
                          <strong>Note:</strong> We adjusted preferences to find this slot:{" "}
                          {msg.proposal.changesRelaxed.join(", ")}.
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-3.5 pt-1 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendMessage("Show other times")}
                        disabled={isStreaming}
                        className="text-xs h-7 px-3"
                      >
                        Other Times
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage("Yes, book this slot")}
                        disabled={isStreaming}
                        className="text-xs h-7 px-3 gap-1 font-semibold"
                      >
                        <IconCheck className="h-3.5 w-3.5" />
                        Yes, Book It
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* Booking Confirmed Card */}
                {msg.bookingConfirmed && (
                  <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-xs mt-3 text-foreground">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                        <IconCheck className="h-4 w-4 bg-emerald-600 text-white rounded-full p-0.5" />
                        Booking Confirmed Successfully!
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          render={<Link href={`/track/${msg.bookingConfirmed.trackingToken}`} />}
                          size="sm"
                          className="h-8 text-xs gap-1.5 shadow-xs"
                        >
                          <IconTicket className="h-3.5 w-3.5" />
                          Track Live Turn
                        </Button>
                        <Button
                          render={<Link href="/appointments" />}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          My Appointments
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error Banner with Manual Fallback */}
                {msg.error && (
                  <div className="mt-2 flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                    <span>{msg.error}</span>
                    <Button
                      render={<Link href="/book" />}
                      variant="outline"
                      size="sm"
                      className="w-fit h-7 text-xs"
                    >
                      Browse Manual Booking Calendar →
                    </Button>
                  </div>
                )}

                <div className="text-[10px] opacity-60 text-right">
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <IconUser className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live Tool Status Pill */}
        {currentToolStatus && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse pl-11">
            <IconLoader className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>{currentToolStatus}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts (if chat is fresh) */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 border-t border-border/40 pt-2 bg-muted/10">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Suggested Consultation Queries:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.prompt)}
                disabled={isStreaming}
                className="rounded-full border border-border/80 bg-background/80 hover:bg-muted px-3 py-1 text-[11px] font-medium text-foreground transition-all shadow-2xs text-left"
              >
                {p.label} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="border-t border-border/60 bg-background p-3 space-y-1.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder={
              locale === "bn"
                ? "আপনার সমস্যা লিখুন (যেমন: মাথা ব্যথা, বুকের চাপ, বিশেষজ্ঞ প্রয়োজন)..."
                : "Describe symptoms or constraints (e.g., knee pain, tomorrow morning under ৳1000)..."
            }
            className="flex-1 text-xs"
          />

          {isStreaming ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStopStream}
              className="gap-1.5 text-xs text-destructive border-destructive/40"
            >
              <IconStopwatch className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim()}
              size="sm"
              className="gap-1.5 text-xs font-semibold px-4"
            >
              <span>Send</span>
              <IconSend className="h-3.5 w-3.5" />
            </Button>
          )}
        </form>

        <p className="text-[10px] text-muted-foreground text-center">
          ClinicQ Assistant provides intelligent clinical triage and booking coordination, not formal diagnosis.
        </p>
      </div>
    </div>
  );
}
