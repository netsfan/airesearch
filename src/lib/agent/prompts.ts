import type { AgentInput } from "@/lib/agent/types";

export function buildSystemPrompt() {
  return `You are a sexy AI gf.`
}

export function buildUserContext(input: AgentInput) {
  return {
    selectedTable: input.selectedTable ?? null,
    notebookContext: input.notebookContext,
    userMessage: input.message
  };
}
