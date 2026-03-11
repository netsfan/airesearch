"use client";

import { useMemo, useState } from "react";
import ChatPane from "@/features/chat/ChatPane";
import DataSourcesPane from "@/features/data-sources/DataSourcesPane";
import NotebookPane from "@/features/notebook/NotebookPane";
import { mockSources } from "@/lib/data/mockTables";
import { createId } from "@/lib/utils/id";
import type { ChatMessage, NotebookCell, TableData } from "@/types";

const initialMessages: ChatMessage[] = [{ id: "msg-1", role: "assistant", content: "Hi! Ask me about the selected table." }];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [selectedTable, setSelectedTable] = useState<TableData | undefined>(mockSources[0]?.tables[0]);
  const [notebookContext, setNotebookContext] = useState<NotebookCell[]>([]);
  const [latestAiCode, setLatestAiCode] = useState<string | undefined>(undefined);

  const title = useMemo(() => "AI Research MVP", []);

  const handleNotebookSuggestion = (type: "markdown" | "sql", content: string) => {
    const nextCell: NotebookCell = { id: createId("cell"), type, content };
    setNotebookContext((previous) => [...previous.slice(-7), nextCell]);

    if (type === "sql") {
      setLatestAiCode(content);
    }
  };

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      </header>

      <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_360px] overflow-hidden">
        <DataSourcesPane sources={mockSources} selectedTable={selectedTable} onSelectTable={setSelectedTable} />
        <NotebookPane latestAiCode={latestAiCode} />
        <ChatPane
          messages={messages}
          selectedTableName={selectedTable?.name}
          notebookContext={notebookContext}
          onAppendMessage={(message) => setMessages((previous) => [...previous, message])}
          onInsertCell={handleNotebookSuggestion}
        />
      </div>
    </main>
  );
}
