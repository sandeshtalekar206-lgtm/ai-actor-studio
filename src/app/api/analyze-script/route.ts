import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Script is required.",
        },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    const analysisPrompt = `
You are a professional short-form comedy video director.

Analyze this script:

"${script}"

Determine the ideal number of video shots.

Rules:
- Do NOT split simply by word count.
- Identify distinct comedy beats.
- Identify setup, escalation, punchline and reaction/pause beats.
- Keep connected dialogue together.
- The final punchline should have enough space to land.
- Prefer the minimum number of shots needed for natural delivery.
- For a very short one-line joke, usually recommend 1–2 shots.
- Never remove, rewrite, shorten, or paraphrase the dialogue.

Return ONLY valid JSON in this exact structure:

{
  "shotCount": number,
  "shots": [
    {
      "shotNumber": number,
      "dialogue": "EXACT dialogue belonging to this shot",
      "beat": "short description of the comedy beat"
    }
  ]
}
`;

    let result;
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await model.generateContent(analysisPrompt);
        break;
      } catch (error) {
        lastError = error;

        const message =
          error instanceof Error ? error.message : String(error);

        const isTemporaryError =
          message.includes("503") ||
          message.includes("Service Unavailable") ||
          message.includes("high demand");

        if (!isTemporaryError || attempt === 3) {
          throw error;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 3000)
        );
      }
    }

    if (!result) {
      throw lastError || new Error("Script analysis failed.");
    }

    const text = result.response.text();

    // Remove accidental markdown code fences.
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const analysis = JSON.parse(cleaned);

    return NextResponse.json({
  success: true,
  shots: analysis.shots,
});
  } catch (error: any) {
    console.error("SCRIPT ANALYSIS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error) || "Script analysis failed.",
      },
      { status: 500 }
    );
  }
}