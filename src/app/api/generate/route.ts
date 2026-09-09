import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Pulls a "retry in Ns" hint out of a Gemini error message, if present.
function parseRetrySeconds(message: string): number {
  const retryMatch = message.match(/retry(?: in| after)?\s+([\d.]+)s/i);
  return retryMatch ? Math.ceil(Number(retryMatch[1])) : 15;
}

export async function POST(req: Request) {
  try {
    const {
      prompt,
      referenceImage,
      referenceImageMimeType,
    } = await req.json();

    const model = genAI.getGenerativeModel({
      // Lighter model = much higher free-tier quota than 3.6-flash.
      // Bump back to "gemini-3.6-flash" only if output quality needs it.
      model: "gemini-3.5-flash-lite",
    });

    let contents: any;

    if (referenceImage && referenceImageMimeType) {
      contents = [
        { text: prompt },
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

    // Retry temporary AND quota/rate-limit errors up to 4 times
    const MAX_ATTEMPTS = 4;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        result = await model.generateContent(contents);
        break;
      } catch (error) {
        lastError = error;

        const message =
          error instanceof Error ? error.message : String(error);

        const isTemporaryError =
          message.includes("503") ||
          message.includes("Service Unavailable") ||
          message.includes("high demand");

        const isQuotaError =
          message.includes("429") ||
          message.includes("Too Many Requests") ||
          message.includes("quota") ||
          message.includes("QuotaFailure");

        if ((!isTemporaryError && !isQuotaError) || attempt === MAX_ATTEMPTS) {
          throw error;
        }

        // For quota errors, respect Gemini's own suggested wait time.
        // For temporary errors, use simple linear backoff.
        const delayMs = isQuotaError
          ? parseRetrySeconds(message) * 1000
          : attempt * 3000;

        console.log(
          `Gemini ${isQuotaError ? "quota" : "temporarily unavailable"}. ` +
            `Retry ${attempt}/${MAX_ATTEMPTS} after ${delayMs}ms`
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
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

    console.error(
      "GEMINI ERROR DETAILS:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Gemini quota / rate-limit error (after retries exhausted)
    if (
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("QuotaFailure")
    ) {
      const retrySeconds = parseRetrySeconds(errorMessage);

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

    // Other Gemini / API errors
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