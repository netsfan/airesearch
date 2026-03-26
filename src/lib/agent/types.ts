import type { NotebookContext } from "@/types";

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentInput = {
  message: string;
  selectedTable?: string;
  notebookContext: NotebookContext | null;
  chatHistory?: ChatHistoryMessage[];
};

export type AgentResponse = {
  reply: string;
  pythonCode?: string;
};

export type ToolName = "list_tables" | "summarize_table" | "generate_python_code";

export type ToolCall = {
  name: ToolName;
  arguments: Record<string, unknown>;
};

export type AgentExecutionContext = {
  selectedTable?: string;
};
