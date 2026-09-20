import React from "react";
import {
  AIAssistantView,
} from "../../components/shared/ai/AIAssistantView";
import {
  AIScreenModel,
  useAIScreenModel,
} from "../../features/ai/model/createAIScreenModel";

export interface TabletAIAssistantPageProps {
  model?: AIScreenModel;
  onBack?: () => void;
  isStandalone?: boolean;
}

export const TabletAIAssistantPage: React.FC<TabletAIAssistantPageProps> = ({
  model: propModel,
  ...viewProps
}) => {
  const defaultModel = useAIScreenModel();
  const model = propModel || defaultModel;

  return <AIAssistantView {...model} {...viewProps} />;
};
