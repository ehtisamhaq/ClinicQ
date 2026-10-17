import * as React from "react";
import { getSessionUser } from "@/lib/auth/session";
import { SidebarNavClient, SidebarNavSkeleton } from "./sidebar-nav-client";

export { SidebarNavSkeleton };

export async function SidebarNav() {
  const user = await getSessionUser();
  return <SidebarNavClient user={user} />;
}
