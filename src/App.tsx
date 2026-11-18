import { Card, CardContent } from "@/components/ui/card";
import { ProjectDiscovery } from "@/components/project-discovery";

const steps = [
  { title: "Build your app", path: "src/App.tsx" },
  { title: "Set your design", path: "src/styles/tokens.css" },
  { title: "Use platform features", path: "sdk/arcade.ts" },
  { title: "Read the guardrails", path: "AGENTS.md" },
];

export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-8 sm:px-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome to Arkeid.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your idea. Your design. The foundation is ready.
        </p>
      </header>
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Start here</h2>
          <ol className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step.path} className="text-sm">
                <p className="font-medium">
                  <span className="mr-2 text-muted-foreground">
                    {index + 1}.
                  </span>
                  {step.title}
                </p>
                <code className="mt-1 inline-block">{step.path}</code>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
            Before submitting: <code>npm run check</code> ·{" "}
            <code>npm test</code> · <code>npm run build</code>
          </p>
        </CardContent>
      </Card>
      <ProjectDiscovery />
      <p className="text-xs text-muted-foreground">
        React · TypeScript · Tailwind · shadcn/ui
      </p>
    </main>
  );
}
