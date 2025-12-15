import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY. Create .env.local in the project root." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a helpful personal study assistant. Explain step-by-step in simple language and give a small example when helpful.",
        },
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({ reply: resp.output_text ?? "" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
