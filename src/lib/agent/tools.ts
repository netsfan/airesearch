import { getTableSummary } from "@/lib/data/getTableSummary";
import { mockSources } from "@/lib/data/mockTables";
import type { NotebookCellType } from "@/types";
import type { AgentExecutionContext, ToolCall } from "./types";

export const agentTools = [
  {
    type: "function",
    name: "list_tables",
    description: "List available tables and basic metadata.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "summarize_table",
    description: "Return deterministic summary for one table.",
    parameters: {
      type: "object",
      properties: {
        tableName: { type: "string", description: "Exact table name" }
      },
      required: ["tableName"],
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "create_notebook_cell",
    description: "Create a notebook cell mutation.",
    parameters: {
      type: "object",
      properties: {
        cellType: { type: "string", enum: ["markdown", "sql"] },
        content: { type: "string" }
      },
      required: ["cellType", "content"],
      additionalProperties: false
    }
  }
];

export function executeTool(call: ToolCall, context: AgentExecutionContext) {
  if (call.name === "list_tables") {
    return {
      tables: mockSources.flatMap((source) =>
        source.tables.map((table) => ({
          source: source.name,
          tableName: table.name,
          columns: table.columns,
          rowCount: table.rows.length
        }))
      )
    };
  }

  if (call.name === "summarize_table") {
    const requestedTableName = String(call.arguments.tableName ?? "").trim();
    const tableName = requestedTableName || context.selectedTable || "";
    return getTableSummary(tableName);
  }

  const cellType = call.arguments.cellType === "sql" ? "sql" : "markdown";
  const content = String(call.arguments.content ?? "").trim();

  return {
    notebookCell: {
      type: cellType as NotebookCellType,
      content
    }
  };
}
