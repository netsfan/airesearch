# AI Research MVP

Simple frontend-only MVP for an AI research workspace built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- 3-pane desktop layout:
  - **Data Sources** (left)
  - **Notebook** (middle)
  - **AI Chat** (right)
- Expandable mock data sources and tables
- Notebook with Markdown + SQL cells
- Fake run behavior for cells
- Chat with simple rule-based assistant replies
- "Insert into notebook" action from assistant messages

## Run locally

```bash
yarn install
yarn dev
```

Then open `http://localhost:3000`.

## Notes

- No backend, auth, database, or real AI calls
- All data is mocked in React state
