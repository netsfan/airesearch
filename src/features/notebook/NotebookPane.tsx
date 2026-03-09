"use client";

import type { NotebookCell, NotebookCellType } from "@/types";

type Props = {
  cells: NotebookCell[];
  onUpdateCell: (id: string, content: string) => void;
  onRunCell: (id: string) => void;
  onAddCell: (type: NotebookCellType, content?: string) => void;
};

function renderMarkdown(text: string) {
  return text.split("\n").map((line, index) => {
    if (line.startsWith("## ")) return <h3 key={index}>{line.replace("## ", "")}</h3>;
    if (line.startsWith("# ")) return <h2 key={index}>{line.replace("# ", "")}</h2>;
    if (line.startsWith("- ")) return <li key={index}>{line.replace("- ", "")}</li>;
    return <p key={index}>{line}</p>;
  });
}

export default function NotebookPane({ cells, onUpdateCell, onRunCell, onAddCell }: Props) {
  return (
    <section className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notebook</h2>
        <div className="space-x-2">
          <button onClick={() => onAddCell("markdown")} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">
            + Markdown
          </button>
          <button onClick={() => onAddCell("sql")} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">
            + SQL
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {cells.map((cell) => (
          <article key={cell.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">{cell.type}</span>
              <button onClick={() => onRunCell(cell.id)} className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                Run
              </button>
            </div>

            <textarea
              value={cell.content}
              onChange={(event) => onUpdateCell(cell.id, event.target.value)}
              className="min-h-28 w-full rounded-md border border-slate-300 p-2 text-sm outline-none ring-blue-500 focus:ring"
            />

            {cell.output && (
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                {cell.type === "markdown" ? <div className="space-y-2">{renderMarkdown(cell.output)}</div> : <pre>{cell.output}</pre>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
