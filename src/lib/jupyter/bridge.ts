import type { NotebookContext } from "@/types";

type BridgeApi = {
  execute: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
  listCommands: () => Promise<string[]>;
  ready: Promise<void>;
};

export type BridgeReadyState = "idle" | "connecting" | "ready" | "error";

export type JupyterBridge = {
  waitUntilReady: () => Promise<void>;
  executeCommand: (commandId: string, args?: Record<string, unknown>) => Promise<unknown>;
  listAvailableCommands: () => Promise<string[]>;
  getNotebookContext: () => Promise<NotebookContext | null>;
  insertAiGeneratedCode: (code: string) => Promise<void>;
};

const PACKAGE_NAME = "jupyter-iframe-commands-host";
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

async function loadHostPackage(): Promise<Record<string, unknown>> {
  const dynamicImport = new Function("name", "return import(name);") as (name: string) => Promise<Record<string, unknown>>;
  return dynamicImport(PACKAGE_NAME);
}

function toBridge(api: BridgeApi): JupyterBridge {
  return {
    waitUntilReady: async () => {
      await api.ready;
    },
    executeCommand: async (commandId, args) => {
      return api.execute(commandId, args ?? {});
    },
    listAvailableCommands: async () => {
      return api.listCommands();
    },
    getNotebookContext: async () => {
      try {
        const result = await api.execute(NOTEBOOK_CONTEXT_COMMAND, {});
        return parseNotebookContext(result);
      } catch {
        return null;
      }
    },
    insertAiGeneratedCode: async (code) => {
      await api.execute("ai:insert-and-run-code", { code });
    }
  };
}

export async function createJupyterBridge(iframeId: string): Promise<JupyterBridge> {
  const hostModule = await loadHostPackage();
  const createBridge = hostModule.createBridge as ((config: { iframeId: string }) => BridgeApi) | undefined;

  if (!createBridge) {
    throw new Error("jupyter-iframe-commands-host is missing createBridge().");
  }

  return toBridge(createBridge({ iframeId }));
}
