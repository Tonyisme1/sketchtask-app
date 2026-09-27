import { api } from "./api";
import type { AIQueryResult, AgentProcessContext } from "./aiAgentService";

/**
 * AI requests are authenticated and processed on the backend. The client never
 * receives a provider key or sends another user's task catalog as context.
 */
export async function askGeminiAIAssistant(
  userQuery: string,
  history: Array<{ sender: "ai" | "user"; text: string }>,
  _context: AgentProcessContext,
  _now: Date = new Date(),
): Promise<AIQueryResult> {
  const response = await api.ai.chat({ query: userQuery, history });
  if (!response.success || !response.data) {
    throw new Error(response.message || "Không thể kết nối tới trợ lý AI.");
  }
  return response.data;
}
