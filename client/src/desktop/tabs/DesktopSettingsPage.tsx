import React from "react";
import { DesktopSettingsView } from "../components/settings/DesktopSettingsView";
import {
  SettingsScreenModel,
  useSettingsScreenModel,
} from "../../features/settings/model/createSettingsScreenModel";

export type DesktopSettingsPageProps = Omit<
  React.ComponentProps<typeof DesktopSettingsView>,
  keyof SettingsScreenModel
> & { model?: SettingsScreenModel };

export const DesktopSettingsPage: React.FC<DesktopSettingsPageProps> = ({
  model: propModel,
  ...viewProps
}) => {
  const defaultModel = useSettingsScreenModel();
  const model = propModel || defaultModel;

  return <DesktopSettingsView {...model} {...viewProps} />;
};
