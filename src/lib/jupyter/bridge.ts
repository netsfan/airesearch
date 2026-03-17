import type { NotebookContext } from "@/types";

export type BridgeReadyState = "idle" | "connecting" | "ready" | "error";

type HostBridgeLike = {
  waitForReady?: () => Promise<void>;
  ready?: () => Promise<void>;
  executeCommand?: (commandId: string, args?: Record<string, unknown>) => Promise<unknown>;
  runCommand?: (commandId: string, args?: Record<string, unknown>) => Promise<unknown>;
  listCommands?: () => Promise<string[]>;
  getNotebookContext?: () => Promise<NotebookContext | null>;
};

export type JupyterBridge = {
  waitUntilReady: () => Promise<void>;
  executeCommand: (commandId: string, args?: Record<string, unknown>) => Promise<unknown>;
  listAvailableCommands: () => Promise<string[]>;
  getNotebookContext: () => Promise<NotebookContext | null>;
  insertAiGeneratedCode: (code: string) => Promise<void>;
};

const PACKAGE_NAME = "jupyter-iframe-commands-host";

async function loadHostPackage(): Promise<Record<string, unknown>> {
  const dynamicImport = new Function("name", "return import(name);") as (name: string) => Promise<Record<string, unknown>>;
  return dynamicImport(PACKAGE_NAME);
}

function createPostMessageFallback(iframeId: string): JupyterBridge {
  const iframe = () => document.getElementById(iframeId) as HTMLIFrameElement | null;

  const sendRpc = async (type: string, payload: Record<string, unknown>) => {
    const frame = iframe();
    if (!frame?.contentWindow) {
      throw new Error(`Jupyter iframe with id \"${iframeId}\" is not available.`);
    }

    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return new Promise<unknown>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", onMessage);
        reject(new Error(`Timeout waiting for ${type} response from embedded JupyterLab.`));
      }, 8000);

      const onMessage = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow) return;

        const data = event.data as { requestId?: string; success?: boolean; result?: unknown; error?: string };
        if (data?.requestId !== requestId) return;

        window.clearTimeout(timeout);
        window.removeEventListener("message", onMessage);

        if (data.success) resolve(data.result);
        else reject(new Error(data.error ?? `Failed to execute ${type}`));
      };

      const targetWindow = frame.contentWindow;
      if (!targetWindow) {
        window.removeEventListener("message", onMessage);
        reject(new Error("Jupyter iframe content window is not ready."));
        return;
      }

      window.addEventListener("message", onMessage);
      targetWindow.postMessage({ channel: "jupyter-iframe-commands", type, requestId, payload }, "*");
    });
  };

  return {
    waitUntilReady: async () => {
      await sendRpc("ready", {});
    },
    executeCommand: async (commandId, args) => {
      return sendRpc("execute-command", { commandId, args });
    },
    listAvailableCommands: async () => {
      const result = await sendRpc("list-commands", {});
      return Array.isArray(result) ? (result as string[]) : [];
    },
    getNotebookContext: async () => {
      const result = await sendRpc("get-notebook-context", {});
      return (result ?? null) as NotebookContext | null;
    },
    insertAiGeneratedCode: async () => {
      throw new Error("TODO: implement a custom Jupyter command such as ai:insert-and-run-code in the iframe app.");
    }
  };
}

function toBridge(hostBridge: HostBridgeLike): JupyterBridge {
  return {
    waitUntilReady: async () => {
      if (hostBridge.waitForReady) return hostBridge.waitForReady();
      if (hostBridge.ready) return hostBridge.ready();
    },
    executeCommand: async (commandId, args) => {
      if (hostBridge.executeCommand) return hostBridge.executeCommand(commandId, args);
      if (hostBridge.runCommand) return hostBridge.runCommand(commandId, args);
      throw new Error("Host bridge does not support command execution.");
    },
    listAvailableCommands: async () => {
      if (!hostBridge.listCommands) return [];
      return hostBridge.listCommands();
    },
    getNotebookContext: async () => {
      if (!hostBridge.getNotebookContext) {
        return null;
      }

      return hostBridge.getNotebookContext();
    },
    insertAiGeneratedCode: async (code) => {
      await (hostBridge.executeCommand?.("ai:insert-and-run-code", { code }) ?? hostBridge.runCommand?.("ai:insert-and-run-code", { code }));
    }
  };
}

export async function createJupyterBridge(iframeId: string): Promise<JupyterBridge> {
  try {
    const hostModule = await loadHostPackage();
    const createFactory = hostModule.createIframeCommandsHost as ((config: { iframeId: string }) => HostBridgeLike) | undefined;
    const HostBridgeCtor = hostModule.IframeCommandsHost as (new (config: { iframeId: string }) => HostBridgeLike) | undefined;

    const rawBridge = createFactory?.({ iframeId }) ?? (HostBridgeCtor ? new HostBridgeCtor({ iframeId }) : undefined);
    if (!rawBridge) {
      throw new Error("Could not initialize jupyter-iframe-commands-host.");
    }

    return toBridge(rawBridge);
  } catch (error) {
    console.warn("Falling back to postMessage bridge because jupyter-iframe-commands-host was not available.", error);
    return createPostMessageFallback(iframeId);
  }
}
