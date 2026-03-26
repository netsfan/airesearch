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
  onInsertPythonCode: (code: string) => void;
};

const createId = () => Math.random().toString(36).slice(2, 10);

/** Split message content into text and fenced code blocks for rendering. */
function parseContentBlocks(text: string): Array<{ type: "text" | "code"; content: string; lang?: string }> {
  const blocks: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    blocks.push({ type: "code", content: match[2].trimEnd(), lang: match[1] || undefined });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    blocks.push({ type: "text", content: text.slice(lastIndex) });
  }

  return blocks;
}

export default function ChatPane({ messages, selectedTableName, notebookContext, autoInsertCode, onAutoInsertCodeChange, onAppendMessage, onInsertPythonCode }: Props) {
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
          notebookContext,
          chatHistory: messages
            .filter((m) => m.content && !m.content.startsWith("Error:"))
            .map((m) => ({ role: m.role, content: m.content })),
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
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
      onAppendMessage({ id: `msg-${createId()}`, role: "assistant", content: `Error: ${message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white p-4">
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
      <div className="scrollbar-fade min-h-0 flex-1 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className={`rounded-md px-2.5 py-2 text-sm ${message.role === "assistant" ? "bg-slate-100" : "bg-blue-600 text-white"}`}>
            {message.role === "assistant"
              ? parseContentBlocks(message.content).map((block, i) =>
                  block.type === "code" ? (
                    <pre key={i} className="my-2 overflow-x-auto rounded-md bg-slate-800 p-3 text-xs text-slate-100">
                      <code>{block.content}</code>
                    </pre>
                  ) : (
                    <span key={i} className="whitespace-pre-wrap">{block.content}</span>
                  )
                )
              : message.content}
            {message.pythonCode && (
              <div className="mt-2 rounded-md border border-slate-200 bg-slate-800 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Python</span>
                  <div className="flex gap-2">
                    {!autoInsertCode && (
                      <button
                        onClick={() => onInsertPythonCode(message.pythonCode!)}
                        className="rounded border border-green-400/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 hover:bg-green-500/20"
                      >
                        Insert into notebook
                      </button>
                    )}
                    {autoInsertCode && (
                      <span className="text-[10px] text-green-400">✓ Inserted</span>
                    )}
                  </div>
                </div>
                <pre className="overflow-x-auto text-xs leading-relaxed text-slate-100">
                  <code>{message.pythonCode}</code>
                </pre>
              </div>
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
