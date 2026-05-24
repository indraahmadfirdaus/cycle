import { NextResponse } from "next/server";

type ChatRequest = {
  message?: string;
  context?: {
    userType?: string;
    phase?: string;
    cycleDay?: number;
    mood?: string;
    symptoms?: string[];
  };
};

const disclaimer =
  "This is general health information, not medical advice. Please consult a healthcare professional for diagnosis or treatment.";

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const context = body.context;
  const systemPrompt = [
    "You are Cycle, an inclusive health companion.",
    "Use warm, concise, non-judgmental language.",
    "Never diagnose. Include a medical disclaimer for health interpretation.",
    `User type: ${context?.userType ?? "cycle tracker"}`,
    `Current phase: ${context?.phase ?? "unknown"}`,
    `Cycle day: ${context?.cycleDay ?? "unknown"}`,
    `Last mood: ${context?.mood ?? "unknown"}`,
    `Recent symptoms: ${context?.symptoms?.join(", ") || "none"}`
  ].join("\n");

  if (!apiKey) {
    return NextResponse.json({
      reply: `Based on your ${context?.phase ?? "current"} context, start with gentle basics: hydration, steady meals, sleep, and a short check-in with your body. If symptoms feel unusual, intense, or worrying, consider tracking when they happen and speaking with a clinician.\n\n${disclaimer}`
    });
  }

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 800
    })
  });

  if (!response.ok) {
    return NextResponse.json({
      reply: `I could not reach the AI service right now, but here is a steady fallback: note the symptom, its intensity, and where you are in your rhythm. If it is severe, new, or persistent, get professional support.\n\n${disclaimer}`
    });
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content ?? `I am here with you. ${disclaimer}`;
  return NextResponse.json({ reply });
}
