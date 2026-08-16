import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const {
      prompt,
      referenceImage,
      referenceImageMimeType,
    } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    let contents: any;

    if (referenceImage && referenceImageMimeType) {
      contents = [
        {
          text: prompt,
        },
        {
          inlineData: {
            data: referenceImage,
            mimeType: referenceImageMimeType,
          },
        },
      ];
    } else {
      contents = prompt;
    }

    let result;
let lastError;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    
    result = await model.generateContent(contents);
    break;
  } catch (error) {
    lastError = error;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const isTemporaryError =
      message.includes("503") ||
      message.includes("Service Unavailable") ||
      message.includes("high demand");

    if (!isTemporaryError || attempt === 3) {
      throw error;
    }

    const delay = attempt * 3000;

    console.log(
      `Gemini temporarily unavailable. Retry ${attempt}/3 after ${delay}ms`
    );

    await new Promise((resolve) =>
      setTimeout(resolve, delay)
    );
  }
}

if (!result) {
  throw lastError || new Error("Gemini generation failed.");
}

const response = await result.response;
const text = response.text();

    return NextResponse.json({
      success: true,
      output: text,
    });
    } catch (error: any) {
    console.error("GEMINI ERROR:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    // Gemini quota / rate-limit error
    if (
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("QuotaFailure")
    ) {
      const retryMatch = errorMessage.match(
        /retry(?: in| after)?\s+([\d.]+)s/i
      );

      const retrySeconds = retryMatch
        ? Math.ceil(Number(retryMatch[1]))
        : 60;

      return NextResponse.json(
        {
          success: false,
          error: `Gemini API quota limit reached. Please wait approximately ${retrySeconds} seconds and try again.`,
          code: "QUOTA_EXCEEDED",
          retryAfter: retrySeconds,
        },
        { status: 429 }
      );
    }

    // Other Gemini/API errors
    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Unknown server error.",
        code: "GENERATION_FAILED",
      },
      { status: 500 }
    );
  }
}