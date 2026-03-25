# AI Research MVP

Minimal single-app Next.js MVP with a tool-using data agent and an embedded JupyterLab pane.

## Features

- 3-pane layout:
  - **Data Sources** (left): browse data sources and select a table
  - **Notebook** (center): embedded JupyterLab iframe with host-side bridge controls
  - **AI Chat** (right): conversational agent aware of the selected table, notebook context, and chat history
- `POST /api/agent` route using the OpenAI Responses API with a multi-step tool loop (up to 6 steps)
- 4 agent tools:
  - `list_tables` — list available tables with metadata
  - `summarize_table` — return schema, row count, and sample rows for a table
  - `create_notebook_cell` — produce a markdown or SQL cell for the notebook
  - `generate_python_code` — generate Python code that can be inserted into the notebook
- Python code insertion into the active Jupyter notebook via `ai:insert-code-cell`
- Auto-insert toggle: automatically insert AI-generated code, or show an "Insert into notebook" button per message
- Chat history: the agent receives previous conversation turns for multi-turn context
- Notebook context polling: reads the active notebook's cells every 1.5s via the bridge
- Host-side Jupyter bridge wrapper using `jupyter-iframe-commands-host`

## Project structure

```
src/
├── app/
│   ├── api/agent/route.ts        # POST /api/agent — validates input, runs agent
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main 3-pane page, top-level state
├── features/
│   ├── chat/ChatPane.tsx         # Chat UI, sends requests, renders messages
│   ├── data-sources/DataSourcesPane.tsx  # Table browser
│   └── notebook/NotebookPane.tsx # JupyterLab iframe, bridge init, context polling
├── lib/
│   ├── agent/
│   │   ├── prompts.ts            # System prompt and user context builder
│   │   ├── runAgent.ts           # Agent loop — calls OpenAI, executes tools
│   │   ├── tools.ts              # Tool definitions and execution
│   │   └── types.ts              # AgentInput, AgentResponse, tool types
│   ├── data/
│   │   ├── getTableSummary.ts    # Table lookup and summary
│   │   └── mockTables.ts         # Mock data sources (Postgres + CSV)
│   ├── jupyter/
│   │   ├── bridge.ts             # Host-side bridge wrapper (createBridge)
│   │   └── getNotebookContext.ts # Helper for Jupyter plugin to read notebook state
│   └── utils/
│       ├── id.ts                 # ID generator
│       └── openai.ts             # OpenAI Responses API client
└── types/
    ├── index.ts                  # Shared types
    └── jupyterlab.d.ts           # JupyterLab type stubs
```

## Run locally

```bash
yarn install
yarn dev
```

Open `http://localhost:3000`.

## Environment

Set required env vars before starting the dev server:

```bash
export OPENAI_API_KEY="your_key_here"
export NEXT_PUBLIC_JUPYTER_URL="http://localhost:8888/lab"
```

If the API key is missing, the chat pane will show a clear error from `/api/agent`.

## Jupyter setup

- JupyterLab must be hosted separately and reachable at `NEXT_PUBLIC_JUPYTER_URL`.
- The Jupyter environment must have `jupyter-iframe-commands` installed for bridge communication.
- The Jupyter environment needs a small custom plugin that registers two commands:

### `ai:get-notebook-context`

Returns the active notebook's state for the agent to reason about.

Expected return shape:

```ts
{
  path: string;
  cells: Array<{ type: "code" | "markdown" | "raw"; source: string }>;
}
```

Use `INotebookTracker` and the helper in `src/lib/jupyter/getNotebookContext.ts`:

```ts
app.commands.addCommand("ai:get-notebook-context", {
  execute: () => getNotebookContext(notebookTracker)
});
```

The host app polls this command every 1.5s and includes the result in agent requests automatically.

### `ai:insert-code-cell`

Inserts a new code cell into the active notebook with the provided source.

Expected arguments:

```ts
{ code: string; position?: "below" | "bottom" }
```

The host app calls this when the user clicks "Insert into notebook" or when auto-insert is enabled.

## Data

Currently uses mock data in `src/lib/data/mockTables.ts`:

- **Postgres DB**: `users`, `events` tables
- **Uploaded CSV**: `subscriptions` table

Replace with a real database connection to use live data.
