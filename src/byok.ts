export type Provider = "openai" | "anthropic";

interface RunArgs {
  provider: Provider;
  model: string;
  key: string;
  prompt: string;
  signal?: AbortSignal;
}

const clean = (value: string): string => value.replace(/\s+/g, " ").trim().slice(0, 300);

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    if (data?.error?.message) return clean(data.error.message);
  } catch {
    /* not json */
  }
  return `${response.status} ${response.statusText}`.trim();
}

export async function runReview({ provider, model, key, prompt, signal }: RunArgs): Promise<string> {
  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are an adversarial reviewer. You do not praise. You name what is unverified and what would have to be true for the work to hold.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal,
    });
    if (!response.ok) throw new Error(await readError(response));
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response");
    return text;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    }),
    signal,
  });
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content
    ?.filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
  if (!text) throw new Error("Empty response");
  return text;
}
