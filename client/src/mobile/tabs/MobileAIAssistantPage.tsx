import React from "react";
import {
  AIAssistantView,
} from "../../components/shared/ai/AIAssistantView";
import {
  AIScreenModel,
  useAIScreenModel,
} from "../../features/ai/model/createAIScreenModel";

export interface MobileAIAssistantPageProps {
  model?: AIScreenModel;
  onBack?: () => void;
  isStandalone?: boolean;
}

export const MobileAIAssistantPage: React.FC<MobileAIAssistantPageProps> = ({
  model: propModel,
  ...viewProps
}) => {
  const defaultModel = useAIScreenModel();
  const model = propModel || defaultModel;

  return <AIAssistantView {...model} {...viewProps} />;
};
