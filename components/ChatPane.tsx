"use client";

import { useState } from "react";
import type { ChatMessage } from "@/types";

type ChatPaneProps = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onInsertIntoNotebook: (content: string) => void;
};

export default function ChatPane({ messages, onSend, onInsertIntoNotebook }: ChatPaneProps) {
  const [draft, setDraft] = useState("");

  const sendMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
  };

  return (
    <aside className="flex h-full flex-col border-l border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">AI Chat</h2>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg p-3 text-sm ${
              message.role === "assistant" ? "bg-slate-100 text-slate-700" : "bg-blue-600 text-white"
            }`}
          >
            <p>{message.content}</p>

            {message.role === "assistant" && message.insertContent && (
              <button
                onClick={() => onInsertIntoNotebook(message.insertContent as string)}
                className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Insert into notebook
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder="Ask about data..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
        />
        <button
          onClick={sendMessage}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </aside>
  );
}
