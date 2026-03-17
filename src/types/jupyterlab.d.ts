declare module "@jupyterlab/nbformat" {
  export type CellType = "code" | "markdown" | "raw";
}

declare module "@jupyterlab/notebook" {
  import type { CellType } from "@jupyterlab/nbformat";

  export interface ICellModel {
    type: CellType;
    toJSON(): { source: string | string[] };
  }

  export interface INotebookModel {
    cells: {
      length: number;
      get: (index: number) => ICellModel | null;
    };
  }

  export interface NotebookPanel {
    content: {
      model: INotebookModel | null;
    };
    context: {
      path: string;
    };
  }

  export interface INotebookTracker {
    currentWidget: NotebookPanel | null;
  }
}
