export type TableData = {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string | number>[];
};

export type DataSource = {
  id: string;
  name: string;
  tables: TableData[];
};

export type JupyterNotebookCellType = "code" | "markdown" | "raw";

export type NotebookContextCell = {
  type: JupyterNotebookCellType;
  source: string;
};

export type NotebookContext = {
  path: string;
  cells: NotebookContextCell[];
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  pythonCode?: string;
};

