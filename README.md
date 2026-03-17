# AI Research MVP

Minimal single-app Next.js MVP with a tool-using data agent and an embedded JupyterLab pane.

## Features

- 3-pane layout:
  - **Data Sources** (left): select table
  - **Notebook** (middle): embedded JupyterLab iframe + host-side command controls
  - **AI Chat** (right): asks backend agent about selected table
- `POST /api/agent` route using OpenAI Responses API
- Exactly 3 tools:
  - `list_tables`
  - `summarize_table`
  - `create_notebook_cell`
- Host-side Jupyter bridge wrapper in `src/lib/jupyter/bridge.ts`
  - Uses `jupyter-iframe-commands-host` (`createBridge`) to call iframe commands

## Run locally

```bash
yarn install
yarn dev
```

Open `http://localhost:3000`.

## Environment

Set required env vars before starting dev server:

```bash
export OPENAI_API_KEY="your_key_here"
export NEXT_PUBLIC_JUPYTER_URL="http://localhost:8888/lab"
```

If the API key is missing, the chat pane will show a clear error from `/api/agent`.

## Jupyter assumptions

- JupyterLab is hosted separately and reachable at `NEXT_PUBLIC_JUPYTER_URL`.
- The iframe Jupyter environment has `jupyter-iframe-commands` installed.
- For AI code insertion, this repo currently includes a host-side stub that calls `ai:insert-and-run-code` when available.
  - Implement that command later in Jupyter as a tiny custom command/plugin.

## Notebook context wiring

The backend request already reads `notebookContext` from `POST /api/agent`.

To make that field non-null, your JupyterLab iframe must expose a command named
`ai:get-notebook-context` that returns:

```ts
{
  path: string;
  cells: Array<{ type: "code" | "markdown" | "raw"; source: string }>;
}
```

In your JupyterLab plugin, use `INotebookTracker` and the helper in
`src/lib/jupyter/getNotebookContext.ts`, then register:

```ts
app.commands.addCommand("ai:get-notebook-context", {
  execute: () => getNotebookContext(notebookTracker)
});
```

Once this command exists, the Next.js bridge calls it before each chat sync cycle,
and chat requests include the compact `notebookContext` object automatically.
