import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

type PostingRecommendation = {
  bestDay: string;
  bestTime: string;
  backupDay: string;
  backupTime: string;
  confidence: string;
  reason: string;
};

type TrendEvidence = {
  claim: string;
  source: string;
  reason: string;
};

type TrendSource = {
  title: string;
  url: string;
  use: string;
};

type TrendResearch = {
  topic: string;

  trendStatus: string;
  trendConfidence: string;
  evidenceScore: number;

  keywords: string[];
  titlePatterns: string[];
  relevantHashtags: string[];
  contentAngles: string[];
  audiencePhrases: string[];

  researchSummary: string;

  sources: TrendSource[];
  evidence: TrendEvidence[];

  bestPostingTimes: string[];
  postingTimeReason: string;

  postingTime: {
    youtube: PostingRecommendation;
    instagram: PostingRecommendation;
    facebook: PostingRecommendation;

    overall: {
      bestDay: string;
      bestTime: string;
      confidence: string;
      reason: string;
    };
  };
};

const emptyPosting = (): PostingRecommendation => ({
  bestDay: "",
  bestTime: "",
  backupDay: "",
  backupTime: "",
  confidence: "Insufficient data",
  reason: "",
});

const normalizeStringArray = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
};

const normalizeSources = (
  value: unknown
): TrendSource[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: any) => ({
      title: String(item?.title ?? "").trim(),
      url: String(item?.url ?? "").trim(),
      use: String(item?.use ?? "").trim(),
    }))
    .filter(
      (item) =>
        item.title ||
        item.url
    );
};

const normalizeEvidence = (
  value: unknown
): TrendEvidence[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: any) => ({
      claim: String(item?.claim ?? "").trim(),
      source: String(item?.source ?? "").trim(),
      reason: String(item?.reason ?? "").trim(),
    }))
    .filter(
      (item) =>
        item.claim &&
        item.source &&
        item.reason
    );
};

const normalizePosting = (
  value: any
): PostingRecommendation => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return emptyPosting();
  }

  return {
    bestDay:
      String(
        value.bestDay ?? ""
      ).trim(),

    bestTime:
      String(
        value.bestTime ?? ""
      ).trim(),

    backupDay:
      String(
        value.backupDay ?? ""
      ).trim(),

    backupTime:
      String(
        value.backupTime ?? ""
      ).trim(),

    confidence:
      String(
        value.confidence ??
          "Insufficient data"
      ).trim() ||
      "Insufficient data",

    reason:
      String(
        value.reason ?? ""
      ).trim(),
  };
};

