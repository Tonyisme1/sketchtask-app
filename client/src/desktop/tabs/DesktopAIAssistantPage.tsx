import React from "react";
import {
  AIAssistantView,
} from "../../components/shared/ai/AIAssistantView";
import {
  AIScreenModel,
  useAIScreenModel,
} from "../../features/ai/model/createAIScreenModel";

export interface DesktopAIAssistantPageProps {
  model?: AIScreenModel;
  onBack?: () => void;
  isStandalone?: boolean;
}

export const DesktopAIAssistantPage: React.FC<DesktopAIAssistantPageProps> = ({
  model: propModel,
  ...viewProps
}) => {
  const defaultModel = useAIScreenModel();
  const model = propModel || defaultModel;

  return <AIAssistantView {...model} {...viewProps} />;
};
