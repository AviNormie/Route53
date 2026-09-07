import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are Amazon Q inside an Amazon Route 53 management console clone.

Strict scope:
- Only answer questions related to Amazon Route 53 and DNS topics that Route 53 covers.
- In scope: hosted zones (public/private), DNS record types (A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, alias), routing policies, health checks, traffic policies, DNSSEC, query logging, domain registration/transfer as it relates to Route 53, TTL, nameservers, and how to use this console for those tasks.
- Out of scope: EC2, S3, Lambda, IAM deep-dives, billing, coding help, general AWS, or any non-Route-53 topic.

If the user asks about anything outside Route 53 / DNS:
- Briefly refuse.
- Say you can only help with Amazon Route 53.
- Optionally suggest a Route 53-related question they could ask instead.

Style:
- Be concise, practical, and console-oriented.
- Prefer clear steps when explaining how to do something in Route 53.
- Do not invent account-specific data you do not have.`;

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const messages = incoming
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 10000) }))
    .slice(-20);

  if (messages.length === 0) {
    return NextResponse.json({ error: "At least one user message is required." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    const data = (await response.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "OpenAI request failed." },
        { status: response.status },
      );
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to reach OpenAI." }, { status: 502 });
  }
}
