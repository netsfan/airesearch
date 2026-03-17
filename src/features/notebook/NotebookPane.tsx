"use client";

import { useEffect, useMemo, useState } from "react";
import { createJupyterBridge, type BridgeReadyState, type JupyterBridge } from "@/lib/jupyter/bridge";
import type { NotebookContext } from "@/types";

type Props = {
  latestAiCode?: string;
  onNotebookContextChange: (context: NotebookContext | null) => void;
};

const IFRAME_ID = "jupyterlab-iframe";

export default function NotebookPane({ latestAiCode, onNotebookContextChange }: Props) {
  const [bridgeState, setBridgeState] = useState<BridgeReadyState>("idle");
  const [bridge, setBridge] = useState<JupyterBridge | null>(null);
  const [feedback, setFeedback] = useState("Bridge not initialized yet.");

  const jupyterUrl = useMemo(() => process.env.NEXT_PUBLIC_JUPYTER_URL ?? "http://localhost:8888/lab", []);

  useEffect(() => {
    let isCancelled = false;

    const initBridge = async () => {
      setBridgeState("connecting");
      try {
        const nextBridge = await createJupyterBridge(IFRAME_ID);
        await nextBridge.waitUntilReady();
        if (isCancelled) return;

        setBridge(nextBridge);
        setBridgeState("ready");
        setFeedback("Connected to embedded JupyterLab.");
      } catch (error) {
        if (isCancelled) return;
        const message = error instanceof Error ? error.message : "Unknown bridge initialization error";
        setBridgeState("error");
        setFeedback(message);
      }
    };

    initBridge();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bridge) {
      onNotebookContextChange(null);
      return;
    }

    let isCancelled = false;

    const syncContext = async () => {
      try {
        const context = await bridge.getNotebookContext();
        if (!isCancelled) {
          onNotebookContextChange(context);
        }
      } catch {
        if (!isCancelled) {
          onNotebookContextChange(null);
        }
      }
    };

    void syncContext();
    const intervalId = window.setInterval(() => {
      void syncContext();
    }, 1500);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [bridge, onNotebookContextChange]);

  const runCommand = async (commandId: string) => {
    if (!bridge) return;
    try {
      await bridge.executeCommand(commandId);
      setFeedback(`Ran command: ${commandId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to run ${commandId}`;
      setFeedback(message);
    }
  };

  const listCommands = async () => {
    if (!bridge) return;
    try {
      const commands = await bridge.listAvailableCommands();
      setFeedback(commands.length ? `Available commands (${commands.length}): ${commands.slice(0, 12).join(", ")}` : "No commands reported by Jupyter.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list commands";
      setFeedback(message);
    }
  };

  const sendAiCodeStub = async () => {
    if (!bridge || !latestAiCode) {
      setFeedback("No AI code is queued for notebook insertion yet.");
      return;
    }

    try {
      await bridge.insertAiGeneratedCode(latestAiCode);
      setFeedback("Sent code to custom Jupyter command ai:insert-and-run-code.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send AI code to notebook";
      setFeedback(message);
    }
  };

  return (
    <section className="flex h-full flex-col border-x border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Notebook</h2>
        <button onClick={() => runCommand("application:toggle-left-area")} disabled={bridgeState !== "ready"} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
          Toggle left sidebar
        </button>
        <button onClick={() => runCommand("notebook:create-new")} disabled={bridgeState !== "ready"} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
          Create notebook
        </button>
        <button onClick={() => runCommand("notebook:insert-cell-below")} disabled={bridgeState !== "ready"} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
          Insert cell below
        </button>
        <button onClick={listCommands} disabled={bridgeState !== "ready"} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
          List commands
        </button>
        <button onClick={sendAiCodeStub} disabled={bridgeState !== "ready" || !latestAiCode} className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs text-blue-700">
          Send latest AI code (stub)
        </button>
      </div>

      <p className="mb-3 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Bridge status: {bridgeState}. {feedback}</p>

      <iframe id={IFRAME_ID} src={jupyterUrl} title="Embedded JupyterLab" className="h-full w-full rounded-lg border border-slate-200 bg-white" />
    </section>
  );
}
