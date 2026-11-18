// Fixed onboarding text only: never accept arbitrary clipboard contents from an app.
export async function copyStarterPrompt(
  message,
  { prompt, userActive, writeText },
) {
  if (
    message.type !== "arkeid:copy-starter-prompt" ||
    typeof message.id !== "string" ||
    !/^[a-f0-9-]{36}$/.test(message.id) ||
    Object.keys(message).some((key) => !["type", "channel", "id"].includes(key))
  )
    throw new Error("Unsupported copy request");
  if (!userActive) throw new Error("Click Copy prompt again to allow copying.");
  if (typeof prompt !== "string" || !prompt)
    throw new Error("Starter prompt unavailable");
  await writeText(prompt);
}
