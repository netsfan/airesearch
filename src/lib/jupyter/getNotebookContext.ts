import type { NotebookPanel } from "@jupyterlab/notebook";
import type { INotebookTracker } from "@jupyterlab/notebook";
import type { CellType } from "@jupyterlab/nbformat";
import type { NotebookContext, NotebookContextCell } from "@/types";

const MAX_CELLS = 8;
const MAX_SOURCE_CHARS = 2000;

function toSupportedCellType(cellType: CellType): NotebookContextCell["type"] {
  if (cellType === "code") return "code";
  if (cellType === "raw") return "raw";
  return "markdown";
}

function normalizeSource(source: string | string[]): string {
  return Array.isArray(source) ? source.join("") : source;
}

function truncateSource(source: string): string {
  if (source.length <= MAX_SOURCE_CHARS) return source;
  return `${source.slice(0, MAX_SOURCE_CHARS)}\n…`;
}

function readCell(panel: NotebookPanel, index: number): NotebookContextCell | null {
  const model = panel.content.model;
  if (!model) return null;

  const cell = model.cells.get(index);
  if (!cell) return null;

  const source = truncateSource(normalizeSource(cell.toJSON().source));

  return {
    type: toSupportedCellType(cell.type),
    source
  };
}

export function getNotebookContext(notebookTracker: INotebookTracker): NotebookContext | null {
  console.log("getNotebookContext", notebookTracker.currentWidget);
  const panel = notebookTracker.currentWidget;
  const model = panel?.content.model;

  if (!panel || !model) return null;

  const totalCells = model.cells.length;
  const startIndex = Math.max(totalCells - MAX_CELLS, 0);
  const cells: NotebookContextCell[] = [];

  for (let index = startIndex; index < totalCells; index += 1) {
    const contextCell = readCell(panel, index);
    if (contextCell) {
      console.log("contextCell", contextCell);
      cells.push(contextCell);
    }
  }

  return {
    path: panel.context.path,
    cells
  };
}
