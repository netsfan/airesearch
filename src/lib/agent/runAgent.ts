import { createResponse, type ResponseInputItem } from "@/lib/utils/openai";
import { buildSystemPrompt, buildUserContext } from "./prompts";
import { agentTools, executeTool } from "./tools";
import type { AgentInput, AgentResponse, ToolCall } from "./types";

function parseFunctionCall(item: any): ToolCall | null {
  if (item?.type !== "function_call" || !item.name) return null;

  let parsedArguments: Record<string, unknown> = {};
  try {
    parsedArguments = item.arguments ? JSON.parse(item.arguments) : {};
  } catch {
    parsedArguments = {};
  }

  if (!["list_tables", "summarize_table", "create_notebook_cell"].includes(item.name)) return null;

  return { name: item.name, arguments: parsedArguments } as ToolCall;
}

function extractAssistantText(output: any[]): string {
  for (const item of output) {
    if (item.type === "message" && item.role === "assistant") {
      const textItem = item.content?.find((contentItem: any) => contentItem.type === "output_text");
      if (textItem?.text) return textItem.text;
    }
  }
  return "I could not produce an answer.";
}

export async function runAgent(input: AgentInput): Promise<AgentResponse> {
  let previousResponseId: string | undefined;
  let createdNotebookCell: AgentResponse["notebookCell"];
  let pendingInput: ResponseInputItem[] = [
    {
      type: "message",
      role: "system",
      content: [{ type: "input_text", text: buildSystemPrompt() }]
    },
    {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: JSON.stringify(buildUserContext(input)) }]
    }
  ];

  for (let step = 0; step < 6; step += 1) {
    const response = await createResponse({
      model: "gpt-4.1-mini",
      input: pendingInput,
      tools: agentTools,
      previousResponseId
    });

    previousResponseId = response.id;
    const output = response.output ?? [];

    const functionCalls = output
      .filter((item: any) => item.type === "function_call")
      .map((item: any) => ({ raw: item, parsed: parseFunctionCall(item) }))
      .filter((entry: any) => Boolean(entry.parsed));

    if (functionCalls.length === 0) {
      return {
        reply: extractAssistantText(output),
        notebookCell: createdNotebookCell
      };
    }

    pendingInput = functionCalls.map((entry: any) => {
      const result = executeTool(entry.parsed as ToolCall);
      if (entry.parsed.name === "create_notebook_cell" && result.notebookCell) {
        createdNotebookCell = result.notebookCell;
      }
      return {
        type: "function_call_output",
        call_id: entry.raw.call_id,
        output: JSON.stringify(result)
      };
    });
  }

  return {
    reply: "I could not finish the request in time.",
    notebookCell: createdNotebookCell
  };
}
