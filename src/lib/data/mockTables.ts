import type { DataSource, TableData } from "@/types";

export const mockSources: DataSource[] = [
  {
    id: "source-postgres",
    name: "Postgres DB",
    tables: [
      {
        id: "pg-users",
        name: "users",
        columns: ["id", "email", "created_at", "country"],
        rows: [
          { id: 1, email: "ava@example.com", created_at: "2024-01-03", country: "US" },
          { id: 2, email: "liam@example.com", created_at: "2024-01-04", country: "CA" },
          { id: 3, email: "mia@example.com", created_at: "2024-01-05", country: "US" },
          { id: 4, email: "noah@example.com", created_at: "2024-01-06", country: "DE" }
        ]
      },
      {
        id: "pg-events",
        name: "events",
        columns: ["id", "user_id", "event_name", "timestamp"],
        rows: [
          { id: 1, user_id: 1, event_name: "session_start", timestamp: "2024-02-01T10:00:00Z" },
          { id: 2, user_id: 2, event_name: "clicked_upgrade", timestamp: "2024-02-01T10:05:00Z" },
          { id: 3, user_id: 1, event_name: "session_end", timestamp: "2024-02-01T10:20:00Z" }
        ]
      }
    ]
  },
  {
    id: "source-csv",
    name: "Uploaded CSV",
    tables: [
      {
        id: "csv-subscriptions",
        name: "subscriptions",
        columns: ["plan", "active_users", "month"],
        rows: [
          { plan: "free", active_users: 980, month: "2024-01" },
          { plan: "pro", active_users: 320, month: "2024-01" },
          { plan: "team", active_users: 140, month: "2024-01" }
        ]
      }
    ]
  }
];

export function findTableByName(name?: string): TableData | undefined {
  if (!name) return undefined;
  const target = name.toLowerCase();
  return mockSources.flatMap((source) => source.tables).find((table) => table.name.toLowerCase() === target);
}
