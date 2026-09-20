import React from "react";
import { SettingsView } from "../../components/shared/settings/SettingsView";
import {
  SettingsScreenModel,
  useSettingsScreenModel,
} from "../../features/settings/model/createSettingsScreenModel";

export type MobileSettingsPageProps = Omit<
  React.ComponentProps<typeof SettingsView>,
  keyof SettingsScreenModel
> & { model?: SettingsScreenModel };

export const MobileSettingsPage: React.FC<MobileSettingsPageProps> = ({
  model: propModel,
  ...viewProps
}) => {
  const defaultModel = useSettingsScreenModel();
  const model = propModel || defaultModel;

  return <SettingsView {...model} {...viewProps} platform="mobile" hideMobileDetailHeader />;
};
