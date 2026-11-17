import { checkProject } from "./project.mjs";
try {
  const result = await checkProject();
  if (process.argv.includes("--json"))
    console.log(JSON.stringify(result, null, 2));
  else {
    console.log(
      result.ok
        ? "Local starter checks passed."
        : "Local starter checks failed:",
    );
    for (const line of [...result.errors, ...result.warnings])
      console.log(line);
  }
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
