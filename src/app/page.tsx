"use client";

import { useMemo, useState } from "react";
import ChatPane from "@/features/chat/ChatPane";
import DataSourcesPane from "@/features/data-sources/DataSourcesPane";
import NotebookPane from "@/features/notebook/NotebookPane";
import { mockSources } from "@/lib/data/mockTables";
import { createId } from "@/lib/utils/id";
import type { ChatMessage, NotebookCell, NotebookCellType, TableData } from "@/types";

const initialCells: NotebookCell[] = [
  { id: "cell-1", type: "markdown", content: "# Weekly Analysis\n- Explore retention trends" }
];

const initialMessages: ChatMessage[] = [
  { id: "msg-1", role: "assistant", content: "Hi! Ask me about the selected table." }
];

function fakeSqlOutput() {
  return ["plan | users", "-----|------", "pro  | 320", "team | 140", "free | 980"].join("\n");
}

export default function Home() {
  const [cells, setCells] = useState<NotebookCell[]>(initialCells);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [selectedTable, setSelectedTable] = useState<TableData | undefined>(mockSources[0]?.tables[0]);

  const title = useMemo(() => "AI Research MVP", []);

  const handleUpdateCell = (id: string, content: string) => {
    setCells((previous) => previous.map((cell) => (cell.id === id ? { ...cell, content } : cell)));
  };

  const handleRunCell = (id: string) => {
    setCells((previous) =>
      previous.map((cell) => {
        if (cell.id !== id) return cell;
        return { ...cell, output: cell.type === "sql" ? fakeSqlOutput() : cell.content };
      })
    );
  };

  const handleAddCell = (type: NotebookCellType, content = "") => {
    const defaultContent = content || (type === "sql" ? "SELECT *\nFROM users\nLIMIT 10;" : "## New note");
    setCells((previous) => [...previous, { id: createId("cell"), type, content: defaultContent }]);
  };

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      </header>

      <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_360px] overflow-hidden">
        <DataSourcesPane sources={mockSources} selectedTable={selectedTable} onSelectTable={setSelectedTable} />
        <NotebookPane cells={cells} onUpdateCell={handleUpdateCell} onRunCell={handleRunCell} onAddCell={handleAddCell} />
        <ChatPane
          messages={messages}
          selectedTableName={selectedTable?.name}
          notebookContext={cells}
          onAppendMessage={(message) => setMessages((previous) => [...previous, message])}
          onInsertCell={(type, content) => handleAddCell(type, content)}
        />
      </div>
    </main>
  );
}
