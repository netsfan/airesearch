"use client";

import type { NotebookCell, NotebookCellType } from "@/types";

type NotebookPaneProps = {
  cells: NotebookCell[];
  onUpdateCell: (id: string, updates: { content?: string; title?: string }) => void;
  onRunCell: (id: string) => void;
  onAddCell: (type: NotebookCellType, content?: string) => void;
  onDeleteCell: (id: string) => void;
  onMoveCell: (id: string, direction: "up" | "down") => void;
};

function renderMarkdown(text: string) {
  return text.split("\n").map((line, index) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={index} className="text-lg font-semibold text-slate-800">
          {line.replace("## ", "")}
        </h3>
      );
    }

    if (line.startsWith("# ")) {
      return (
        <h2 key={index} className="text-xl font-bold text-slate-900">
          {line.replace("# ", "")}
        </h2>
      );
    }

    if (line.startsWith("- ")) {
      return (
        <li key={index} className="ml-4 list-disc text-slate-700">
          {line.replace("- ", "")}
        </li>
      );
    }

    return (
      <p key={index} className="text-slate-700">
        {line}
      </p>
    );
  });
}

export default function NotebookPane({ cells, onUpdateCell, onRunCell, onAddCell, onDeleteCell, onMoveCell }: NotebookPaneProps) {
  return (
    <section className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notebook</h2>
        <div className="space-x-2">
          <button
            onClick={() => onAddCell("markdown")}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            + Markdown
          </button>
          <button
            onClick={() => onAddCell("sql")}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            + SQL
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {cells.map((cell, index) => (
          <article key={cell.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">{cell.type}</span>
                <span className="text-xs text-slate-400">#{index + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onMoveCell(cell.id, "up")}
                  disabled={index === 0}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={() => onMoveCell(cell.id, "down")}
                  disabled={index === cells.length - 1}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  onClick={() => onDeleteCell(cell.id)}
                  className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
                <button
                  onClick={() => onRunCell(cell.id)}
                  className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Run
                </button>
              </div>
            </div>

            <input
              value={cell.title ?? ""}
              onChange={(event) => onUpdateCell(cell.id, { title: event.target.value })}
              placeholder="Optional title"
              className="mb-2 w-full rounded-md border border-slate-300 p-2 text-sm outline-none ring-blue-500 focus:ring"
            />

            <textarea
              value={cell.content}
              onChange={(event) => onUpdateCell(cell.id, { content: event.target.value })}
              className="min-h-28 w-full rounded-md border border-slate-300 p-2 text-sm outline-none ring-blue-500 focus:ring"
            />

            {cell.output && (
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                {cell.type === "markdown" ? (
                  <div className="space-y-2">{renderMarkdown(cell.output)}</div>
                ) : (
                  <pre className="whitespace-pre-wrap text-slate-700">{cell.output}</pre>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
