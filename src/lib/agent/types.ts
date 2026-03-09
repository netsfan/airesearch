import type { NotebookCellType } from "@/types";

export type AgentInput = {
  message: string;
  selectedTable?: string;
  notebookContext: Array<{ type: NotebookCellType; content: string }>;
};

export type AgentResponse = {
  reply: string;
  notebookCell?: {
    type: NotebookCellType;
    content: string;
  };
};

export type ToolName = "list_tables" | "summarize_table" | "create_notebook_cell";

export type ToolCall = {
  name: ToolName;
  arguments: Record<string, unknown>;
};

export type AgentExecutionContext = {
  selectedTable?: string;
};
