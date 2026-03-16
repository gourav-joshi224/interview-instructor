import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getCachedEvaluation, saveCachedEvaluation, saveInterview } from "@/lib/firebase";
import { ensureGroqKey, groq } from "@/lib/groq";
import {
  buildEvaluationPrompt,
  normalizeEvaluation,
  parseJsonObject,
} from "@/lib/interview-ai";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      topic?: string;
      experience?: string;
      difficulty?: string;
      question?: string;
      answer?: string;
    };

    if (
      !body.topic ||
      !body.experience ||
      !body.difficulty ||
      !body.question ||
      !body.answer
    ) {
      return NextResponse.json(
        { error: "Topic, experience, difficulty, question, and answer are required." },
        { status: 400 },
      );
    }

    ensureGroqKey();

    const cacheKey = createHash("sha256")
      .update(`${body.question}::${body.answer}`)
      .digest("hex");

    const cachedEvaluation = await getCachedEvaluation(cacheKey);

    if (cachedEvaluation) {
      const interviewId = await saveInterview({
        topic: body.topic,
        experience: body.experience,
        difficulty: body.difficulty,
        question: body.question,
        answer: body.answer,
        ...cachedEvaluation,
        cached: true,
      });

      return NextResponse.json({
        ...cachedEvaluation,
        interviewId,
        cached: true,
      });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a backend interview evaluator. Return only a valid JSON object that matches the requested shape.",
        },
        {
          role: "user",
          content: buildEvaluationPrompt({
            question: body.question,
            answer: body.answer,
          }),
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const evaluation = normalizeEvaluation(parseJsonObject(content));

    await saveCachedEvaluation(cacheKey, {
      topic: body.topic,
      experience: body.experience,
      difficulty: body.difficulty,
      question: body.question,
      answer: body.answer,
      ...evaluation,
      cached: false,
    });

    const interviewId = await saveInterview({
      topic: body.topic,
      experience: body.experience,
      difficulty: body.difficulty,
      question: body.question,
      answer: body.answer,
      ...evaluation,
      cached: false,
    });

    return NextResponse.json({
      ...evaluation,
      interviewId,
      cached: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to evaluate interview answer.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
