export type TableSchema = {
  id: string;
  name: string;
  columns: string[];
};

export type DataSource = {
  id: string;
  name: string;
  tables: TableSchema[];
};

export type NotebookCellType = "markdown" | "sql";

export type NotebookCell = {
  id: string;
  type: NotebookCellType;
  title?: string;
  content: string;
  output?: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  insertContent?: string;
};
