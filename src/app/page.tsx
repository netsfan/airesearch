"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ChatPane from "@/features/chat/ChatPane";
import DataSourcesPane from "@/features/data-sources/DataSourcesPane";
import NotebookPane from "@/features/notebook/NotebookPane";
import { mockSources } from "@/lib/data/mockTables";
import type { ChatMessage, NotebookContext, TableData } from "@/types";

const initialMessages: ChatMessage[] = [{ id: "msg-1", role: "assistant", content: "Hi! Ask me about the selected table." }];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [selectedTable, setSelectedTable] = useState<TableData | undefined>(mockSources[0]?.tables[0]);
  const [notebookContext, setNotebookContext] = useState<NotebookContext | null>(null);
  const [autoInsertCode, setAutoInsertCode] = useState(false);
  const insertCodeRef = useRef<((code: string) => Promise<void>) | null>(null);

  const title = useMemo(() => "AI Research MVP", []);

  const handleInsertPythonCode = useCallback(async (code: string) => {
    if (insertCodeRef.current) {
      await insertCodeRef.current(code);
    }
  }, []);

  const handleBridgeReady = useCallback((insertFn: (code: string) => Promise<void>) => {
    insertCodeRef.current = insertFn;
  }, []);

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      </header>

      <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_360px] overflow-hidden">
        <DataSourcesPane sources={mockSources} selectedTable={selectedTable} onSelectTable={setSelectedTable} />
        <NotebookPane onNotebookContextChange={setNotebookContext} onBridgeReady={handleBridgeReady} />
        <ChatPane
          messages={messages}
          selectedTableName={selectedTable?.name}
          notebookContext={notebookContext}
          autoInsertCode={autoInsertCode}
          onAutoInsertCodeChange={setAutoInsertCode}
          onAppendMessage={(message) => setMessages((previous) => [...previous, message])}
          onInsertPythonCode={handleInsertPythonCode}
        />
      </div>
    </main>
  );
}
