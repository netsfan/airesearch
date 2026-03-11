import { createResponse, type ResponseInputItem } from "@/lib/utils/openai";
import { buildSystemPrompt, buildUserContext } from "./prompts";
import { agentTools, executeTool } from "./tools";
import type { AgentInput, AgentResponse, ToolCall, ToolName } from "./types";

type ResponseOutputItem = {
  type?: string;
  role?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  content?: Array<{ type?: string; text?: string }>;
};

const ALLOWED_TOOLS: ToolName[] = ["list_tables", "summarize_table", "create_notebook_cell"];

function parseFunctionCall(item: ResponseOutputItem): { callId: string; call: ToolCall } | null {
  if (item.type !== "function_call" || !item.name || !item.call_id) return null;
  if (!ALLOWED_TOOLS.includes(item.name as ToolName)) return null;

  let parsedArguments: Record<string, unknown> = {};
  try {
    parsedArguments = item.arguments ? JSON.parse(item.arguments) : {};
  } catch {
    parsedArguments = {};
  }

  return {
    callId: item.call_id,
    call: {
      name: item.name as ToolName,
      arguments: parsedArguments
    }
  };
}

function extractAssistantText(output: ResponseOutputItem[]): string {
  for (const item of output) {
    if (item.type === "message" && item.role === "assistant") {
      const textItem = item.content?.find((contentItem) => contentItem.type === "output_text");
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
    console.log("response", response);

    previousResponseId = typeof response.id === "string" ? response.id : undefined;
    const output = Array.isArray(response.output) ? (response.output as ResponseOutputItem[]) : [];

    const functionCalls = output.map(parseFunctionCall).filter((entry): entry is { callId: string; call: ToolCall } => Boolean(entry));

    if (functionCalls.length === 0) {
      return {
        reply: extractAssistantText(output),
        notebookCell: createdNotebookCell
      };
    }

    pendingInput = functionCalls.map(({ callId, call }) => {
      const result = executeTool(call, { selectedTable: input.selectedTable });
      if (call.name === "create_notebook_cell" && "notebookCell" in result && result.notebookCell?.content) {
        createdNotebookCell = result.notebookCell;
      }

      return {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(result)
      };
    });
  }

  return {
    reply: "I could not finish the request in time.",
    notebookCell: createdNotebookCell
  };
}
