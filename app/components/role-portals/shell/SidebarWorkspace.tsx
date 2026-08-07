"use client";

import HubCard from "./HubCard";

export interface SidebarWorkspaceProps {
  unreadCount?: number;
  attention?: boolean;
  active?: boolean;
  onOpen(): void;
}

/**
 * Compatibility wrapper. The former current-workspace card is now the
 * permanent Eleeveon Hub entry while preserving its location and dimensions.
 */
export default function SidebarWorkspace(props: SidebarWorkspaceProps) {
  return <HubCard {...props} />;
}
