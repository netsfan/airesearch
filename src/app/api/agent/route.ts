import { runAgent } from "@/lib/agent/runAgent";
import type { AgentInput } from "@/lib/agent/types";
import { NextResponse } from "next/server";

type RawAgentInput = Partial<AgentInput>;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RawAgentInput;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing. Set it in your environment before using the agent." },
        { status: 500 }
      );
    }

    if (!body?.message || typeof body.message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const notebookContext = Array.isArray(body.notebookContext)
      ? body.notebookContext
          .filter((cell): cell is { type: "markdown" | "sql"; content: string } => {
            return Boolean(cell && typeof cell.content === "string" && (cell.type === "markdown" || cell.type === "sql"));
          })
          .slice(-3)
      : [];
    console.log("notebookContext", notebookContext);
    console.log("body.message", body.message);
    console.log("body.selectedTable", body.selectedTable);
    console.log("body", body);
    const result = await runAgent({
      message: body.message,
      selectedTable: typeof body.selectedTable === "string" ? body.selectedTable : undefined,
      notebookContext
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
