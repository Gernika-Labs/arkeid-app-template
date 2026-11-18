import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import discovery from "@/content/project-discovery-prompt.json";
import { copyDiscoveryPrompt } from "../../sdk/arcade";

export function ProjectDiscovery() {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<
    "idle" | "copying" | "copied" | "fallback"
  >("idle");
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Need a starting point? Copy the guided prompt.
      </summary>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Paste this prompt into your AI coding assistant to shape your idea
        before writing code.
      </p>
      <label className="mt-4 block text-sm font-medium" htmlFor={id}>
        Project discovery prompt
      </label>
      <textarea
        ref={field}
        id={id}
        readOnly
        value={discovery.prompt}
        rows={12}
        className="mt-2 w-full rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed focus-visible:outline-2 focus-visible:outline-ring"
      />
      <Button
        className="mt-3"
        variant="outline"
        disabled={status === "copying"}
        onClick={async () => {
          setStatus("copying");
          try {
            await copyDiscoveryPrompt();
            setStatus("copied");
          } catch {
            field.current?.focus();
            field.current?.select();
            setStatus("fallback");
          }
        }}
      >
        {status === "copying"
          ? "Copying…"
          : status === "copied"
            ? "Copied!"
            : "Copy prompt"}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground" role="status">
        {status === "copied"
          ? "Prompt copied. Paste it into your coding assistant."
          : status === "fallback"
            ? "Your browser blocked copying. The prompt is selected: press ⌘C or Ctrl+C."
            : "Copying is free and makes no AI request. Your coding assistant’s own usage terms apply."}
      </p>
    </details>
  );
}
