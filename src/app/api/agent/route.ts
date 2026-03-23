import { runAgent } from "@/lib/agent/runAgent";
import type { AgentInput } from "@/lib/agent/types";
import type { NotebookContext } from "@/types";
import { NextResponse } from "next/server";

type RawAgentInput = Partial<AgentInput>;

const MAX_CELLS = 8;
const MAX_SOURCE_CHARS = 2000;

function parseNotebookContext(value: unknown): NotebookContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeContext = value as { path?: unknown; cells?: unknown };
  if (typeof maybeContext.path !== "string" || !Array.isArray(maybeContext.cells)) {
    return null;
  }

  const cells = maybeContext.cells
    .filter((cell): cell is { type: "code" | "markdown" | "raw"; source: string } => {
      if (!cell || typeof cell !== "object") return false;
      const maybeCell = cell as { type?: unknown; source?: unknown };
      return (
        typeof maybeCell.source === "string" &&
        (maybeCell.type === "code" || maybeCell.type === "markdown" || maybeCell.type === "raw")
      );
    })
    .slice(-MAX_CELLS)
    .map((cell) => ({
      type: cell.type,
      source: cell.source.slice(0, MAX_SOURCE_CHARS)
    }));

  return {
    path: maybeContext.path,
    cells
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RawAgentInput;
    console.log("body", body);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing. Set it in your environment before using the agent." },
        { status: 500 }
      );
    }

    if (!body?.message || typeof body.message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const notebookContext = parseNotebookContext(body.notebookContext);
    console.log("notebookContext", notebookContext);

    const result = await runAgent({
      message: body.message,
      selectedTable: typeof body.selectedTable === "string" ? body.selectedTable : undefined,
      notebookContext,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
