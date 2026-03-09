import { runAgent } from "@/lib/agent/runAgent";
import type { AgentInput } from "@/lib/agent/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentInput;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing. Set it in your environment before using the agent." },
        { status: 500 }
      );
    }

    if (!body?.message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const result = await runAgent({
      message: body.message,
      selectedTable: body.selectedTable,
      notebookContext: body.notebookContext ?? []
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
