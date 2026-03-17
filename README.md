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
  - Prefers `jupyter-iframe-commands-host`
  - Includes a minimal postMessage fallback for MVP local wiring

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
