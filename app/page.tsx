"use client";

import { useEffect, useMemo, useState } from "react";
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

const STORAGE_KEY = "ai-research-notebook-cells";

const createId = () => Math.random().toString(36).slice(2, 10);

function fakeSqlOutput() {
  return ["plan | users", "-----|------", "pro  | 320", "team | 140", "free | 980"].join("\n");
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
      insertContent:
        "SELECT u.id, u.email, COUNT(e.id) AS events\nFROM users u\nLEFT JOIN events e ON e.user_id = u.id\nGROUP BY u.id, u.email\nLIMIT 50;"
    };
  }

  return {
    content: "Try comparing events and subscriptions over time, then summarize patterns in a markdown cell.",
    insertContent: "## Analysis Suggestion\nCompare event activity with subscription status to find growth opportunities."
  };
}

function getStoredCells(): NotebookCell[] {
  if (typeof window === "undefined") return initialCells;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialCells;

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return initialCells;

    const hydratedCells: NotebookCell[] = parsed
      .filter((cell): cell is NotebookCell => {
        if (!cell || typeof cell !== "object") return false;

        const candidate = cell as Partial<NotebookCell>;
        return (
          typeof candidate.id === "string" &&
          (candidate.type === "markdown" || candidate.type === "sql") &&
          typeof candidate.content === "string"
        );
      })
      .map((cell) => ({
        id: cell.id,
        type: cell.type,
        content: cell.content,
        title: typeof cell.title === "string" ? cell.title : undefined,
        output: typeof cell.output === "string" ? cell.output : undefined
      }));

    return hydratedCells.length > 0 ? hydratedCells : initialCells;
  } catch {
    return initialCells;
  }
}

export default function Home() {
  const [cells, setCells] = useState<NotebookCell[]>(getStoredCells);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const title = useMemo(() => "AI Research MVP", []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cells));
  }, [cells]);

  const handleUpdateCell = (id: string, updates: { content?: string; title?: string }) => {
    setCells((previous) =>
      previous.map((cell) => {
        if (cell.id !== id) return cell;

        return {
          ...cell,
          ...(updates.content !== undefined ? { content: updates.content } : {}),
          ...(updates.title !== undefined ? { title: updates.title } : {})
        };
      })
    );
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

  const handleDeleteCell = (id: string) => {
    setCells((previous) => previous.filter((cell) => cell.id !== id));
  };

  const handleMoveCell = (id: string, direction: "up" | "down") => {
    setCells((previous) => {
      const index = previous.findIndex((cell) => cell.id === id);
      if (index === -1) return previous;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= previous.length) return previous;

      const reordered = [...previous];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered;
    });
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
        <NotebookPane
          cells={cells}
          onUpdateCell={handleUpdateCell}
          onRunCell={handleRunCell}
          onAddCell={handleAddCell}
          onDeleteCell={handleDeleteCell}
          onMoveCell={handleMoveCell}
        />
        <ChatPane messages={messages} onSend={handleSendMessage} onInsertIntoNotebook={handleInsertIntoNotebook} />
      </div>
    </main>
  );
}
