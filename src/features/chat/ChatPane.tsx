"use client";

import { useState } from "react";
import type { ChatMessage, NotebookContext } from "@/types";

type Props = {
  messages: ChatMessage[];
  selectedTableName?: string;
  notebookContext: NotebookContext | null;
  autoInsertCode: boolean;
  onAutoInsertCodeChange: (value: boolean) => void;
  onAppendMessage: (message: ChatMessage) => void;
  onInsertCell: (type: "markdown" | "sql", content: string) => void;
  onInsertPythonCode: (code: string) => void;
};

const createId = () => Math.random().toString(36).slice(2, 10);

export default function ChatPane({ messages, selectedTableName, notebookContext, autoInsertCode, onAutoInsertCodeChange, onAppendMessage, onInsertCell, onInsertPythonCode }: Props) {
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setIsLoading(true);
    onAppendMessage({ id: `msg-${createId()}`, role: "user", content: trimmed });
    setDraft("");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          selectedTable: selectedTableName,
          notebookContext
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Agent request failed");
      }

      onAppendMessage({
        id: `msg-${createId()}`,
        role: "assistant",
        content: payload.reply,
        pythonCode: payload.pythonCode,
      });
      if (payload.pythonCode && autoInsertCode) {
        onInsertPythonCode(payload.pythonCode);
      }
      if (payload.notebookCell?.content) {
        onInsertCell(payload.notebookCell.type, payload.notebookCell.content);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
      onAppendMessage({ id: `msg-${createId()}`, role: "assistant", content: `Error: ${message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="flex h-full flex-col border-l border-slate-200 bg-white p-4">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">AI Chat</h2>
      <p className="mb-2 text-xs text-slate-500">Selected table: {selectedTableName ?? "none"}</p>
      <label className="mb-3 flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
        <button
          type="button"
          role="switch"
          aria-checked={autoInsertCode}
          onClick={() => onAutoInsertCodeChange(!autoInsertCode)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${autoInsertCode ? "bg-green-500" : "bg-slate-300"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${autoInsertCode ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
        </button>
        Auto-insert code
      </label>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`rounded-lg p-3 text-sm ${message.role === "assistant" ? "bg-slate-100" : "bg-blue-600 text-white"}`}>
            {message.content}
            {message.pythonCode && !autoInsertCode && (
              <button
                onClick={() => onInsertPythonCode(message.pythonCode!)}
                className="mt-2 block rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
              >
                Insert into notebook
              </button>
            )}
            {message.pythonCode && autoInsertCode && (
              <span className="mt-2 block text-xs text-green-600">✓ Inserted into notebook</span>
            )}
          </div>
        ))}
        {isLoading && <div className="rounded-lg bg-slate-100 p-3 text-sm">Thinking...</div>}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && sendMessage()}
          placeholder="Ask about this table..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
        />
        <button onClick={sendMessage} disabled={isLoading} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
          Send
        </button>
      </div>
    </aside>
  );
}
