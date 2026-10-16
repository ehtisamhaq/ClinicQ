"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon-sm" className="opacity-0">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Toggle dark/light theme"
    >
      {theme === "dark" ? (
        <IconSun className="h-4 w-4 text-amber-400" />
      ) : (
        <IconMoon className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