const normalizeResearch = (
  raw: any
): TrendResearch => {
  const posting =
    raw?.postingTime || {};

  const parsedScore =
    Number(raw?.evidenceScore);

  return {
    topic:
      String(
        raw?.topic ?? ""
      ).trim(),

    trendStatus:
      String(
        raw?.trendStatus ??
          "Insufficient evidence"
      ).trim() ||
      "Insufficient evidence",

    trendConfidence:
      String(
        raw?.trendConfidence ??
          "Low"
      ).trim() || "Low",

    evidenceScore:
      Number.isFinite(parsedScore)
        ? Math.max(
            0,
            Math.min(
              100,
              parsedScore
            )
          )
        : 0,

    keywords:
      normalizeStringArray(
        raw?.keywords
      ),

    titlePatterns:
      normalizeStringArray(
        raw?.titlePatterns
      ),

    relevantHashtags:
      normalizeStringArray(
        raw?.relevantHashtags ??
          raw?.hashtags
      ),

    contentAngles:
      normalizeStringArray(
        raw?.contentAngles
      ),

    audiencePhrases:
      normalizeStringArray(
        raw?.audiencePhrases
      ),

    researchSummary:
      String(
        raw?.researchSummary ??
          raw?.summary ??
          ""
      ).trim(),

    sources:
      normalizeSources(
        raw?.sources
      ),

    evidence:
      normalizeEvidence(
        raw?.evidence
      ),

    bestPostingTimes:
      normalizeStringArray(
        raw?.bestPostingTimes
      ),

    postingTimeReason:
      String(
        raw?.postingTimeReason ??
          ""
      ).trim(),

    postingTime: {
      youtube:
        normalizePosting(
          posting.youtube
        ),

      instagram:
        normalizePosting(
          posting.instagram
        ),

      facebook:
        normalizePosting(
          posting.facebook
        ),

      overall: {
        bestDay:
          String(
            posting?.overall
              ?.bestDay ?? ""
          ).trim(),

        bestTime:
          String(
            posting?.overall
              ?.bestTime ?? ""
          ).trim(),

        confidence:
          String(
            posting?.overall
              ?.confidence ??
              "Insufficient data"
          ).trim() ||
          "Insufficient data",

        reason:
          String(
            posting?.overall
              ?.reason ?? ""
          ).trim(),
      },
    },
  };
};

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const script =
      String(
        body?.script ?? ""
      ).trim();

    if (!script) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Script is required.",
        },
        { status: 400 }
      );
    }

    const serperKey =
      process.env.SERPER_API_KEY;

    if (!serperKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SERPER_API_KEY is missing in .env.local",
        },
        { status: 500 }
      );
    }

    /*
     * ============================================================
     * CURRENT WEB RESEARCH
     * ============================================================
     */

    const searchQueries = [
      `India Hindi Hinglish short form comedy ${script} current`,
      `India YouTube Shorts Instagram Reels comedy ${script}`,
      `India social media posting time YouTube Shorts Instagram Reels Facebook 2026`,
    ];

    const allResults: any[] = [];

    for (
      const query of searchQueries
    ) {
      const response =
        await fetch(
          "https://google.serper.dev/search",
          {
            method: "POST",
            headers: {
              "X-API-KEY":
                serperKey,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              {
                q: query,
                gl: "in",
                hl: "en",
                num: 10,
              }
            ),
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `Serper search failed (${response.status}): ${errorText}`
        );
      }

      const data =
        await response.json();

      if (
        Array.isArray(
          data?.organic
        )
      ) {
        allResults.push(
          ...data.organic
        );
      }
    }

    /*
     * Remove duplicate URLs.
     */

    const uniqueResults =
      Array.from(
        new Map(
          allResults
            .filter(
              (item: any) =>
                item?.link
            )
            .map(
              (item: any) => [
                item.link,
                item,
              ]
            )
        ).values()
      );

    const searchResults =
      uniqueResults
        .slice(0, 30)
        .map(
          (
            item: any,
            index: number
          ) =>
            `RESULT ${index + 1}
Title: ${item.title || ""}
URL: ${item.link || ""}
Snippet: ${item.snippet || ""}`
        )
        .join("\n\n");

    if (!searchResults) {
      throw new Error(
        "No Google search results were returned by Serper."
      );
    }

    /*
     * ============================================================
     * GEMINI RESEARCH ANALYST
     * ============================================================
     */

    const model =
      genAI.getGenerativeModel({
        model:
          "gemini-3.6-flash",

        generationConfig: {
          responseMimeType:
            "application/json",
        },
      });

    const researchPrompt = `
You are a strict social-media trend research analyst
specializing in Indian short-form comedy.

USER SCRIPT:
${script}

CURRENT SEARCH RESULTS:
${searchResults}

============================================================
CORE EVIDENCE RULE
============================================================

Use ONLY the supplied search results as evidence for CURRENT
claims.

Do not use general model knowledge as proof of a current trend.

Do not invent current facts.

Do not invent URLs.

Do not invent source titles.

Every source URL must come directly from the supplied search
results.

============================================================
TREND STATUS
============================================================

Choose EXACTLY ONE:

Trending
Relevant
Potentially relevant
Insufficient evidence

Definitions:

Trending:
Use this ONLY when multiple independent and relevant current
signals support a genuine increase in attention, discussion,
search interest, content activity, or repeated recent coverage.

Relevant:
The topic/content format clearly matches current signals, but
the evidence is not strong enough to call it trending.

Potentially relevant:
Some useful signals exist, but evidence is limited, indirect,
mixed, or weak.

Insufficient evidence:
There is not enough evidence for a meaningful current signal.

IMPORTANT:

Never use "viral" as evidence.

Never claim guaranteed reach.

Never claim guaranteed growth.

Never call something Trending simply because one result,
article, post, Reel, Short, or page mentions it.

============================================================
TREND CONFIDENCE
============================================================

Choose:

High
Medium
Low

Confidence describes the quality and consistency of the evidence.

============================================================
EVIDENCE SCORE
============================================================

Calculate a score from 0 to 100.

The score measures evidence quality.

It does NOT measure how entertaining, clickable, or exciting
the topic appears.

Suggested interpretation:

80-100:
Strong multi-source current evidence.

60-79:
Good evidence with some limitations.

40-59:
Moderate or mixed evidence.

20-39:
Weak evidence.

0-19:
Very little usable evidence.

Do not inflate the score when multiple search results are
duplicates or repeat the same underlying claim.

============================================================
CURRENT VS GENERAL EVIDENCE
============================================================

Current evidence may support:

- current attention
- current discussion
- recent content activity
- recent platform signals
- current search/content patterns
- recent audience behavior

General information must NOT be presented as current trend
evidence.

If a source is useful only as general platform context,
classify it as general context.

============================================================
SOURCE CLASSIFICATION
============================================================

Each source must contain:

title
url
use

The "use" field should identify the purpose:

current trend evidence
content pattern
audience language
platform behavior
posting-time context
general context

============================================================
EVIDENCE OBJECTS
============================================================

Each evidence item must contain:

claim
source
reason

The source must identify one of the supplied sources.

Do not create unsupported evidence.

============================================================
POSTING-TIME RESEARCH
============================================================

Provide separate recommendations for:

YouTube
Instagram
Facebook

These are recommendations, NOT guarantees.

Use supplied evidence where available.

If evidence is generic platform research rather than creator-
specific analytics, explicitly say so.

Never pretend that a generic best-time article is personalized
analytics for this creator.

For each platform return:

bestDay
bestTime
backupDay
backupTime
confidence
reason

Also return an overall recommendation.

============================================================
CONTENT RESEARCH
============================================================

Return:

topic
keywords
titlePatterns
relevantHashtags
contentAngles
audiencePhrases
researchSummary

Do not copy another creator's exact wording.

============================================================
UNSUPPORTED CLAIM PROTECTION
============================================================

Never output claims such as:

"This will go viral"
"This is guaranteed to trend"
"This will guarantee views"
"This will guarantee reach"
"This will guarantee growth"

Do not convert general popularity into current trend evidence.

============================================================
JSON
============================================================

Return ONLY valid JSON.

Use exactly this structure:

{
  "topic": "",
  "trendStatus": "",
  "trendConfidence": "",
  "evidenceScore": 0,
  "keywords": [],
  "titlePatterns": [],
  "relevantHashtags": [],
  "contentAngles": [],
  "audiencePhrases": [],
  "researchSummary": "",
  "sources": [
    {
      "title": "",
      "url": "",
      "use": ""
    }
  ],
  "evidence": [
    {
      "claim": "",
      "source": "",
      "reason": ""
    }
  ],
  "bestPostingTimes": [],
  "postingTimeReason": "",
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
  }
}
`;

    const result =
      await model.generateContent(
        researchPrompt
      );

    let raw =
      result.response
        .text()
        .trim();

    /*
     * Remove markdown fences if Gemini
     * returns them accidentally.
     */

    raw = raw
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();

    let parsed: any;

    try {
      parsed =
        JSON.parse(raw);
    } catch {
      const match =
        raw.match(
          /\{[\s\S]*\}/
        );

      if (!match) {
        throw new Error(
          "Gemini returned invalid JSON."
        );
      }

      parsed =
        JSON.parse(
          match[0]
        );
    }

    /*
     * ============================================================
     * NORMALIZE
     * ============================================================
     */

    const research =
      normalizeResearch(
        parsed
      );

    /*
     * ============================================================
     * STRICT TREND STATUS VALIDATION
     * ============================================================
     */

    const allowedStatuses = [
      "Trending",
      "Relevant",
      "Potentially relevant",
      "Insufficient evidence",
    ];

    if (
      !allowedStatuses.includes(
        research.trendStatus
      )
    ) {
      research.trendStatus =
        "Insufficient evidence";

      research.trendConfidence =
        "Low";
    }

    /*
     * Trending requires multiple evidence items.
     */

    if (
      research.trendStatus ===
        "Trending" &&
      research.evidence.length < 2
    ) {
      research.trendStatus =
        "Relevant";

      if (
        research.trendConfidence ===
        "High"
      ) {
        research.trendConfidence =
          "Medium";
      }
    }

    /*
     * If there is no evidence at all,
     * the result cannot be called Trending
     * or High confidence.
     */

    if (
      research.evidence.length === 0
    ) {
      research.trendStatus =
        "Insufficient evidence";

      research.trendConfidence =
        "Low";

      research.evidenceScore = 0;
    }

    /*
     * One evidence item is never enough
     * for a Trending classification.
     */

    if (
      research.evidence.length === 1 &&
      research.trendStatus ===
        "Trending"
    ) {
      research.trendStatus =
        "Relevant";

      research.trendConfidence =
        research.trendConfidence ===
        "High"
          ? "Medium"
          : research.trendConfidence;
    }

    /*
     * ============================================================
     * EVIDENCE SCORE SAFETY
     * ============================================================
     */

    if (
      !Number.isFinite(
        research.evidenceScore
      )
    ) {
      research.evidenceScore = 0;
    }

    research.evidenceScore =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            research.evidenceScore
          )
        )
      );

    /*
     * Do not allow a very high score when
     * there is almost no evidence.
     */

    if (
      research.evidence.length === 1
    ) {
      research.evidenceScore =
        Math.min(
          research.evidenceScore,
          39
        );
    }

    if (
      research.evidence.length === 2
    ) {
      research.evidenceScore =
        Math.min(
          research.evidenceScore,
          69
        );
    }

    /*
     * ============================================================
     * UNSUPPORTED VIRAL CLAIM PROTECTION
     * ============================================================
     */

    const blockedClaimPattern =
      /\bviral\b|\bguaranteed reach\b|\bguaranteed growth\b|\bguaranteed views\b|\bguaranteed to trend\b/gi;

    research.researchSummary =
      research.researchSummary.replace(
        blockedClaimPattern,
        "current"
      );

    research.evidence =
      research.evidence.map(
        (item) => ({
          ...item,
          claim:
            item.claim.replace(
              blockedClaimPattern,
              "current"
            ),
          reason:
            item.reason.replace(
              blockedClaimPattern,
              "current"
            ),
        })
      );

    /*
     * ============================================================
     * SOURCE VALIDATION
     * ============================================================
     */

    const validSourceUrls =
      new Set(
        uniqueResults
          .map(
            (item: any) =>
              String(
                item?.link ?? ""
              ).trim()
          )
          .filter(Boolean)
      );

    research.sources =
      research.sources.filter(
        (source) => {
          if (!source.url)
            return false;

          return validSourceUrls.has(
            source.url
          );
        }
      );

    /*
     * Evidence sources should point to
     * actual supplied sources.
     *
     * We keep the evidence only when the
     * source string corresponds to one of
     * the returned source titles or URLs.
     */

    const sourceIdentifiers =
      new Set<string>();

    for (
      const source of research.sources
    ) {
      if (source.title) {
        sourceIdentifiers.add(
          source.title
        );
      }

      if (source.url) {
        sourceIdentifiers.add(
          source.url
        );
      }
    }

    research.evidence =
      research.evidence.filter(
        (item) => {
          if (
            !item.claim ||
            !item.source ||
            !item.reason
          ) {
            return false;
          }

          return Array.from(
            sourceIdentifiers
          ).some(
            (identifier) =>
              item.source
                .toLowerCase()
                .includes(
                  identifier.toLowerCase()
                ) ||
              identifier
                .toLowerCase()
                .includes(
                  item.source.toLowerCase()
                )
          );
        }
      );

    /*
     * If evidence was invalidated by source
     * validation, downgrade the result.
     */

    if (
      research.evidence.length === 0
    ) {
      research.trendStatus =
        "Insufficient evidence";

      research.trendConfidence =
        "Low";

      research.evidenceScore =
        0;
    } else if (
      research.trendStatus ===
        "Trending" &&
      research.evidence.length < 2
    ) {
      research.trendStatus =
        "Relevant";

      research.trendConfidence =
        "Medium";
    }

    /*
     * ============================================================
     * FINAL RESPONSE
     * ============================================================
     */

    return NextResponse.json({
      success: true,

      research,
    });
  } catch (error) {
    console.error(
      "TREND RESEARCH ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const lower =
      message.toLowerCase();

    if (
      lower.includes("429") ||
      lower.includes("quota") ||
      lower.includes(
        "too many requests"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "API quota/rate limit reached. Please try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          message ||
          "Trend research failed.",
      },
      { status: 500 }
    );
  }
}