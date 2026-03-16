import { NextRequest, NextResponse } from "next/server";
import { ensureGroqKey, groq } from "@/lib/groq";
import { buildQuestionPrompt, parseJsonObject } from "@/lib/interview-ai";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      topic?: string;
      experience?: string;
      difficulty?: string;
    };

    if (!body.topic || !body.experience || !body.difficulty) {
      return NextResponse.json(
        { error: "Topic, experience, and difficulty are required." },
        { status: 400 },
      );
    }

    ensureGroqKey();

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior backend interviewer. Return only a valid JSON object with a single question field.",
        },
        {
          role: "user",
          content: buildQuestionPrompt({
            topic: body.topic,
            experience: body.experience,
            difficulty: body.difficulty,
          }),
        },
      ],
      max_completion_tokens: 80,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const parsed = parseJsonObject(content) as { question?: unknown };
    const question = typeof parsed.question === "string" ? parsed.question.trim() : "";

    if (!question) {
      throw new Error("Model returned an empty question.");
    }

    return NextResponse.json({ question });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate interview question.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
