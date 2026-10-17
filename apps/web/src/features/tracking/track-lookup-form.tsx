"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TrackLookupForm() {
  const router = useRouter();
  const [token, setToken] = React.useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken) return;
    router.push(`/track/${encodeURIComponent(cleanToken)}`);
  };

  return (
    <form onSubmit={handleTrack} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="e.g. appt_trk_91e7c..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="pl-9 text-sm"
            required
            autoFocus
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full gap-2 text-sm font-semibold"
        disabled={!token.trim()}
      >
        <span>Track Live Queue</span>
        <IconArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
