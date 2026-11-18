import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectDiscovery } from "@/components/project-discovery";
export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16 sm:px-10">
      <div className="mb-8 grid size-12 place-items-center rounded-xl bg-primary font-semibold text-primary-foreground">
        A
      </div>
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        YOUR APP STARTS HERE
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
        Welcome to Arkeid.
      </h1>
      <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
        A clean foundation for your next app. Bring your own idea, design and
        experience.
      </p>
      <div className="mt-8">
        <Button asChild>
          <a href="#getting-started">
            How to use this template <span aria-hidden="true">↗</span>
          </a>
        </Button>
      </div>
      <Card className="mt-12" id="getting-started">
        <CardContent className="space-y-5 pt-6">
          <h2 className="text-lg font-semibold">Make it yours</h2>
          <ol className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                1. Build your interface.
              </span>{" "}
              Start in <code>src/App.tsx</code>. There’s no example app to
              remove.
            </li>
            <li>
              <span className="font-medium text-foreground">
                2. Define your design.
              </span>{" "}
              Customize <code>src/styles/tokens.css</code>, use Tailwind
              utilities and extend the shadcn components.
            </li>
            <li>
              <span className="font-medium text-foreground">
                3. Connect platform features.
              </span>{" "}
              Use the typed SDK in <code>sdk/arcade.ts</code>. The local
              playground handles mock wallet and confirmation controls.
            </li>
            <li>
              <span className="font-medium text-foreground">
                4. Follow the contract.
              </span>{" "}
              Read <code>AGENTS.md</code> and <code>arcade.manifest.json</code>,
              then run <code>npm run check</code>, <code>npm test</code> and{" "}
              <code>npm run build</code>.
            </li>
          </ol>
          <ProjectDiscovery />
        </CardContent>
      </Card>
    </main>
  );
}
