const OPENAI_URL = "https://api.openai.com/v1/responses";

export type ResponseInputItem =
  | {
      type: "message";
      role: "user" | "system";
      content: Array<{ type: "input_text"; text: string }>;
    }
  | {
      type: "function_call_output";
      call_id: string;
      output: string;
    };

export async function createResponse(params: {
  model: string;
  input: ResponseInputItem[];
  tools: unknown[];
  previousResponseId?: string;
}): Promise<{ id?: string; output?: unknown[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      input: params.input,
      tools: params.tools,
      previous_response_id: params.previousResponseId
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  return (await response.json()) as { id?: string; output?: unknown[] };
}
