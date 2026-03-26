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

const ALLOWED_TOOLS: ToolName[] = ["list_tables", "summarize_table", "generate_python_code"];

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
  let generatedPythonCode: string | undefined;
  const historyMessages: ResponseInputItem[] = (input.chatHistory ?? []).map((m) =>
    m.role === "assistant"
      ? { type: "message" as const, role: "assistant" as const, content: [{ type: "output_text" as const, text: m.content }] }
      : { type: "message" as const, role: "user" as const, content: [{ type: "input_text" as const, text: m.content }] }
  );

  let pendingInput: ResponseInputItem[] = [
    {
      type: "message",
      role: "system",
      content: [{ type: "input_text", text: buildSystemPrompt() }]
    },
    ...historyMessages,
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

    previousResponseId = typeof response.id === "string" ? response.id : undefined;
    const output = Array.isArray(response.output) ? (response.output as ResponseOutputItem[]) : [];

    const functionCalls = output.map(parseFunctionCall).filter((entry): entry is { callId: string; call: ToolCall } => Boolean(entry));

    if (functionCalls.length === 0) {
      return {
        reply: extractAssistantText(output),
        pythonCode: generatedPythonCode,
      };
    }

    pendingInput = functionCalls.map(({ callId, call }) => {
      const result = executeTool(call, { selectedTable: input.selectedTable });
      if (call.name === "generate_python_code" && "pythonCode" in result && result.pythonCode) {
        generatedPythonCode = result.pythonCode;
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
    pythonCode: generatedPythonCode,
  };
}
