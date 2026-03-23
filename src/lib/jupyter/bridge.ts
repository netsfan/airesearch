import type { NotebookContext } from "@/types";
import { createBridge } from 'jupyter-iframe-commands-host';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';

type BridgeApi = {
  // execute: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
  execute: (command: string, args: ReadonlyPartialJSONObject) => Promise<unknown>;
  listCommands: () => Promise<string[]>;
  ready: Promise<void>;
};

export type BridgeReadyState = "idle" | "connecting" | "ready" | "error";

export type JupyterBridge = {
  waitUntilReady: () => Promise<void>;
  executeCommand: (commandId: string, args?: Record<string, string>) => Promise<unknown>;
  listAvailableCommands: () => Promise<string[]>;
  getNotebookContext: () => Promise<NotebookContext | null>;
  insertAiGeneratedCode: (code: string) => Promise<void>;
};

const NOTEBOOK_CONTEXT_COMMAND = "ai:get-notebook-context";

type NotebookContextCell = { type?: unknown; source?: unknown };

type NotebookContextLike = {
  path?: unknown;
  cells?: unknown;
};

function parseNotebookContext(value: unknown): NotebookContext | null {
  if (!value || typeof value !== "object") return null;

  const maybeContext = value as NotebookContextLike;
  if (typeof maybeContext.path !== "string" || !Array.isArray(maybeContext.cells)) return null;

  const cells = maybeContext.cells
    .filter((cell): cell is NotebookContextCell => Boolean(cell && typeof cell === "object"))
    .filter(
      (cell): cell is { type: "code" | "markdown" | "raw"; source: string } =>
        typeof cell.source === "string" && (cell.type === "code" || cell.type === "markdown" || cell.type === "raw")
    );

  return {
    path: maybeContext.path,
    cells
  };
}

function toBridge(api: BridgeApi): JupyterBridge {
  return {
    waitUntilReady: async () => {
      console.log("my waitUntilReady");
      console.log("api", api);
      console.log("api.ready", api.ready);
      await api.ready;
    },
    executeCommand: async (commandId, args) => {
      let myArgs: ReadonlyPartialJSONObject = args ?? {};
      return api.execute(commandId, myArgs);
    },
    listAvailableCommands: async () => {
      return api.listCommands();
    },
    getNotebookContext: async () => {
      try {
        // console.log("execute notebook context command");
        const result = await api.execute(NOTEBOOK_CONTEXT_COMMAND, {});
        // console.log("result", result);
        return parseNotebookContext(result);
      } catch (error) {
        console.error("error", error);
        // log error
        console.error("error executing notebook context command");
        return null;
      }
    },
    insertAiGeneratedCode: async (code) => {
      await api.execute("ai:insert-code-cell", { code });
    }
  };
}

export async function createJupyterBridge(iframeId: string): Promise<JupyterBridge> {
  return toBridge(createBridge({ iframeId }));
}
