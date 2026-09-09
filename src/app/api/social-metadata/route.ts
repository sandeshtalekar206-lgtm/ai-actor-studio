import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const {
      script,
      platform,
      trendResearch,
      language,
      episode,
    } = await req.json();

    if (!script?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Script is required.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 1. MODEL
    // ============================================================

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // ============================================================
    // 2. CURRENT TREND RESEARCH
    // ============================================================

    const researchContext = trendResearch
      ? `
CURRENT TREND RESEARCH:

${JSON.stringify(trendResearch, null, 2)}

IMPORTANT:
GROWTH / TREND RULES:

- Every final title, tag and hashtag must have a clear connection to either:
  a) the actual script, or
  b) a relevant signal found in CURRENT TREND RESEARCH.
- Before selecting the final metadata, compare it against the supplied research.
- Prefer researched topic/keyword/title-pattern signals over generic comedy best practices.
- If a researched keyword is highly relevant to the script, use it naturally in the title, description, caption or tags.
- Do not output generic metadata when a more specific research-backed option is available.
- The final metadata should feel specifically created for THIS script, not for comedy content in general.

- Use the CURRENT TREND RESEARCH provided below as an important input.
- Do not generate generic metadata if relevant research signals are available.
- Identify the strongest topic, keyword, audience phrase, title pattern and content angle from the research.
- Prioritize metadata that has a clear relationship to the actual script AND current search/content signals.
- Use relevant high-interest keywords naturally.
- Prefer specific Indian/Hinglish comedy search intent over generic terms like "funny video" or "comedy video".
- Titles should create curiosity while clearly matching the actual joke.
- Avoid generic titles that could apply to any comedy video.
- Hashtags must be closely related to the actual topic and audience.
- YouTube tags should combine:
  1. exact topic intent,
  2. Hinglish/Indian comedy intent,
  3. relevant niche terms,
  4. short-form discovery terms.
- Do not use a hashtag only because it is generally popular.
- Do not claim something is trending unless the supplied research supports it.
- If research signals conflict with generic best practices, prioritize the actual research signals.
- Treat this research as current market/content signals.
- Use it to understand what topics, keywords, title structures,
  hashtag patterns and content angles are currently relevant.
- Do NOT copy any creator's exact title, caption, hashtag,
  wording or phrase.
- Do NOT assume that a trend guarantees virality.
- Use research as a signal, not as a guarantee.
`
      : `
No current trend research was provided.

Use only the script itself and general short-form content principles.
Do not claim that something is currently trending.
`;

    // ============================================================
    // 3. GROWTH STRATEGY PROMPT
    // ============================================================

    const prompt = `
You are an expert social-media growth strategist specializing in
Indian short-form comedy content.

Your job is NOT simply to generate metadata.

Your job is to analyze the joke and create metadata designed to
maximize discoverability, curiosity, relevance, engagement and
click-through potential WITHOUT using misleading clickbait.

============================================================
CONTENT
============================================================

EPISODE:
${episode || "Untitled Episode"}

LANGUAGE:
${language || "Hinglish"}

REQUESTED PLATFORM:
${platform || "all"}

SCRIPT:
"${script}"

${researchContext}

============================================================
STEP 1 — UNDERSTAND THE JOKE
============================================================

Before generating metadata, internally identify:

- What is the actual joke?
- What is the punchline?
- What is the main topic?
- What emotion does the joke create?
- What makes the joke relatable?
- Who is most likely to relate to it?
- What is the strongest hook?
- What words naturally describe the content?

Do NOT output this internal reasoning.

============================================================
STEP 2 — GROWTH STRATEGY
============================================================

Use these principles:

1. CURIOUSITY
Create a reason for the viewer to click/watch.

2. RELATABILITY
Prefer situations Indian viewers immediately understand.

3. PUNCHLINE VALUE
Where appropriate, build curiosity around the punchline
without revealing the entire joke.

4. NATURAL SEARCH RELEVANCE
Use relevant keywords naturally.

5. CURRENT SIGNALS
Use the supplied trend research when available.

6. ORIGINALITY
Never copy competitor wording.

7. NO KEYWORD STUFFING
Every keyword and hashtag must have a logical connection
to the actual content.

8. NO FALSE CLAIMS
Never use "viral", "trending", "breaking", "millions watched"
or similar claims unless explicitly supported by the research.

9. NO GENERIC SPAM
Avoid filling metadata with generic hashtags that have little
connection to the actual joke.

10. MOBILE FIRST
Titles and overlay text must be understandable quickly on mobile.

============================================================
YOUTUBE STRATEGY
============================================================

Generate ONE strongest YouTube title.

The title should:

- create curiosity
- reflect the actual joke
- feel natural to Indian viewers
- contain useful searchable wording where appropriate
- avoid misleading clickbait
- avoid unnecessary emojis
- avoid automatically adding #Shorts unless it genuinely helps
- preferably put the strongest hook early

Description should:

- naturally explain the comedy situation
- contain relevant keywords naturally
- encourage engagement when appropriate
- avoid keyword stuffing

Tags should:

- be highly relevant
- include topic variations
- include audience/search variations
- include Indian/Hinglish comedy variations where relevant
- avoid unrelated high-volume keywords

Thumbnail:

Create a strong visual concept designed for attention.

Overlay:

2–6 words maximum.

Do NOT simply copy the entire punchline.

============================================================
INSTAGRAM STRATEGY
============================================================

Instagram should prioritize:

- immediate relatability
- shareability
- comments
- saves
- Reels discovery
- natural Hinglish/Indian audience language

Title should be short and hook-oriented.

Caption should:

- feel conversational
- support the joke
- encourage interaction naturally
- avoid sounding like SEO spam

Hashtags should be a focused mixture of:

- content topic
- comedy niche
- Indian/Hinglish audience
- relevant Reels discovery

Do NOT generate a huge irrelevant hashtag list.

Thumbnail should be visually strong for a Reel cover.

Overlay should be 2–6 words.

============================================================
FACEBOOK STRATEGY
============================================================

Facebook should prioritize:

- broad relatability
- shareability
- conversational language
- Indian audience relevance
- easy understanding without extra context

Title should be clickable but natural.

Description should encourage viewers to watch/share/comment
without sounding spammy.

Hashtags should remain relevant and limited.

Thumbnail and overlay should work for mobile feeds.

============================================================
RESEARCH USAGE
============================================================

If trend research is available:

Use:

- keywords
- titlePatterns
- hashtagPatterns
- contentAngles
- audiencePhrases
- researchSummary

to improve the metadata.

Do NOT blindly copy them.

If research contains posting-time information:

Preserve the useful posting recommendations in the response.

Do NOT invent posting times.

============================================================
TITLE SELECTION
============================================================

Internally generate several possible title directions and
choose the strongest one.

Evaluate each candidate using:

- curiosity
- relatability
- punchline connection
- search relevance
- originality
- natural language
- mobile readability
- Indian audience appeal
- misleading-clickbait risk

Only return the strongest final title.

============================================================
THUMBNAIL STRATEGY
============================================================

Thumbnail prompts must describe:

- subject
- facial expression
- action/reaction
- composition
- camera framing
- lighting
- visual contrast
- comedy emotion
- mobile readability

Do NOT put long text inside the generated image.

OverlayText must remain short.

============================================================
POSTING TIME
============================================================

If trendResearch contains posting-time recommendations,
include them in the research section.

Do NOT invent new exact posting times.

If reliable posting-time research is unavailable,
use:

"Insufficient data"

rather than pretending the timing is certain.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Return EXACTLY this structure:

{
  "research": {
    "summary": "",
    "keywords": [],
    "titlePatterns": [],
    "hashtagPatterns": [],
    "sources": [],
    "postingTime": {
      "youtube": {
        "bestDay": "",
        "bestTime": "",
        "backupDay": "",
        "backupTime": "",
        "confidence": "",
        "reason": ""
      },
      "instagram": {
        "bestDay": "",
        "bestTime": "",
        "backupDay": "",
        "backupTime": "",
        "confidence": "",
        "reason": ""
      },
      "facebook": {
        "bestDay": "",
        "bestTime": "",
        "backupDay": "",
        "backupTime": "",
        "confidence": "",
        "reason": ""
      },
      "overall": {
        "bestDay": "",
        "bestTime": "",
        "confidence": "",
        "reason": ""
      }
    },
    "bestPostingTimes": [],
    "postingTimeReason": ""
  },

  "youtube": {
    "title": "",
    "description": "",
    "tags": [],
    "thumbnailPrompt": "",
    "overlayText": ""
  },

  "instagram": {
    "title": "",
    "caption": "",
    "hashtags": [],
    "thumbnailPrompt": "",
    "overlayText": ""
  },

  "facebook": {
    "title": "",
    "description": "",
    "hashtags": [],
    "thumbnailPrompt": "",
    "overlayText": ""
  }
}

RESEARCH RULES:

- summary must describe useful current content direction.
- keywords must be relevant to the actual script.
- titlePatterns must describe approaches, not copied titles.
- hashtagPatterns must describe useful hashtag strategies.
- sources must contain only reliable URLs actually present in the
  supplied research.
- If no reliable sources exist, return [].
- bestPostingTimes must only use timing information available
  in trendResearch.
- Never invent precise posting data.

YOUTUBE RULES:

- One strongest title only.
- Natural description.
- Relevant tags only.
- Strong thumbnail prompt.
- Overlay text: 2–6 words.

INSTAGRAM RULES:

- Short hook-oriented title.
- Conversational caption.
- Focused relevant hashtags.
- Strong Reel-cover thumbnail prompt.
- Overlay text: 2–6 words.

FACEBOOK RULES:

- Natural clickable title.
- Share-friendly description.
- Relevant hashtags.
- Strong mobile thumbnail prompt.
- Overlay text: 2–6 words.
`;

    // ============================================================
    // 4. GENERATE
    // ============================================================

    let result;
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await model.generateContent(prompt);
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
      throw lastError || new Error("Social metadata generation failed.");
    }

    // ============================================================
    // 5. PARSE RESPONSE
    // ============================================================

    const text = result.response.text().trim();

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let metadata: any;

    try {
      metadata = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("SOCIAL METADATA INVALID JSON:", cleaned);

      throw new Error(
        "Gemini returned an invalid social metadata response."
      );
    }

    // ============================================================
    // 6. SAFE DEFAULTS
    // ============================================================

    const defaultPostingPlatform = {
      bestDay: "",
      bestTime: "",
      backupDay: "",
      backupTime: "",
      confidence: "",
      reason: "",
    };

    const defaultPostingTime = {
      youtube: { ...defaultPostingPlatform },
      instagram: { ...defaultPostingPlatform },
      facebook: { ...defaultPostingPlatform },
      overall: {
        bestDay: "",
        bestTime: "",
        confidence: "",
        reason: "",
      },
    };

    const safeMetadata = {
      research: {
        summary: metadata?.research?.summary || "",

        keywords: Array.isArray(metadata?.research?.keywords)
          ? metadata.research.keywords
          : [],

        titlePatterns: Array.isArray(metadata?.research?.titlePatterns)
          ? metadata.research.titlePatterns
          : [],

        hashtagPatterns: Array.isArray(
          metadata?.research?.hashtagPatterns
        )
          ? metadata.research.hashtagPatterns
          : [],

        sources: Array.isArray(metadata?.research?.sources)
          ? metadata.research.sources
          : [],

        postingTime: {
          youtube: {
            ...defaultPostingPlatform,
            ...(metadata?.research?.postingTime?.youtube || {}),
          },

          instagram: {
            ...defaultPostingPlatform,
            ...(metadata?.research?.postingTime?.instagram || {}),
          },

          facebook: {
            ...defaultPostingPlatform,
            ...(metadata?.research?.postingTime?.facebook || {}),
          },

          overall: {
            ...defaultPostingTime.overall,
            ...(metadata?.research?.postingTime?.overall || {}),
          },
        },

        bestPostingTimes: Array.isArray(
          metadata?.research?.bestPostingTimes
        )
          ? metadata.research.bestPostingTimes
          : [],

        postingTimeReason:
          metadata?.research?.postingTimeReason || "",
      },

      youtube: {
        title: metadata?.youtube?.title || "",

        description:
          metadata?.youtube?.description || "",

        tags: Array.isArray(metadata?.youtube?.tags)
          ? metadata.youtube.tags
          : [],

        thumbnailPrompt:
          metadata?.youtube?.thumbnailPrompt || "",

        overlayText:
          metadata?.youtube?.overlayText || "",
      },

      instagram: {
        title: metadata?.instagram?.title || "",

        caption:
          metadata?.instagram?.caption || "",

        hashtags: Array.isArray(metadata?.instagram?.hashtags)
          ? metadata.instagram.hashtags
          : [],

        thumbnailPrompt:
          metadata?.instagram?.thumbnailPrompt || "",

        overlayText:
          metadata?.instagram?.overlayText || "",
      },

      facebook: {
        title: metadata?.facebook?.title || "",

        description:
          metadata?.facebook?.description || "",

        hashtags: Array.isArray(metadata?.facebook?.hashtags)
          ? metadata.facebook.hashtags
          : [],

        thumbnailPrompt:
          metadata?.facebook?.thumbnailPrompt || "",

        overlayText:
          metadata?.facebook?.overlayText || "",
      },
    };

    // ============================================================
    // 7. SUCCESS
    // ============================================================

    return NextResponse.json({
      success: true,
      metadata: safeMetadata,
    });
  } catch (error) {
    console.error("SOCIAL METADATA ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : String(error) || "Social metadata generation failed.";

    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("429") ||
      lowerMessage.includes("quota") ||
      lowerMessage.includes("too many requests")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini API quota/rate limit reached. Please try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}