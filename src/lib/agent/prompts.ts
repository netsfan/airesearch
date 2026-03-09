import type { AgentInput } from "@/lib/agent/types";

export function buildSystemPrompt() {
  return `You are a concise data research assistant.
Use tools to answer questions about tables.
Rules:
- Never invent table names, row counts, columns, or metrics.
- Only answer from tool results.
- If details are missing, call tools first.
- You may call create_notebook_cell when it helps the user.
- Keep answers short.`;
}

export function buildUserContext(input: AgentInput) {
  return {
    selectedTable: input.selectedTable ?? null,
    notebookContext: input.notebookContext.slice(-3),
    userMessage: input.message
  };
}
