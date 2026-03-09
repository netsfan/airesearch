import { findTableByName } from "@/lib/data/mockTables";

export type TableSummary = {
  tableName: string;
  rowCount: number;
  columns: string[];
  sampleRows: Record<string, string | number>[];
  metadata: {
    available: boolean;
  };
};

export function getTableSummary(tableName: string): TableSummary {
  const table = findTableByName(tableName);

  if (!table) {
    return {
      tableName,
      rowCount: 0,
      columns: [],
      sampleRows: [],
      metadata: { available: false }
    };
  }

  return {
    tableName: table.name,
    rowCount: table.rows.length,
    columns: table.columns,
    sampleRows: table.rows.slice(0, 3),
    metadata: { available: true }
  };
}
