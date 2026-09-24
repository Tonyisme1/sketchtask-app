import React from "react";
import { SettingsView } from "../../../components/shared/settings/SettingsView";

export type DesktopSettingsViewProps = Omit<
  React.ComponentProps<typeof SettingsView>,
  "platform"
>;

/** Desktop presentation adapter for the shared settings feature. */
export const DesktopSettingsView: React.FC<DesktopSettingsViewProps> = (props) => (
  <SettingsView {...props} platform="desktop" />
);
