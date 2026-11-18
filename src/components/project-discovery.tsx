import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import discovery from "@/content/project-discovery-prompt.json";

export function ProjectDiscovery() {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [selected, setSelected] = useState(false);
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
        onClick={() => {
          field.current?.focus();
          field.current?.select();
          setSelected(true);
        }}
      >
        Select prompt to copy
      </Button>
      <p className="mt-3 text-xs text-muted-foreground" role="status">
        {selected
          ? "Press ⌘C on Mac or Ctrl+C on Windows/Linux, then paste into your coding assistant."
          : "Selecting the prompt is free and makes no AI request. Your coding assistant’s own usage terms apply."}
      </p>
    </details>
  );
}
