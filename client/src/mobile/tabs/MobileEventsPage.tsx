import React from "react";
import { NavigationTarget } from "../../types";
import { EventsWorkspace } from "../../features/events/EventsWorkspace";

export interface MobileEventsPageProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
}

export const MobileEventsPage: React.FC<MobileEventsPageProps> = ({ navigationTarget, onClearNavigationTarget }) => {
  return <EventsWorkspace navigationTarget={navigationTarget} onClearNavigationTarget={onClearNavigationTarget} />;
};
