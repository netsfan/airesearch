import { getTableSummary } from "@/lib/data/getTableSummary";
import { mockSources } from "@/lib/data/mockTables";
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
    name: "generate_python_code",
    description: "Generate Python code to be inserted into the user's Jupyter notebook as a new code cell. Use this when the user asks for Python code, data analysis, plotting, or any task that should run in a notebook.",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "The Python code to insert into a notebook cell" }
      },
      required: ["code"],
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

  const code = String(call.arguments.code ?? "").trim();
  return { pythonCode: code };
}
