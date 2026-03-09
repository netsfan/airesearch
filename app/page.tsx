"use client";

import { useMemo, useState } from "react";
import ChatPane from "@/components/ChatPane";
import DataSourcesPane from "@/components/DataSourcesPane";
import NotebookPane from "@/components/NotebookPane";
import type { ChatMessage, DataSource, NotebookCell, NotebookCellType } from "@/types";

const mockSources: DataSource[] = [
  {
    id: "source-postgres",
    name: "Postgres DB",
    tables: [
      { id: "pg-users", name: "users", columns: ["id", "email", "created_at", "country"] },
      { id: "pg-events", name: "events", columns: ["id", "user_id", "event_name", "timestamp"] },
      {
        id: "pg-subscriptions",
        name: "subscriptions",
        columns: ["id", "user_id", "plan", "status", "started_at"]
      }
    ]
  },
  {
    id: "source-snowflake",
    name: "Snowflake",
    tables: [
      { id: "sf-users", name: "users", columns: ["user_id", "segment", "lifecycle_stage"] },
      { id: "sf-events", name: "events", columns: ["event_id", "user_id", "event_type"] },
      { id: "sf-subscriptions", name: "subscriptions", columns: ["subscription_id", "mrr", "status"] }
    ]
  },
  {
    id: "source-csv",
    name: "Uploaded CSV",
    tables: [
      { id: "csv-users", name: "users", columns: ["id", "name", "last_seen"] },
      { id: "csv-events", name: "events", columns: ["event", "count", "day"] },
      { id: "csv-subscriptions", name: "subscriptions", columns: ["plan", "active_users", "month"] }
    ]
  }
];

const initialCells: NotebookCell[] = [
  {
    id: "cell-1",
    type: "markdown",
    content: "# Weekly Analysis\n- Explore retention trends\n- Compare active users by plan"
  },
  {
    id: "cell-2",
    type: "sql",
    content: "SELECT plan, COUNT(*) AS users\nFROM subscriptions\nGROUP BY plan\nORDER BY users DESC;"
  }
];

const initialMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    content: "Hi! I can help draft SQL and notes for your research notebook.",
    insertContent: "## Assistant Note\nLet's begin by reviewing user activity by cohort."
  }
];

const createId = () => Math.random().toString(36).slice(2, 10);

function fakeSqlOutput() {
  return [
    "plan | users",
    "-----|------",
    "pro  | 320",
    "team | 140",
    "free | 980"
  ].join("\n");
}

function generateAssistantReply(prompt: string): { content: string; insertContent: string } {
  const lower = prompt.toLowerCase();

  if (lower.includes("retention")) {
    const sql =
      "SELECT signup_week, COUNT(DISTINCT user_id) AS retained_users\nFROM events\nWHERE event_name = 'session_start'\nGROUP BY signup_week\nORDER BY signup_week;";
    return {
      content: "For retention, I suggest starting with a cohort SQL query. I can insert one into the notebook.",
      insertContent: sql
    };
  }

  if (lower.includes("users")) {
    return {
      content: "I found the users table in your sources. You can join it with events for behavior analysis.",
      insertContent: "SELECT u.id, u.email, COUNT(e.id) AS events\nFROM users u\nLEFT JOIN events e ON e.user_id = u.id\nGROUP BY u.id, u.email\nLIMIT 50;"
    };
  }

  return {
    content: "Try comparing events and subscriptions over time, then summarize patterns in a markdown cell.",
    insertContent: "## Analysis Suggestion\nCompare event activity with subscription status to find growth opportunities."
  };
}

export default function Home() {
  const [cells, setCells] = useState<NotebookCell[]>(initialCells);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const title = useMemo(() => "AI Research MVP", []);

  const handleUpdateCell = (id: string, content: string) => {
    setCells((previous) => previous.map((cell) => (cell.id === id ? { ...cell, content } : cell)));
  };

  const handleRunCell = (id: string) => {
    setCells((previous) =>
      previous.map((cell) => {
        if (cell.id !== id) return cell;
        if (cell.type === "sql") {
          return { ...cell, output: fakeSqlOutput() };
        }

        return { ...cell, output: cell.content };
      })
    );
  };

  const handleAddCell = (type: NotebookCellType, content = "") => {
    const defaultContent =
      content ||
      (type === "sql" ? "SELECT *\nFROM users\nLIMIT 10;" : "## New note\nWrite your analysis here.");

    setCells((previous) => [...previous, { id: `cell-${createId()}`, type, content: defaultContent }]);
  };

  const handleSendMessage = (text: string) => {
    const userMessage: ChatMessage = { id: `msg-${createId()}`, role: "user", content: text };
    const assistantReply = generateAssistantReply(text);
    const assistantMessage: ChatMessage = {
      id: `msg-${createId()}`,
      role: "assistant",
      content: assistantReply.content,
      insertContent: assistantReply.insertContent
    };

    setMessages((previous) => [...previous, userMessage, assistantMessage]);
  };

  const handleInsertIntoNotebook = (content: string) => {
    const inferredType: NotebookCellType = content.trim().toLowerCase().startsWith("select") ? "sql" : "markdown";
    handleAddCell(inferredType, content);
  };

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)_320px]">
        <DataSourcesPane sources={mockSources} />
        <NotebookPane cells={cells} onUpdateCell={handleUpdateCell} onRunCell={handleRunCell} onAddCell={handleAddCell} />
        <ChatPane messages={messages} onSend={handleSendMessage} onInsertIntoNotebook={handleInsertIntoNotebook} />
      </div>
    </main>
  );
}
