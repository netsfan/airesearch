"use client";

import { useMemo, useState } from "react";
import type { DataSource, TableData } from "@/types";

type Props = {
  sources: DataSource[];
  selectedTable?: TableData;
  onSelectTable: (table: TableData) => void;
};

export default function DataSourcesPane({ sources, selectedTable, onSelectTable }: Props) {
  const [expandedSourceIds, setExpandedSourceIds] = useState<string[]>([sources[0]?.id ?? ""]);

  const selectedColumns = useMemo(() => selectedTable?.columns ?? [], [selectedTable]);

  const toggleSource = (id: string) => {
    setExpandedSourceIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  return (
    <aside className="h-full overflow-y-auto border-r border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Data Sources</h2>
      <div className="space-y-2">
        {sources.map((source) => {
          const isExpanded = expandedSourceIds.includes(source.id);
          return (
            <div key={source.id} className="rounded-lg border border-slate-200">
              <button
                onClick={() => toggleSource(source.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <span>{source.name}</span>
                <span className="text-slate-400">{isExpanded ? "−" : "+"}</span>
              </button>

              {isExpanded && (
                <ul className="space-y-1 border-t border-slate-200 px-2 py-2">
                  {source.tables.map((table) => {
                    const isSelected = selectedTable?.id === table.id;
                    return (
                      <li key={table.id}>
                        <button
                          onClick={() => onSelectTable(table)}
                          className={`w-full rounded px-2 py-1 text-left text-sm ${
                            isSelected ? "bg-blue-100 font-medium text-blue-700" : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {table.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Columns</h3>
        {selectedTable ? (
          <>
            <p className="mt-2 text-sm font-medium text-slate-700">{selectedTable.name}</p>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
              {selectedColumns.map((column) => (
                <li key={column}>{column}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Select a table to inspect columns.</p>
        )}
      </div>
    </aside>
  );
}
