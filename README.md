# AI Research MVP

Minimal single-app Next.js MVP with a tool-using data agent.

## Features

- 3-pane layout:
  - **Data Sources** (left): select table
  - **Notebook** (middle): markdown/sql cells
  - **AI Chat** (right): asks backend agent about selected table
- `POST /api/agent` route using OpenAI Responses API
- Exactly 3 tools:
  - `list_tables`
  - `summarize_table`
  - `create_notebook_cell`
- Deterministic table summaries computed server-side from shared mock tables

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Set your API key before starting dev server:

```bash
export OPENAI_API_KEY="your_key_here"
```

If the key is missing, the chat pane will show a clear error from `/api/agent`.
