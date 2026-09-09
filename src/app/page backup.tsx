"use client";

import { useEffect, useState } from "react";

import moods from "./data/moods.json";
import expressions from "./data/expressions.json";
import poses from "./data/poses.json";
import outfits from "./data/outfits.json";
import backgrounds from "./data/backgrounds.json";
import cameras from "./data/cameras.json";
import lighting from "./data/lighting.json";
import styles from "./data/styles.json";
import character from "./data/character.json";

type ShotCount = number | "auto";

type ShotItem = {
  id: number;
  shotNumber: number;
  script: string;
  prompt: string;
  dialogue?: string;
  continuity?: {
    checks: {
      identity: boolean;
      outfit: boolean;
      environment: boolean;
      lighting: boolean;
      camera: boolean;
      visualStyle: boolean;
      performer: boolean;
      continuity: boolean;
    };
    passed: number;
    total: number;
    isValid: boolean;
  };
};

type SocialMetadata = {
  youtube: {
    title?: string;
    description?: string;
    tags?: string[];
    thumbnailPrompt?: string;
    overlayText?: string;
  };
  instagram: {
    title?: string;
    caption?: string;
    hashtags?: string[];
    thumbnailPrompt?: string;
    overlayText?: string;
  };
  facebook: {
    title?: string;
    description?: string;
    hashtags?: string[];
    thumbnailPrompt?: string;
    overlayText?: string;
  };
};

type TrendEvidence = {
  claim: string;
  source: string;
  reason: string;
};

type PostingRecommendation = {
  bestDay: string;
  bestTime: string;
  backupDay: string;
  backupTime: string;
  confidence: string;
  reason: string;
};

type TrendResearch = {
  topic: string;
  trendStatus: string;
  trendConfidence: string;
  evidenceScore: number;
  summary: string;
  keywords: string[];
  titlePatterns: string[];
  hashtags: string[];
  contentAngles: string[];
  audiencePhrases: string[];
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

  sources: {
    title: string;
    url: string;
    use?: string;
  }[];

  evidence: TrendEvidence[];

  trends: {
    title: string;
    description?: string;
    relevance?: string;
  }[];
};

type SavedProject = {
  episode: string;
  script: string;
  prompt: string;
  shotCount: ShotCount;
  shots: ShotItem[];
  mood: string;
  expression: string;
  pose: string;
  language: string;
  performancePreset: string;
  outfit: string;
  background: string;
  camera: string;
  light: string;
  style: string;
  savedAt: string;
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeDialogue = (value: string) =>
  value
    .replace(/[“”"'`]/g, "")
    .replace(/[.,!?;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const dialogueIsLocked = (
  promptText: string,
  dialogue: string
) => {
  if (!dialogue.trim()) return true;

  const promptNormalized = normalizeDialogue(promptText);
  const dialogueNormalized = normalizeDialogue(dialogue);

  return promptNormalized.includes(dialogueNormalized);
};

const buildDialogueLock = (
  dialogue: string,
  language: string
) => `
DIALOGUE LOCK — MANDATORY

The performer MUST speak the following exact dialogue in ${language}.

Do not paraphrase it.
Do not shorten it.
Do not translate it.
Do not reorder it.
Do not replace it.
Do not omit any words.

EXACT DIALOGUE:
${dialogue}

The exact dialogue above must remain visibly present in this prompt so Google Flow has an explicit spoken-content instruction.
`;

const STAGE_LOCK = {
  environment: "Professional Indian stand-up comedy stage",
  setting: "Indoor comedy club",
  performerPosition: "Comedian standing on stage",
  microphone: "Handheld professional microphone",
  audience: "Live audience seated in front of the stage",
  background: "Dark intimate comedy-club background",
};

const CONTINUITY_LOCK = {
  identity:
    "Same Aanya Rao character identity across every shot. Preserve exact face, facial structure, eyes, eyebrows, nose, lips, jawline, skin tone, hair identity, and body proportions.",

  outfit:
    "Maintain the exact selected outfit consistently across all shots unless the user explicitly changes it.",

  environment:
    "Maintain the same professional Indian stand-up comedy stage and indoor comedy-club environment across all shots.",

  lighting:
    "Maintain consistent cinematic lighting direction, intensity, color temperature, and overall lighting mood across all shots.",

  visualStyle:
    "Maintain the same cinematic visual style, realism level, image quality, and overall production look across all shots.",

  performer:
    "Keep Aanya as the same primary performer throughout the episode.",

  continuity:
    "Each shot must feel like a continuous part of the same recorded stand-up comedy performance.",
};

const validateShotContinuity = (
  shotPrompt: string
) => {
  const prompt = shotPrompt.toLowerCase();

  const checks = {
    identity:
      prompt.includes("aanya") &&
      (prompt.includes("identity") ||
        prompt.includes("facial") ||
        prompt.includes("face")),

    outfit:
      prompt.includes("outfit") ||
      prompt.includes("clothing") ||
      prompt.includes("wearing") ||
      prompt.includes("wears") ||
      prompt.includes("dressed") ||
      prompt.includes("kurta") ||
      prompt.includes("palazzo") ||
      prompt.includes("pants") ||
      prompt.includes("shirt") ||
      prompt.includes("dress") ||
      prompt.includes("jacket"),

    environment:
      prompt.includes("comedy stage") ||
      prompt.includes("comedy-club") ||
      prompt.includes("comedy club") ||
      prompt.includes("stand-up stage"),

    lighting:
      prompt.includes("lighting"),

    camera:
      prompt.includes("camera") ||
      prompt.includes("medium shot") ||
      prompt.includes("close-up") ||
      prompt.includes("close up") ||
      prompt.includes("wide shot") ||
      prompt.includes("35mm") ||
      prompt.includes("lens") ||
      prompt.includes("framing"),

    visualStyle:
      prompt.includes("visual style") ||
      prompt.includes("cinematic") ||
      prompt.includes("photorealistic"),

    performer:
      prompt.includes("aanya") ||
      prompt.includes("primary performer"),

    continuity:
      prompt.includes("continuous episode") ||
      prompt.includes("continuity"),
  };

  const passed =
    Object.values(checks).filter(Boolean).length;

  const total = Object.values(checks).length;

  return {
    checks,
    passed,
    total,
    isValid: passed === total,
  };
};

const normalizeRecommendation = (
  raw: any
): PostingRecommendation => ({
  bestDay:
    typeof raw?.bestDay === "string"
      ? raw.bestDay
      : "",

  bestTime:
    typeof raw?.bestTime === "string"
      ? raw.bestTime
      : "",

  backupDay:
    typeof raw?.backupDay === "string"
      ? raw.backupDay
      : "",

  backupTime:
    typeof raw?.backupTime === "string"
      ? raw.backupTime
      : "",

  confidence:
    typeof raw?.confidence === "string"
      ? raw.confidence
      : "Insufficient data",

  reason:
    typeof raw?.reason === "string"
      ? raw.reason
      : "",
});

const normalizeTrendResearch = (
  raw: any
): TrendResearch => {
  const sourceList = Array.isArray(raw?.sources)
    ? raw.sources
    : [];

  const evidenceList = Array.isArray(raw?.evidence)
    ? raw.evidence
    : [];

  const emptyPosting =
    (): PostingRecommendation => ({
      bestDay: "",
      bestTime: "",
      backupDay: "",
      backupTime: "",
      confidence: "Insufficient data",
      reason: "",
    });

  const rawScore = Number(raw?.evidenceScore);

  return {
    topic:
      typeof raw?.topic === "string"
        ? raw.topic
        : "",

    trendStatus:
      typeof raw?.trendStatus === "string"
        ? raw.trendStatus
        : "Insufficient evidence",

    trendConfidence:
      typeof raw?.trendConfidence === "string"
        ? raw.trendConfidence
        : "Low",

    evidenceScore: Number.isFinite(rawScore)
      ? Math.max(
          0,
          Math.min(100, Math.round(rawScore))
        )
      : 0,

    summary:
      raw?.researchSummary ||
      raw?.summary ||
      "Current trend research completed.",

    keywords: Array.isArray(raw?.keywords)
      ? raw.keywords.map(String)
      : [],

    titlePatterns: Array.isArray(
      raw?.titlePatterns
    )
      ? raw.titlePatterns.map(String)
      : [],

    hashtags: Array.isArray(
      raw?.relevantHashtags
    )
      ? raw.relevantHashtags.map(String)
      : Array.isArray(raw?.hashtags)
      ? raw.hashtags.map(String)
      : [],

    contentAngles: Array.isArray(
      raw?.contentAngles
    )
      ? raw.contentAngles.map(String)
      : [],

    audiencePhrases: Array.isArray(
      raw?.audiencePhrases
    )
      ? raw.audiencePhrases.map(String)
      : [],

    bestPostingTimes: Array.isArray(
      raw?.bestPostingTimes
    )
      ? raw.bestPostingTimes.map(String)
      : [],

    postingTimeReason:
      typeof raw?.postingTimeReason ===
      "string"
        ? raw.postingTimeReason
        : "No additional posting-time explanation was returned.",

    postingTime: {
      youtube: {
        ...emptyPosting(),
        ...normalizeRecommendation(
          raw?.postingTime?.youtube
        ),
      },

      instagram: {
        ...emptyPosting(),
        ...normalizeRecommendation(
          raw?.postingTime?.instagram
        ),
      },

      facebook: {
        ...emptyPosting(),
        ...normalizeRecommendation(
          raw?.postingTime?.facebook
        ),
      },

      overall: {
        bestDay:
          typeof raw?.postingTime?.overall
            ?.bestDay === "string"
            ? raw.postingTime.overall.bestDay
            : "",

        bestTime:
          typeof raw?.postingTime?.overall
            ?.bestTime === "string"
            ? raw.postingTime.overall.bestTime
            : "",

        confidence:
          typeof raw?.postingTime?.overall
            ?.confidence === "string"
            ? raw.postingTime.overall.confidence
            : "Insufficient data",

        reason:
          typeof raw?.postingTime?.overall
            ?.reason === "string"
            ? raw.postingTime.overall.reason
            : "",
      },
    },

    sources: sourceList
      .filter(
        (source: any) =>
          typeof source?.url === "string" &&
          source.url.trim()
      )
      .map((source: any) => ({
        title:
          typeof source.title === "string" &&
          source.title.trim()
            ? source.title
            : source.url,

        url: source.url,

        use:
          typeof source.use === "string"
            ? source.use
            : "",
      })),

    evidence: evidenceList
      .filter(
        (item: any) =>
          item?.claim ||
          item?.source ||
          item?.reason
      )
      .map((item: any) => ({
        claim:
          typeof item.claim === "string"
            ? item.claim
            : "",

        source:
          typeof item.source === "string"
            ? item.source
            : "",

        reason:
          typeof item.reason === "string"
            ? item.reason
            : "",
      })),

    trends: Array.isArray(raw?.trends)
      ? raw.trends
          .filter((item: any) => item)
          .map((item: any) => ({
            title:
              typeof item.title === "string"
                ? item.title
                : "",

            description:
              typeof item.description ===
              "string"
                ? item.description
                : "",

            relevance:
              typeof item.relevance ===
              "string"
                ? item.relevance
                : "",
          }))
      : [],
  };
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Home() {
  const [selectedCharacter] =
    useState(character);

  const [episode, setEpisode] =
    useState("");

  const [script, setScript] =
    useState("");

  const [prompt, setPrompt] =
    useState("");

  const [
    referenceImagePrompt,
    setReferenceImagePrompt,
  ] = useState("");

  const [
    promptHistory,
    setPromptHistory,
  ] = useState<
    {
      episode: string;
      prompt: string;
      createdAt: string;
    }[]
  >([]);

  const [shotCount, setShotCount] =
    useState<ShotCount>(1);

  const [shots, setShots] =
    useState<ShotItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mood, setMood] =
    useState(String(moods[0] ?? ""));

  const [expression, setExpression] =
    useState(
      String(expressions[0] ?? "")
    );

  const [pose, setPose] =
    useState(String(poses[0] ?? ""));

  const [language, setLanguage] =
    useState("Hinglish");

  const [
    performancePreset,
    setPerformancePreset,
  ] = useState("Stand-up Comedy");

  const [
    referenceImage,
    setReferenceImage,
  ] = useState<string | null>(null);

  const [
    referenceImageName,
    setReferenceImageName,
  ] = useState("");

  const [
    referenceImageData,
    setReferenceImageData,
  ] = useState<string | null>(null);

  const [
    referenceImageMimeType,
    setReferenceImageMimeType,
  ] = useState<string | null>(null);

  const [outfit, setOutfit] =
    useState<any>(outfits[0]);

  const [background, setBackground] =
    useState<any>(backgrounds[0]);

  const [camera, setCamera] =
    useState<any>(cameras[0]);

  const [light, setLight] =
    useState<any>(lighting[0]);

  const [style, setStyle] =
    useState<any>(styles[0]);

  const [
    socialMetadata,
    setSocialMetadata,
  ] = useState<SocialMetadata | null>(
    null
  );

  const [
    socialLoading,
    setSocialLoading,
  ] = useState(false);

  const [
    socialError,
    setSocialError,
  ] = useState("");

  const [
    trendResearch,
    setTrendResearch,
  ] = useState<TrendResearch | null>(
    null
  );

  const [
    trendLoading,
    setTrendLoading,
  ] = useState(false);

  const [
    trendError,
    setTrendError,
  ] = useState("");

  const [
    savedProjects,
    setSavedProjects,
  ] = useState<SavedProject[]>([]);

  /* =========================================================
     LOAD SAVED PROJECTS
  ========================================================= */

  useEffect(() => {
    const storedProjects =
      localStorage.getItem(
        "ai-actor-projects"
      );

    if (!storedProjects) return;

    try {
      const parsed =
        JSON.parse(storedProjects);

      if (Array.isArray(parsed)) {
        setSavedProjects(parsed);
      } else {
        setSavedProjects([]);
      }
    } catch {
      setSavedProjects([]);
    }
  }, []);

  /* =========================================================
     CONTINUITY FOOTER
  ========================================================= */

  const buildContinuityFooter = () => `
CONTINUITY LOCK — MANDATORY FOR THIS SHOT

IDENTITY:
Same Aanya Rao character identity across every shot.
Preserve the exact face, facial structure, eyes, eyebrows, nose,
lips, jawline, skin tone, hair identity, hairstyle, and body proportions.

OUTFIT:
Maintain the exact selected outfit consistently across all shots.
Selected outfit:
${String(outfit)}

ENVIRONMENT:
This exact selected background and stage environment must remain visually identical across every shot.

Selected background:
${String(background)}

BACKGROUND LOCK:
Do not redesign, replace, reinterpret, relocate, restyle, or alter the selected background.

Do not change:
- stage architecture
- wall appearance
- curtains
- backdrop
- lighting fixtures
- decorative elements
- stage layout
- audience arrangement
- background composition

The selected background must remain the same comedy-club environment throughout the entire episode.

The story or dialogue must NEVER cause a background change.

Aanya must remain on the same physical comedy stage throughout the episode.
Do not visually recreate the story being told.
Do not change the location.

LIGHTING:
Maintain consistent cinematic lighting direction, intensity,
color temperature, and overall lighting mood across every shot.

CAMERA:
Maintain the selected camera language and cinematic framing consistently.
Selected camera:
${String(camera)}

VISUAL STYLE:
Maintain the same cinematic visual style, realism level,
image quality, and overall production look across every shot.

Selected style:
${String(style)}

PERFORMER:
Keep Aanya Rao as the same primary performer throughout the episode.

CONTINUITY:
This shot must feel like a continuous part of the same recorded
stand-up comedy performance.

STAGE RULE:
Aanya must remain physically on the comedy stage while performing.
Do not visually recreate the story being told.
Do not introduce another main performer.
Do not change the location.

ONLY THESE MAY VARY BETWEEN SHOTS:
shot-specific dialogue, expression, pose, performance timing,
camera movement, and framing when required by the selected settings.

Do not redesign Aanya between shots.
Do not change her identity, outfit, stage environment, lighting,
visual style, or overall appearance.
`;

  /* =========================================================
     CREATE SHOT BREAKDOWN
  ========================================================= */

  const createShotBreakdown = async () => {
    if (!script.trim()) {
      alert("Please enter a script first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (shotCount === "auto") {
        const response = await fetch(
          "/api/analyze-script",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              script,
              language,
            }),
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Smart shot analysis failed."
          );
        }

        const analysis =
          data.analysis ?? data;

        if (
          !Array.isArray(
            analysis.shots
          )
        ) {
          throw new Error(
            "Smart shot analysis returned no valid shots."
          );
        }

        const generatedShots: ShotItem[] =
          analysis.shots
            .map(
              (
                item: any,
                index: number
              ) => {
                const dialogue =
                  typeof item?.dialogue ===
                  "string"
                    ? item.dialogue.trim()
                    : "";

                if (!dialogue) {
                  return null;
                }

                return {
                  id:
                    Date.now() + index,

                  shotNumber:
                    Number(
                      item?.shotNumber
                    ) ||
                    index + 1,

                  script: dialogue,

                  dialogue,

                  prompt: "",
                };
              }
            )
            .filter(
              Boolean
            ) as ShotItem[];

        if (
          generatedShots.length === 0
        ) {
          throw new Error(
            "No valid shots were returned by the AI."
          );
        }

        setShots(
          generatedShots
        );

        return;
      }

      const words =
        script.trim().split(/\s+/);

      const totalWords =
        words.length;

      const requestedShotCount =
        Number(shotCount);

      if (
        !Number.isFinite(
          requestedShotCount
        ) ||
        requestedShotCount < 1
      ) {
        throw new Error(
          "Invalid shot count."
        );
      }

      const wordsPerShot =
        Math.ceil(
          totalWords /
            requestedShotCount
        );

      const generatedShots: ShotItem[] =
        Array.from(
          {
            length:
              requestedShotCount,
          },
          (_, index) => {
            const start =
              index *
              wordsPerShot;

            const end =
              Math.min(
                start +
                  wordsPerShot,
                totalWords
              );

            const dialogue =
              words
                .slice(
                  start,
                  end
                )
                .join(" ");

            return {
              id:
                Date.now() +
                index,

              shotNumber:
                index + 1,

              script:
                dialogue,

              dialogue,

              prompt: "",
            };
          }
        );

      setShots(
        generatedShots
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create shot breakdown."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SOCIAL MEDIA METADATA
  ========================================================= */

  const generateSocialMetadata =
    async () => {
      if (!script.trim()) {
        alert(
          "Please enter a script first."
        );
        return;
      }

      setSocialLoading(true);
      setSocialError("");

      try {
        const response =
          await fetch(
            "/api/social-metadata",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                script,
                language,
                episode,
                trendResearch:
                  trendResearch
                    ? JSON.stringify(
                        trendResearch
                      )
                    : "",
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Social metadata generation failed."
          );
        }

        const metadata =
          data.metadata ?? {};

        if (
          metadata.youtube
        ) {
          const tags =
            Array.isArray(
              metadata.youtube.tags
            )
              ? metadata.youtube.tags
              : [];

          const uniqueTags =
            Array.from(
              new Set(
                tags
                  .map(
                    (tag: unknown) =>
                      String(
                        tag
                      ).trim()
                  )
                  .filter(
                    Boolean
                  )
              )
            ).slice(0, 30);

          metadata.youtube.tags =
            uniqueTags;
        }

        setSocialMetadata(
          metadata
        );
      } catch (err) {
        console.error(err);

        setSocialError(
          err instanceof Error
            ? err.message
            : "Social metadata generation failed."
        );
      } finally {
        setSocialLoading(false);
      }
    };

  /* =========================================================
     TREND RESEARCH
  ========================================================= */

  const generateTrendResearch =
    async () => {
      if (!script.trim()) {
        alert(
          "Please enter a script first."
        );
        return;
      }

      setTrendLoading(true);
      setTrendError("");

      try {
        const response =
          await fetch(
            "/api/trend-research",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                script,
                language,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Trend research failed."
          );
        }

        const normalizedResearch =
          normalizeTrendResearch(
            data.research ??
              data
          );

        setTrendResearch(
          normalizedResearch
        );
      } catch (err) {
        console.error(err);

        setTrendError(
          err instanceof Error
            ? err.message
            : "Trend research failed."
        );
      } finally {
        setTrendLoading(false);
      }
    };

  /* =========================================================
     GENERATE SHOT PROMPTS
  ========================================================= */

  const generateShotPrompts =
    async () => {
      if (shots.length === 0) {
        alert(
          "Create the shot breakdown first."
        );
        return;
      }

      setLoading(true);
      setError("");

      try {
        const shotList =
          shots
            .map(
              (shot) => `
SHOT ${shot.shotNumber}

DIALOGUE:
${shot.dialogue || shot.script}

SHOT SCRIPT:
${shot.script}
`
            )
            .join(
              "\n-------------------------\n"
            );

        const batchPrompt = `
You are an expert cinematic AI prompt writer for Google Flow.

Your task is to create ONE production-ready cinematic video prompt
FOR EACH SHOT listed below.

IMPORTANT:
You must return exactly ${shots.length} shot prompts.

Do NOT combine shots.
Do NOT skip any shot.
Do NOT change the dialogue.
Do NOT paraphrase the dialogue.

CHARACTER:
Aanya Rao, ${selectedCharacter.age}-year-old Indian female stand-up comedian.

IDENTITY:
Maintain exact facial identity from the master reference image.
Preserve facial structure, eyes, eyebrows, nose, lips, jawline,
skin tone, long wavy black hair, and body proportions.

OUTFIT:
${String(outfit)}

STAGE:
${STAGE_LOCK.environment}
${STAGE_LOCK.setting}

BACKGROUND:
${String(background)}

CAMERA:
${String(camera)}

LIGHTING:
${String(light)}

STYLE:
${String(style)}

PERFORMANCE:
${performancePreset}

MOOD:
${mood}

EXPRESSION:
${expression}

POSE:
${pose}

LANGUAGE:
${language}

IMPORTANT CONTINUITY RULES:

Keep Aanya on the comedy stage.

Do NOT visually recreate the story being told.

Do NOT change the location.

Do NOT introduce another character as the main performer.

All shots must belong to the same continuous stand-up comedy episode.

Maintain the exact same:
- character identity
- face
- hair
- skin tone
- outfit
- stage
- background
- lighting
- visual style
- overall appearance

Only shot-specific performance, framing, camera movement,
expression, pose and dialogue may vary.

EPISODE CONTINUITY LOCK:

${CONTINUITY_LOCK.identity}

${CONTINUITY_LOCK.outfit}

${CONTINUITY_LOCK.environment}

${CONTINUITY_LOCK.lighting}

${CONTINUITY_LOCK.visualStyle}

${CONTINUITY_LOCK.performer}

${CONTINUITY_LOCK.continuity}

SHOTS TO GENERATE:

${shotList}

OUTPUT FORMAT:

Return ONLY valid JSON.

Use exactly this structure:

{
  "shots": [
    {
      "shotNumber": 1,
      "prompt": "complete copy-ready Google Flow cinematic prompt"
    }
  ]
}

Replace the example with all ${shots.length} actual shots.

Each prompt must be complete and independently copy-ready.

Every prompt MUST contain the exact dialogue for its corresponding shot.

Do not add markdown fences.
Do not add explanations outside the JSON.
`;

        const response =
          await fetch(
            "/api/generate",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                prompt:
                  batchPrompt,
                referenceImage:
                  referenceImageData,
                referenceImageMimeType:
                  referenceImageMimeType,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Shot generation failed."
          );
        }

        let rawOutput =
          String(
            data.output || ""
          ).trim();

        rawOutput =
          rawOutput
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
            JSON.parse(
              rawOutput
            );
        } catch {
          const jsonMatch =
            rawOutput.match(
              /\{[\s\S]*\}/
            );

          if (!jsonMatch) {
            throw new Error(
              "Gemini returned an invalid shot prompt response."
            );
          }

          parsed =
            JSON.parse(
              jsonMatch[0]
            );
        }

        const generatedPromptList =
          Array.isArray(parsed)
            ? parsed
            : parsed?.shots;

        if (
          !Array.isArray(
            generatedPromptList
          )
        ) {
          throw new Error(
            "Gemini did not return a valid shot prompt list."
          );
        }

        const generatedShots: ShotItem[] =
          shots.map(
            (shot) => {
              const generated =
                generatedPromptList.find(
                  (item: any) =>
                    Number(
                      item?.shotNumber
                    ) ===
                    Number(
                      shot.shotNumber
                    )
                );

              if (
                !generated?.prompt
              ) {
                throw new Error(
                  `Gemini did not return a prompt for Shot ${shot.shotNumber}.`
                );
              }

              const dialogue =
                shot.dialogue ||
                shot.script;

              let finalShotPrompt =
                `${String(
                  generated.prompt
                ).trim()}

${buildDialogueLock(
  dialogue,
  language
)}

${buildContinuityFooter()}`;

              if (
                !dialogueIsLocked(
                  finalShotPrompt,
                  dialogue
                )
              ) {
                finalShotPrompt += `

${buildDialogueLock(
  dialogue,
  language
)}`;
              }

              const continuity =
                validateShotContinuity(
                  finalShotPrompt
                );

              return {
                ...shot,
                prompt:
                  finalShotPrompt,
                continuity,
              };
            }
          );

        setShots(
          generatedShots
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate shot prompts."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     SAVE PROJECT
  ========================================================= */

  const saveProject = () => {
    if (!episode.trim()) {
      alert(
        "Please enter an episode name first."
      );
      return;
    }

    if (
      !prompt.trim() &&
      shots.length === 0
    ) {
      alert(
        "Generate a prompt or create shot breakdown first."
      );
      return;
    }

    const newProject: SavedProject = {
      episode,
      script,
      prompt,
      shotCount,
      shots,
      mood,
      expression,
      pose,
      language,
      performancePreset,
      outfit: String(outfit),
      background: String(background),
      camera: String(camera),
      light: String(light),
      style: String(style),
      savedAt:
        new Date().toISOString(),
    };

    const updatedProjects = [
      ...savedProjects,
      newProject,
    ];

    setSavedProjects(
      updatedProjects
    );

    localStorage.setItem(
      "ai-actor-projects",
      JSON.stringify(
        updatedProjects
      )
    );

    alert("Project Saved!");
  };

  /* =========================================================
     LOAD PROJECT
  ========================================================= */

  const loadProject = (
    project: SavedProject
  ) => {
    setEpisode(
      project.episode || ""
    );

    setScript(
      project.script || ""
    );

    setPrompt(
      project.prompt || ""
    );

    setShotCount(
      project.shotCount ?? 1
    );

    setShots(
      Array.isArray(
        project.shots
      )
        ? project.shots
        : []
    );

    setMood(
      project.mood ||
        String(moods[0] ?? "")
    );

    setExpression(
      project.expression ||
        String(
          expressions[0] ?? ""
        )
    );

    setPose(
      project.pose ||
        String(poses[0] ?? "")
    );

    setLanguage(
      project.language ||
        "Hinglish"
    );

    setPerformancePreset(
      project.performancePreset ||
        "Stand-up Comedy"
    );

    setOutfit(
      project.outfit ||
        outfits[0]
    );

    setBackground(
      project.background ||
        backgrounds[0]
    );

    setCamera(
      project.camera ||
        cameras[0]
    );

    setLight(
      project.light ||
        lighting[0]
    );

    setStyle(
      project.style ||
        styles[0]
    );

    alert("Project Loaded!");
  };

  /* =========================================================
     DELETE PROJECT
  ========================================================= */

  const deleteProject = (
    index: number
  ) => {
    const updatedProjects =
      savedProjects.filter(
        (_, projectIndex) =>
          projectIndex !== index
      );

    setSavedProjects(
      updatedProjects
    );

    localStorage.setItem(
      "ai-actor-projects",
      JSON.stringify(
        updatedProjects
      )
    );

    alert("Project Deleted!");
  };

  /* =========================================================
     MAIN PROMPT
  ========================================================= */

  const generateMainPrompt =
    async () => {
      if (!script.trim()) {
        setError(
          "Please enter a script first."
        );
        return;
      }

      setLoading(true);
      setError("");

      try {
        const performanceInstructions:
          Record<string, string> = {
  "Stand-up Comedy":
    "Perform as a live stand-up comedian. Use confident comedic timing, natural pauses, subtle punchline emphasis, conversational hand gestures, and direct audience engagement.",

  Storytelling:
    "Perform as a natural storyteller. Use expressive facial reactions, controlled hand gestures, varied pacing, and storytelling pauses while maintaining a conversational delivery.",

  "Emotional Story":
    "Perform with emotionally authentic storytelling. Use gentle facial expressions, slower pacing, meaningful pauses, restrained gestures, and sincere eye contact.",

  Interview:
    "Perform in a natural interview style. Maintain relaxed posture, conversational facial expressions, attentive eye contact, subtle gestures, and realistic speaking behavior.",

  "Casual Talking":
    "Perform in a relaxed conversational style. Use natural body movement, subtle gestures, comfortable facial expressions, and an informal speaking rhythm.",

  "Crowd Interaction":
    "Perform as an interactive comedian engaging with the live audience. Use direct audience eye contact, responsive facial expressions, spontaneous gestures, pauses for audience reaction, and natural crowd interaction.",

  Punchline:
    "Deliver the performance with strong comedic timing. Build naturally toward punchlines, use deliberate pauses before key jokes, subtle expression changes, and confident audience engagement.",

  "Professional Podcast":
    "Perform in a polished professional podcast style. Maintain relaxed but confident posture, natural conversational delivery, attentive eye contact, subtle hand gestures, authentic facial expressions, controlled pacing, and realistic interaction with the host or camera. Keep the performance natural, engaging, and studio-quality without exaggerated movements."
};

        const selectedPerformanceInstruction =
          performanceInstructions[
            performancePreset
          ] ||
          performanceInstructions[
            "Stand-up Comedy"
          ];

        const aiPrompt = `
You are an expert cinematic AI prompt writer for Google Flow.

Create a professional, production-ready cinematic prompt from the user's stand-up comedy script.

SCRIPT:
${script}

STAGE LOCK:

Environment:
${STAGE_LOCK.environment}

Setting:
${STAGE_LOCK.setting}

Performer Position:
${STAGE_LOCK.performerPosition}

Microphone:
${STAGE_LOCK.microphone}

Audience:
${STAGE_LOCK.audience}

Background:
${String(background)}

Camera:
${String(camera)}

Lighting:
${String(light)}

Style:
${String(style)}

PERFORMANCE:
${selectedPerformanceInstruction}

IMPORTANT VISUAL RULE:

The story being told must NOT be visually recreated.

Aanya must remain on the stand-up comedy stage while telling the story.

Do NOT change the location based on the story.

CINEMATIC REQUIREMENTS:

- Photorealistic Indian stand-up comedian.
- Maintain exact character consistency.
- Maintain the locked comedy-stage environment.
- Natural facial expressions.
- Realistic body movement and hand gestures.
- Cinematic composition.
- Professional camera direction.
- Natural cinematic lighting.
- High-quality film production look.

SELECTED SETTINGS:

Outfit:
${String(outfit)}

Background:
${String(background)}

Camera:
${String(camera)}

Lighting:
${String(light)}

Style:
${String(style)}

Performance Preset:
${performancePreset}

Mood:
${mood}

Expression:
${expression}

Pose:
${pose}

LANGUAGE:

Use ${language} for all dialogue and spoken content.

If the selected language is Hinglish:
- Use natural Indian Hinglish.
- Hindi words should be written in Roman script.

If the selected language is Hindi:
- Write natural conversational Hindi.
- Use Devanagari script.

If the selected language is English:
- Write natural conversational Indian English.

If the selected language is Marathi:
- Write natural conversational Marathi.

If the selected language is Kannada:
- Write natural conversational Kannada.

Keep the comedy natural, conversational and relatable.

CHARACTER:

Name:
${selectedCharacter.name}

Role:
${selectedCharacter.role}

Age:
${selectedCharacter.age}

Appearance:
${selectedCharacter.hair}

VISUAL STYLE:
${selectedCharacter.visualStyle}

IDENTITY REQUIREMENT:

The generated video must preserve Aanya's exact identity.

Maintain:
- same facial structure
- same eyes
- same eyebrows
- same nose
- same lips
- same jawline
- same skin tone
- same hair identity
- same body proportions
- same recognizable character identity

STAGE RULE:

Aanya must remain physically on the comedy stage.

Do not visually recreate the story described in the dialogue.

Do not introduce unrelated characters.

Do not add subtitles, captions, logos, watermarks, or unrelated on-screen text.

OUTPUT FORMAT:

SCENE:
Describe the scene visually.

CHARACTER:
Describe Aanya's appearance and performance.

CAMERA:
Selected Camera: ${String(camera)}
Describe the shot type, camera movement, lens/framing, and composition according to the selected camera.

LIGHTING:
Describe cinematic lighting according to the selected lighting.

DIALOGUE:
Write the dialogue naturally in ${language}.

FINAL GOOGLE FLOW PROMPT:
Provide one complete copy-ready cinematic prompt.

NEGATIVE PROMPT:
${selectedCharacter.negativePrompt}
`;

        const firstFramePrompt = `
Create a photorealistic cinematic reference image of the established character ${selectedCharacter.name}.

IDENTITY:

Use the uploaded master character reference image as the identity authority.

Preserve the exact:
- facial structure
- eyes, eyebrows, nose, lips, and jawline
- skin tone
- hairstyle and hair identity
- body proportions
- recognizable overall appearance

The character must clearly remain the same person as the master reference.

OUTFIT — MANDATORY:
${String(outfit)}

Do NOT copy the clothing from the master reference image.

The selected outfit above must completely replace the clothing visible in the master reference.

CHARACTER:

Name:
${selectedCharacter.name}

Role:
${selectedCharacter.role}

Age:
${selectedCharacter.age}

Appearance:
${selectedCharacter.hair}

VISUAL STYLE:
${selectedCharacter.visualStyle}

ENVIRONMENT:
${String(background)}

LIGHTING:
${String(light)}

CAMERA / FRAMING:
${String(camera)}

POSE:
${pose}

EXPRESSION:
${expression}

MOOD:
${mood}

REFERENCE IMAGE PURPOSE:

This image will be used as the visual reference / first frame for a Google Flow / Veo video.

Create one clean, coherent cinematic frame.

Do not depict the story from the script.

Do not add dialogue, subtitles, captions, logos, watermarks, or unrelated characters.

The final image must show the same ${selectedCharacter.name}
identity from the master reference wearing the selected outfit
and matching the selected visual settings.

NEGATIVE PROMPT:
${selectedCharacter.negativePrompt}
`;

        setReferenceImagePrompt(
          firstFramePrompt
        );

        const response =
          await fetch(
            "/api/generate",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                prompt:
                  aiPrompt,
                referenceImage:
                  referenceImageData,
                referenceImageMimeType:
                  referenceImageMimeType,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "AI generation failed."
          );
        }

        const generatedOutput =
          String(
            data.output || ""
          ).trim();

        setPrompt(
          generatedOutput
        );

        setPromptHistory(
          (prev) => [
            {
              episode:
                episode ||
                "Untitled Episode",

              prompt:
                generatedOutput,

              createdAt:
                new Date().toISOString(),
            },

            ...prev,
          ]
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "AI generation failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="premium-ui min-h-screen text-white">
      <style jsx global>{`
        .premium-ui {
          --gold: #c9a45b;
          --gold-light: #e6c77b;
          --gold-dark: #8f6b2e;
          --ink: #07090b;
          --panel: rgba(15, 17, 19, 0.88);
          --panel-2: rgba(20, 22, 25, 0.92);
          --line: rgba(201, 164, 91, 0.24);
          background:
            radial-gradient(circle at 86% 8%, rgba(201,164,91,.12), transparent 26%),
            radial-gradient(circle at 8% 88%, rgba(201,164,91,.08), transparent 24%),
            linear-gradient(135deg, #050607 0%, #0a0c0e 48%, #060708 100%);
          min-height: 100vh;
        }

        .premium-ui * {
          scrollbar-color: rgba(201,164,91,.45) rgba(255,255,255,.04);
        }

        .premium-shell {
          max-width: 1700px;
          margin: 0 auto;
          padding: 28px 34px 40px;
        }

        .premium-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 34px;
        }

        .premium-brand {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .st-mark {
          width: 108px;
          height: 70px;
          display: grid;
          place-items: center;
          position: relative;
          color: var(--gold-light);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 46px;
          font-style: italic;
          letter-spacing: -10px;
          text-shadow: 0 0 18px rgba(201,164,91,.28);
        }

        .st-mark::after {
          content: "";
          position: absolute;
          right: -2px;
          top: 7px;
          height: 56px;
          width: 1px;
          background: linear-gradient(to bottom, transparent, var(--gold), transparent);
          opacity: .7;
        }

        .brand-divider {
          height: 58px;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,.2), transparent);
        }

        .brand-title {
          font-size: clamp(28px, 3vw, 42px);
          line-height: 1;
          font-weight: 700;
          letter-spacing: -1.5px;
        }

        .brand-title span {
          color: var(--gold);
        }

        .brand-subtitle {
          margin-top: 9px;
          color: #9da1a8;
          font-size: 15px;
        }

        .flow-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(201,164,91,.38);
          background: rgba(10,11,12,.7);
          border-radius: 999px;
          padding: 12px 19px;
          color: #f2f0eb;
          box-shadow: inset 0 0 20px rgba(201,164,91,.035), 0 8px 30px rgba(0,0,0,.22);
          font-size: 14px;
        }

        .flow-star {
          color: #fff;
          font-size: 20px;
        }

        .premium-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .premium-card {
          background: linear-gradient(145deg, rgba(17,19,21,.94), rgba(8,10,11,.94));
          border: 1px solid var(--line) !important;
          border-radius: 22px !important;
          padding: 30px !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035),
            0 22px 60px rgba(0,0,0,.28);
          backdrop-filter: blur(14px);
        }

        .premium-card h2 {
          font-size: 25px !important;
          letter-spacing: -.5px;
        }

        .premium-card h2::first-letter {
          color: var(--gold-light);
        }

        .premium-card label {
          color: #e9e7e2;
          font-weight: 500;
        }

        .premium-ui input,
        .premium-ui textarea,
        .premium-ui select {
          background: linear-gradient(180deg, rgba(31,33,36,.96), rgba(17,19,21,.96)) !important;
          border: 1px solid rgba(255,255,255,.09) !important;
          color: #e9e7e2 !important;
          border-radius: 12px !important;
          transition: border-color .2s, box-shadow .2s;
        }

        .premium-ui input:focus,
        .premium-ui textarea:focus,
        .premium-ui select:focus {
          outline: none;
          border-color: rgba(201,164,91,.72) !important;
          box-shadow: 0 0 0 3px rgba(201,164,91,.09);
        }

        .premium-ui input::placeholder,
        .premium-ui textarea::placeholder {
          color: #777b82 !important;
        }

        .premium-ui button {
          border-radius: 11px !important;
          border: 1px solid rgba(201,164,91,.34) !important;
          transition: transform .18s, box-shadow .18s, filter .18s;
        }

        .premium-ui button:not(:disabled):hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
          box-shadow: 0 10px 28px rgba(0,0,0,.24);
        }

        .premium-ui .bg-blue-600,
        .premium-ui .bg-indigo-600,
        .premium-ui .bg-purple-600,
        .premium-ui .bg-emerald-600,
        .premium-ui .bg-orange-600,
        .premium-ui .bg-pink-600,
        .premium-ui .bg-cyan-600 {
          background: linear-gradient(135deg, #d5b66b, #9c7637) !important;
          color: #080909 !important;
        }

        .premium-ui .bg-slate-900,
        .premium-ui .bg-slate-800 {
          background: linear-gradient(145deg, rgba(25,27,30,.9), rgba(12,14,16,.94)) !important;
        }

        .premium-ui .border-slate-700 {
          border-color: rgba(255,255,255,.085) !important;
        }

        .premium-ui .text-cyan-400,
        .premium-ui .text-cyan-300,
        .premium-ui .text-blue-400 {
          color: #d6b76d !important;
        }

        .premium-ui .text-emerald-400 {
          color: #d7c18d !important;
        }

        .premium-ui .text-yellow-300,
        .premium-ui .text-yellow-400 {
          color: #e2c77d !important;
        }

        .premium-ui .text-pink-400,
        .premium-ui .text-red-400 {
          color: #d6b76d !important;
        }

        .premium-ui a {
          color: #d9b96c !important;
        }

        .premium-ui .rounded-lg,
        .premium-ui .rounded-xl {
          border-color: rgba(255,255,255,.075);
        }

        .premium-footer {
          text-align: center;
          margin-top: 34px;
          color: #77736a;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
        }

        .premium-footer::before,
        .premium-footer::after {
          content: "";
          height: 1px;
          width: 150px;
          background: linear-gradient(90deg, transparent, rgba(201,164,91,.38));
        }

        .premium-footer::after {
          transform: rotate(180deg);
        }

        @media (max-width: 900px) {
          .premium-shell { padding: 20px 16px 30px; }
          .premium-header { align-items: flex-start; }
          .flow-badge { display: none; }
          .premium-grid { grid-template-columns: 1fr; }
          .premium-card { padding: 20px !important; }
          .st-mark { width: 76px; font-size: 36px; }
          .brand-divider { display: none; }
        }
      `}</style>

      <div className="premium-shell">

        <header className="premium-header">
          <div className="premium-brand">
            <div className="st-mark" aria-label="ST">ST</div>
            <div className="brand-divider" />
            <div>
              <div className="brand-title">
                AI Actor <span>Studio</span>
              </div>
              <p className="brand-subtitle">
                Create consistent AI characters for Google Flow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (!prompt) {
                  alert("Generate a prompt first.");
                  return;
                }
                try {
                  await navigator.clipboard.writeText(prompt);
                  alert("Prompt Copied!");
                } catch {
                  alert("Could not copy the prompt.");
                }
              }}
              disabled={!prompt}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 font-semibold"
            >
              <span>▣</span>
              Copy Prompt
            </button>

            <div className="flow-badge">
              <span className="flow-star">✦</span>
              <span>Powered by Google Flow</span>
            </div>
          </div>
        </header>

        <div className="premium-grid">

          {/* =================================================
              LEFT PANEL
          ================================================= */}

          <div className="premium-card bg-slate-900 rounded-xl border border-slate-700 p-6">

            <h2 className="text-xl font-semibold mb-5">
              Episode Details
            </h2>

            <label className="block mb-2 text-sm">
              Character
            </label>

            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4">
              <option>
                {selectedCharacter.name}
              </option>
            </select>

            <label className="block mb-2 text-sm">
              Episode Name
            </label>

            <input
              value={episode}
              onChange={(e) =>
                setEpisode(
                  e.target.value
                )
              }
              placeholder="Weekend Metro Story"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            />

            <label className="block mb-2 text-sm">
              Script
            </label>

            <textarea
              rows={8}
              value={script}
              onChange={(e) =>
                setScript(
                  e.target.value
                )
              }
              placeholder="Paste your script..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            />

            <label className="block mb-2 text-sm">
              Number of Shots
            </label>

            <select
              value={String(
                shotCount
              )}
              onChange={(e) =>
                setShotCount(
                  e.target.value ===
                    "auto"
                    ? "auto"
                    : Number(
                        e.target.value
                      )
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              <option value="auto">
                Auto — AI analyzes script
              </option>

              {[1, 2, 3, 4, 5, 6].map(
                (count) => (
                  <option
                    key={count}
                    value={count}
                  >
                    {count}{" "}
                    {count === 1
                      ? "Shot"
                      : "Shots"}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm">
              Mood
            </label>

            <select
              value={mood}
              onChange={(e) =>
                setMood(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {moods.map(
                (item) => (
                  <option
                    key={String(item)}
                    value={String(item)}
                  >
                    {String(item)}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm">
              Expression
            </label>

            <select
              value={expression}
              onChange={(e) =>
                setExpression(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {expressions.map(
                (item) => (
                  <option
                    key={String(item)}
                    value={String(item)}
                  >
                    {String(item)}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm">
              Pose
            </label>

            <select
              value={pose}
              onChange={(e) =>
                setPose(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {poses.map(
                (item) => (
                  <option
                    key={String(item)}
                    value={String(item)}
                  >
                    {String(item)}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm">
              Language
            </label>

            <select
              value={language}
              onChange={(e) =>
                setLanguage(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              <option value="Hindi">
                Hindi
              </option>

              <option value="Hinglish">
                Hinglish
              </option>

              <option value="English">
                English
              </option>

              <option value="Kannada">
                Kannada
              </option>

              <option value="Marathi">
                Marathi
              </option>
            </select>

            <label className="block mb-2 text-sm">
              Performance Preset
            </label>

            <select
              value={
                performancePreset
              }
              onChange={(e) =>
                setPerformancePreset(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              <option value="Stand-up Comedy">
                Stand-up Comedy
              </option>

              <option value="Storytelling">
                Storytelling
              </option>

              <option value="Emotional Story">
                Emotional Story
              </option>

              <option value="Interview">
                Interview
              </option>

              <option value="Casual Talking">
                Casual Talking
              </option>

              <option value="Crowd Interaction">
                Crowd Interaction
              </option>

              <option value="Punchline">
                Punchline
              </option>

              <option value="Professional Podcast">
                Professional Podcast</option>
            </select>

            <label className="block mb-2 text-sm">
              Character Reference
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file =
                  e.target.files?.[0];

                if (!file) {
                  setReferenceImage(
                    null
                  );

                  setReferenceImageName(
                    ""
                  );

                  setReferenceImageData(
                    null
                  );

                  setReferenceImageMimeType(
                    null
                  );

                  return;
                }

                setReferenceImageName(
                  file.name
                );

                const imageUrl =
                  URL.createObjectURL(
                    file
                  );

                setReferenceImage(
                  imageUrl
                );

                setReferenceImageMimeType(
                  file.type
                );

                const reader =
                  new FileReader();

                reader.onload = () => {
                  const result =
                    reader.result as string;

                  const base64 =
                    result.includes(
                      ","
                    )
                      ? result.split(
                          ","
                        )[1]
                      : result;

                  setReferenceImageData(
                    base64
                  );
                };

                reader.readAsDataURL(
                  file
                );
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            />

            {referenceImage && (
              <div className="mb-4">

                <p className="text-xs text-slate-400 mb-2">
                  Selected:{" "}
                  {
                    referenceImageName
                  }
                </p>

                <img
                  src={
                    referenceImage
                  }
                  alt="Character reference"
                  className="w-full max-h-80 object-contain rounded-lg border border-slate-700"
                />

              </div>
            )}

            <label className="block mb-2 text-sm">
              Outfit
            </label>

            <select
              value={String(
                outfit
              )}
              onChange={(e) =>
                setOutfit(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {outfits.map(
                (item, index) => (
                  <option
                    key={index}
                    value={String(
                      item
                    )}
                  >
                    {typeof item ===
                    "string"
                      ? item
                      : JSON.stringify(
                          item
                        )}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm">
              Background
            </label>

            <select
              value={String(
                background
              )}
              onChange={(e) =>
                setBackground(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {backgrounds.map(
                (item, index) => (
                  <option
                    key={index}
                    value={String(
                      item
                    )}
                  >
                    {typeof item ===
                    "string"
                      ? item
                      : JSON.stringify(
                          item
                        )}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm">
              Camera
            </label>

            <select
              value={String(
                camera
              )}
              onChange={(e) =>
                setCamera(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {cameras.map(
                (item, index) => (
                  <option
                    key={index}
                    value={String(
                      item
                    )}
                  >
                    {typeof item ===
                    "string"
                      ? item
                      : JSON.stringify(
                          item
                        )}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm">
              Lighting
            </label>

            <select
              value={String(
                light
              )}
              onChange={(e) =>
                setLight(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {lighting.map(
                (item, index) => (
                  <option
                    key={index}
                    value={String(
                      item
                    )}
                  >
                    {typeof item ===
                    "string"
                      ? item
                      : JSON.stringify(
                          item
                        )}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm">
              Style
            </label>

            <select
              value={String(
                style
              )}
              onChange={(e) =>
                setStyle(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {styles.map(
                (item, index) => (
                  <option
                    key={index}
                    value={String(
                      item
                    )}
                  >
                    {typeof item ===
                    "string"
                      ? item
                      : JSON.stringify(
                          item
                        )}
                  </option>
                )
              )}
            </select>

            <button
              onClick={
                generateMainPrompt
              }
              disabled={
                loading ||
                !script.trim()
              }
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 font-semibold mt-6"
            >
              {loading
                ? "Generating..."
                : "Analyze Script"}
            </button>

            <button
              onClick={
                createShotBreakdown
              }
              disabled={
                loading ||
                !script.trim()
              }
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 font-semibold mt-3 transition"
            >
              Create Shot Breakdown
            </button>

            <button
              onClick={
                generateShotPrompts
              }
              disabled={
                loading ||
                shots.length === 0
              }
              className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 font-semibold mt-3 transition"
            >
              {loading
                ? "Generating Shot Prompts..."
                : "Generate Shot Prompts"}
            </button>

          </div>

          {/* =================================================
              RIGHT PANEL
          ================================================= */}

          <div className="premium-card bg-slate-900 rounded-xl border border-slate-700 p-6">

            <h2 className="text-xl font-semibold mb-4">
              Prompt Preview
            </h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-300">
                {error}
              </div>
            )}

            {/* MAIN PROMPT */}

            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">

              <div className="px-4 py-3 border-b border-slate-700">

                <h3 className="text-sm font-semibold text-slate-200">
                  Generated Google Flow Prompt
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Review the complete
                  prompt before
                  copying.
                </p>

              </div>

              <div className="p-4 min-h-[500px] max-h-[650px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-200">
                {prompt ||
                  "Prompt will appear here..."}
              </div>

            </div>

            {/* =================================================
                SHOT PROMPTS
            ================================================= */}

            {shots.length > 0 && (
              <div className="mt-6">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-lg font-semibold">
                    Shot Prompts
                  </h3>

                  <span className="text-sm text-slate-400">
                    {shots.length} shots
                  </span>

                </div>

                <div className="space-y-4">

                  {shots.map(
                    (shot) => (
                      <div
                        key={shot.id}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-4"
                      >

                        <h4 className="font-semibold text-blue-400">
                          Shot{" "}
                          {
                            shot.shotNumber
                          }
                        </h4>

                        <textarea
                          value={
                            shot.script
                          }
                          onChange={(
                            e
                          ) => {
                            setShots(
                              (
                                prev
                              ) =>
                                prev.map(
                                  (
                                    item
                                  ) =>
                                    item.id ===
                                    shot.id
                                      ? {
                                          ...item,
                                          script:
                                            e
                                              .target
                                              .value,
                                          dialogue:
                                            e
                                              .target
                                              .value,
                                          prompt:
                                            "",
                                          continuity:
                                            undefined,
                                        }
                                      : item
                                )
                            );
                          }}
                          rows={4}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mt-2 text-sm text-slate-300 resize-y"
                          placeholder="Shot script..."
                        />

                        <div className="flex items-center justify-between mt-3">

                          <p className="text-xs text-slate-500">
                            Google Flow Prompt
                          </p>

                          {shot.prompt ? (
                            <span className="text-xs text-emerald-400">
                              ● Prompt Generated
                            </span>
                          ) : (
                            <span className="text-xs text-yellow-400">
                              ● Prompt Pending
                            </span>
                          )}

                        </div>

                        {shot.prompt ? (
                          <div className="mt-3">

                            <div className="bg-slate-800 rounded-lg p-3">
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                {
                                  shot.prompt
                                }
                              </p>
                            </div>

                            {shot.continuity && (
                              <span
                                className={`inline-block mt-2 text-xs ${
                                  shot
                                    .continuity
                                    .isValid
                                    ? "text-emerald-400"
                                    : "text-yellow-400"
                                }`}
                              >
                                • Continuity{" "}
                                {
                                  shot
                                    .continuity
                                    .isValid
                                    ? "OK"
                                    : "Review"
                                }{" "}
                                —{" "}
                                {
                                  shot
                                    .continuity
                                    .passed
                                }
                                /
                                {
                                  shot
                                    .continuity
                                    .total
                                }
                              </span>
                            )}

                            <button
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    shot.prompt
                                  );

                                  alert(
                                    `Shot ${shot.shotNumber} prompt copied!`
                                  );
                                } catch {
                                  alert(
                                    "Could not copy the prompt."
                                  );
                                }
                              }}
                              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 p-2 text-sm font-semibold mt-3 transition"
                            >
                              Copy Shot{" "}
                              {
                                shot.shotNumber
                              }{" "}
                              Prompt
                            </button>

                            <button
                              onClick={async () => {
                                setLoading(
                                  true
                                );

                                setError(
                                  ""
                                );

                                try {
                                  const dialogue =
                                    shot.dialogue ||
                                    shot.script;

                                  const shotPrompt = `
You are an expert cinematic AI prompt writer for Google Flow.

Create ONE production-ready cinematic video prompt for this specific shot.

CHARACTER:
Aanya Rao, ${selectedCharacter.age}-year-old Indian female stand-up comedian.

IDENTITY:
Maintain exact facial identity from the master reference image.
Preserve facial structure, eyes, eyebrows, nose, lips, jawline,
skin tone, long wavy black hair, and body proportions.

OUTFIT:
${String(outfit)}

STAGE:
${STAGE_LOCK.environment}
${STAGE_LOCK.setting}

BACKGROUND:
${String(background)}

CAMERA:
${String(camera)}

LIGHTING:
${String(light)}

STYLE:
${String(style)}

PERFORMANCE:
${performancePreset}

MOOD:
${mood}

EXPRESSION:
${expression}

POSE:
${pose}

LANGUAGE:
${language}

SHOT NUMBER:
${shot.shotNumber}

SHOT SCRIPT:
${shot.script}

${buildDialogueLock(
  dialogue,
  language
)}

IMPORTANT:

Keep Aanya on the comedy stage.
Do NOT visually recreate the story being told.
Do NOT change the location.

EPISODE CONTINUITY LOCK:

${CONTINUITY_LOCK.identity}

${CONTINUITY_LOCK.outfit}

${CONTINUITY_LOCK.environment}

${CONTINUITY_LOCK.lighting}

${CONTINUITY_LOCK.visualStyle}

${CONTINUITY_LOCK.performer}

${CONTINUITY_LOCK.continuity}

This regenerated shot must visually belong to the same continuous episode as all other shots.

Do not redesign Aanya.
Do not change her identity, outfit, stage environment,
lighting, visual style, or overall appearance.

Only the shot-specific performance, framing, expression,
pose, camera movement, and dialogue may change.

OUTPUT:
Provide only the final copy-ready Google Flow cinematic prompt.
`;

                                  const response =
                                    await fetch(
                                      "/api/generate",
                                      {
                                        method:
                                          "POST",
                                        headers:
                                          {
                                            "Content-Type":
                                              "application/json",
                                          },
                                        body: JSON.stringify(
                                          {
                                            prompt:
                                              shotPrompt,
                                            referenceImage:
                                              referenceImageData,
                                            referenceImageMimeType:
                                              referenceImageMimeType,
                                          }
                                        ),
                                      }
                                    );

                                  const data =
                                    await response.json();

                                  if (
                                    !response.ok ||
                                    !data.success
                                  ) {
                                    throw new Error(
                                      data.error ||
                                        "Shot regeneration failed."
                                    );
                                  }

                                  const regeneratedOutput =
                                    String(
                                      data.output ||
                                        ""
                                    ).trim();

                                  const regeneratedPrompt =
                                    `${regeneratedOutput}

${buildDialogueLock(
  dialogue,
  language
)}

${buildContinuityFooter()}`;

                                  const continuity =
                                    validateShotContinuity(
                                      regeneratedPrompt
                                    );

                                  setShots(
                                    (
                                      prev
                                    ) =>
                                      prev.map(
                                        (
                                          item
                                        ) =>
                                          item.id ===
                                          shot.id
                                            ? {
                                                ...item,
                                                prompt:
                                                  regeneratedPrompt,
                                                continuity,
                                              }
                                            : item
                                      )
                                  );
                                } catch (
                                  err
                                ) {
                                  console.error(
                                    err
                                  );

                                  setError(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to regenerate shot prompt."
                                  );
                                } finally {
                                  setLoading(
                                    false
                                  );
                                }
                              }}
                              disabled={
                                loading
                              }
                              className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 text-sm font-semibold mt-2 transition"
                            >
                              {loading
                                ? `Regenerating Shot ${shot.shotNumber}...`
                                : `Regenerate Shot ${shot.shotNumber}`}
                            </button>

                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 mt-3">
                            Prompt not
                            generated
                            yet.
                          </p>
                        )}

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* =================================================
                PROMPT HISTORY
            ================================================= */}

            <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-lg font-semibold">
                  Generated Prompt History
                </h3>

                <span className="text-sm text-slate-400">
                  {
                    promptHistory.length
                  }{" "}
                  generated
                </span>

              </div>

              {promptHistory.length ===
              0 ? (
                <p className="text-sm text-slate-400">
                  No generated
                  prompts yet.
                </p>
              ) : (
                <div className="space-y-3">

                  {promptHistory.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item.createdAt}-${index}`}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-4"
                      >

                        <div className="flex items-center justify-between gap-3">

                          <p className="font-semibold">
                            {item.episode ||
                              "Untitled Episode"}
                          </p>

                          <span className="text-xs text-slate-500">
                            {new Date(
                              item.createdAt
                            ).toLocaleString()}
                          </span>

                        </div>

                        <div className="mt-3 max-h-40 overflow-auto bg-slate-800 rounded-lg p-3">

                          <p className="text-sm text-slate-300 whitespace-pre-wrap">
                            {
                              item.prompt
                            }
                          </p>

                        </div>

                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                item.prompt
                              );

                              alert(
                                "Historical prompt copied!"
                              );
                            } catch {
                              alert(
                                "Could not copy the prompt."
                              );
                            }
                          }}
                          className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 p-2 text-sm font-semibold mt-3"
                        >
                          Copy Historical
                          Prompt
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* =================================================
                COPY MAIN PROMPT
            ================================================= */}

            <button
              onClick={async () => {
                if (!prompt) {
                  alert(
                    "Generate a prompt first."
                  );
                  return;
                }

                try {
                  await navigator.clipboard.writeText(
                    prompt
                  );

                  alert(
                    "Prompt Copied!"
                  );
                } catch {
                  alert(
                    "Could not copy the prompt."
                  );
                }
              }}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 p-3 font-semibold mt-4"
            >
              Copy Prompt
            </button>

            {/* =================================================
                REFERENCE IMAGE
            ================================================= */}

            <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h3 className="text-lg font-semibold">
                    Reference Image /
                    First Frame
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    Generate a
                    reference image
                    using the selected
                    character identity,
                    outfit, style,
                    lighting,
                    background, pose,
                    and expression.
                  </p>

                </div>

                <span className="text-xs text-slate-400">
                  {referenceImagePrompt
                    ? "Ready"
                    : "Generate a prompt first"}
                </span>

              </div>

              <textarea
                value={
                  referenceImagePrompt
                }
                readOnly
                placeholder="Reference image prompt will appear here..."
                className="w-full min-h-[220px] bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-y"
              />

              <button
                onClick={async () => {
                  if (
                    !referenceImagePrompt
                  ) {
                    alert(
                      "Generate a prompt first."
                    );
                    return;
                  }

                  try {
                    await navigator.clipboard.writeText(
                      referenceImagePrompt
                    );

                    alert(
                      "Reference image prompt copied!"
                    );
                  } catch {
                    alert(
                      "Could not copy the prompt."
                    );
                  }
                }}
                disabled={
                  !referenceImagePrompt
                }
                className="w-full mt-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 p-3 font-semibold"
              >
                Copy Reference Image
                Prompt
              </button>

            </div>

            {/* =================================================
                SOCIAL MEDIA GROWTH LAB
            ================================================= */}

            <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">

              <div className="flex items-center justify-between mb-3">

                <div>

                  <h3 className="text-lg font-semibold">
                    📱 Social Media Growth
                    Lab
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    Live research +
                    platform-specific
                    metadata for
                    YouTube, Instagram
                    and Facebook.
                  </p>

                </div>

                {socialMetadata && (
                  <span className="text-xs text-emerald-400">
                    ● Ready
                  </span>
                )}

              </div>

              <button
                onClick={
                  generateSocialMetadata
                }
                disabled={
                  socialLoading ||
                  !script.trim()
                }
                className="w-full rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-50 p-3 font-semibold"
              >
                {socialLoading
                  ? "Generating Metadata..."
                  : "Analyze & Generate Social Media Metadata"}
              </button>

              <button
                onClick={
                  generateTrendResearch
                }
                disabled={
                  trendLoading ||
                  !script.trim()
                }
                className="w-full mt-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 p-3 font-semibold"
              >
                {trendLoading
                  ? "Researching Current Trends..."
                  : "🔎 Research Current Trends"}
              </button>

              {socialError && (
                <div className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-300">
                  {socialError}
                </div>
              )}

              {/* SOCIAL METADATA */}

              {socialMetadata && (
                <div className="mt-5 space-y-4">

                  {/* YOUTUBE */}

                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">

                    <h4 className="font-semibold text-red-400 mb-3">
                      ▶ YouTube
                    </h4>

                    <p className="text-sm">
                      <b>Title:</b>{" "}
                      {
                        socialMetadata
                          .youtube
                          ?.title
                      }
                    </p>

                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      <b>
                        Description:
                      </b>{" "}
                      {
                        socialMetadata
                          .youtube
                          ?.description
                      }
                    </p>

                    <p className="text-sm mt-2">
                      <b>Tags (30):</b>{" "}
                      {(
                        socialMetadata
                          .youtube
                          ?.tags ??
                        []
                      )
                        .slice(0, 30)
                        .join(", ")}
                    </p>

                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      <b>
                        Thumbnail Prompt:
                      </b>{" "}
                      {
                        socialMetadata
                          .youtube
                          ?.thumbnailPrompt
                      }
                    </p>

                    <p className="text-sm mt-2">
                      <b>Overlay:</b>{" "}
                      {
                        socialMetadata
                          .youtube
                          ?.overlayText
                      }
                    </p>

                  </div>

                  {/* INSTAGRAM */}

                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">

                    <h4 className="font-semibold text-pink-400 mb-3">
                      ◎ Instagram
                    </h4>

                    <p className="text-sm">
                      <b>Title:</b>{" "}
                      {
                        socialMetadata
                          .instagram
                          ?.title
                      }
                    </p>

                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      <b>Caption:</b>{" "}
                      {
                        socialMetadata
                          .instagram
                          ?.caption
                      }
                    </p>

                    <p className="text-sm mt-2">
                      <b>Hashtags:</b>{" "}
                      {(
                        socialMetadata
                          .instagram
                          ?.hashtags ??
                        []
                      ).join(" ")}
                    </p>

                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      <b>
                        Thumbnail Prompt:
                      </b>{" "}
                      {
                        socialMetadata
                          .instagram
                          ?.thumbnailPrompt
                      }
                    </p>

                    <p className="text-sm mt-2">
                      <b>Overlay:</b>{" "}
                      {
                        socialMetadata
                          .instagram
                          ?.overlayText
                      }
                    </p>

                  </div>

                  {/* FACEBOOK */}

                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">

                    <h4 className="font-semibold text-blue-400 mb-3">
                      f Facebook
                    </h4>

                    <p className="text-sm">
                      <b>Title:</b>{" "}
                      {
                        socialMetadata
                          .facebook
                          ?.title
                      }
                    </p>

                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      <b>
                        Description:
                      </b>{" "}
                      {
                        socialMetadata
                          .facebook
                          ?.description
                      }
                    </p>

                    <p className="text-sm mt-2">
                      <b>Hashtags:</b>{" "}
                      {(
                        socialMetadata
                          .facebook
                          ?.hashtags ??
                        []
                      ).join(" ")}
                    </p>

                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      <b>
                        Thumbnail Prompt:
                      </b>{" "}
                      {
                        socialMetadata
                          .facebook
                          ?.thumbnailPrompt
                      }
                    </p>

                    <p className="text-sm mt-2">
                      <b>Overlay:</b>{" "}
                      {
                        socialMetadata
                          .facebook
                          ?.overlayText
                      }
                    </p>

                  </div>

                </div>
              )}

            </div>

            {/* =================================================
                TREND RESEARCH
            ================================================= */}

            {trendError && (
              <div className="mt-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">

                <b>
                  Trend Research Error:
                </b>

                <p className="mt-1 text-sm">
                  {trendError}
                </p>

              </div>
            )}

            {trendResearch && (
              <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">

                <div className="flex items-center justify-between gap-3 mb-4">

                  <h3 className="text-lg font-semibold">
                    🔎 Current Trend Research
                  </h3>

                  <span className="text-xs text-emerald-400 whitespace-nowrap">
                    ● Research Complete
                  </span>

                </div>

                {/* SUMMARY CARDS */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">

                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">

                    <p className="text-xs text-slate-400 uppercase">
                      Trend Status
                    </p>

                    <p
                      className={`mt-1 font-semibold ${
                        trendResearch.trendStatus ===
                        "Trending"
                          ? "text-emerald-400"
                          : trendResearch.trendStatus ===
                            "Relevant"
                          ? "text-cyan-300"
                          : trendResearch.trendStatus ===
                            "Potentially relevant"
                          ? "text-yellow-300"
                          : "text-slate-400"
                      }`}
                    >
                      {
                        trendResearch.trendStatus
                      }
                    </p>

                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">

                    <p className="text-xs text-slate-400 uppercase">
                      Trend Confidence
                    </p>

                    <p className="mt-1 font-semibold text-yellow-300">
                      {
                        trendResearch.trendConfidence
                      }
                    </p>

                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">

                    <div className="flex items-center justify-between">

                      <p className="text-xs text-slate-400 uppercase">
                        Evidence Score
                      </p>

                      <span className="text-xs text-slate-500">
                        / 100
                      </span>

                    </div>

                    <p className="mt-1 text-2xl font-bold text-emerald-400">
                      {
                        trendResearch.evidenceScore
                      }
                    </p>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">

                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              trendResearch.evidenceScore
                            )
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

                {/* TOPIC */}

                {trendResearch.topic && (
                  <p className="text-sm text-cyan-400 mb-3">
                    <b>Topic:</b>{" "}
                    {
                      trendResearch.topic
                    }
                  </p>
                )}

                {/* SUMMARY */}

                <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">

                  <h4 className="font-semibold text-cyan-400 mb-2">
                    Research Summary
                  </h4>

                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {
                      trendResearch.summary
                    }
                  </p>

                </div>

                {/* KEYWORDS */}

                {trendResearch.keywords
                  .length > 0 && (
                  <div className="mt-4">

                    <h4 className="font-semibold text-cyan-400 mb-2">
                      Keywords
                    </h4>

                    <p className="text-sm text-slate-300">
                      {
                        trendResearch.keywords.join(
                          ", "
                        )
                      }
                    </p>

                  </div>
                )}

                {/* TITLE PATTERNS */}

                {trendResearch.titlePatterns
                  .length > 0 && (
                  <div className="mt-4">

                    <h4 className="font-semibold text-cyan-400 mb-2">
                      Title Patterns
                    </h4>

                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">

                      {trendResearch.titlePatterns.map(
                        (x, i) => (
                          <li key={i}>
                            {x}
                          </li>
                        )
                      )}

                    </ul>

                  </div>
                )}

                {/* HASHTAGS */}

                {trendResearch.hashtags
                  .length > 0 && (
                  <div className="mt-4">

                    <h4 className="font-semibold text-cyan-400 mb-2">
                      Relevant Hashtags
                    </h4>

                    <p className="text-sm text-slate-300">
                      {
                        trendResearch.hashtags.join(
                          " "
                        )
                      }
                    </p>

                  </div>
                )}

                {/* CONTENT ANGLES */}

                {trendResearch.contentAngles
                  .length > 0 && (
                  <div className="mt-4">

                    <h4 className="font-semibold text-cyan-400 mb-2">
                      Content Angles
                    </h4>

                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">

                      {trendResearch.contentAngles.map(
                        (x, i) => (
                          <li key={i}>
                            {x}
                          </li>
                        )
                      )}

                    </ul>

                  </div>
                )}

                {/* AUDIENCE PHRASES */}

                {trendResearch.audiencePhrases
                  .length > 0 && (
                  <div className="mt-4">

                    <h4 className="font-semibold text-cyan-400 mb-2">
                      Audience Phrases
                    </h4>

                    <p className="text-sm text-slate-300">
                      {
                        trendResearch.audiencePhrases.join(
                          " • "
                        )
                      }
                    </p>

                  </div>
                )}

                {/* =================================================
                    EVIDENCE
                ================================================= */}

                {trendResearch.evidence
                  .length > 0 && (
                  <div className="mt-5 rounded-lg border border-slate-700 bg-slate-900 p-4">

                    <h4 className="font-semibold text-cyan-400 mb-3">
                      📊 Evidence
                    </h4>

                    <div className="space-y-3">

                      {trendResearch.evidence.map(
                        (
                          item,
                          i
                        ) => {
                          const sourceText =
                            item.source.toLowerCase();

                          const isPostingTime =
                            sourceText.includes(
                              "posting"
                            ) ||
                            sourceText.includes(
                              "buffer"
                            ) ||
                            sourceText.includes(
                              "vaizle"
                            ) ||
                            sourceText.includes(
                              "postfa"
                            ) ||
                            sourceText.includes(
                              "postpone"
                            ) ||
                            sourceText.includes(
                              "gudsho"
                            ) ||
                            sourceText.includes(
                              "wordstream"
                            );

                          const isGeneral =
                            sourceText.includes(
                              "general"
                            ) ||
                            sourceText.includes(
                              "platform behavior"
                            ) ||
                            sourceText.includes(
                              "industry context"
                            );

                          const label =
                            isPostingTime
                              ? "POSTING-TIME CONTEXT"
                              : isGeneral
                              ? "GENERAL CONTEXT"
                              : "CURRENT EVIDENCE";

                          const badgeClass =
                            isPostingTime
                              ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                              : isGeneral
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";

                          return (
                            <div
                              key={i}
                              className="rounded-lg border border-slate-700 p-3"
                            >

                              {item.claim && (
                                <p className="text-sm text-slate-200">
                                  <b>
                                    Claim:
                                  </b>{" "}
                                  {
                                    item.claim
                                  }
                                </p>
                              )}

                              {item.source && (
                                <p className="text-xs text-blue-300 mt-1 break-words">
                                  <b>
                                    Source:
                                  </b>{" "}
                                  {
                                    item.source
                                  }
                                </p>
                              )}

                              {item.reason && (
                                <p className="text-xs text-slate-400 mt-1">
                                  <b>
                                    Why:
                                  </b>{" "}
                                  {
                                    item.reason
                                  }
                                </p>
                              )}

                              <div className="mt-2">

                                <span
                                  className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide ${badgeClass}`}
                                >
                                  {
                                    label
                                  }
                                </span>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>
                )}

                {/* =================================================
                    POSTING TIME RESEARCH
                ================================================= */}

                <div className="mt-5 rounded-lg border border-slate-700 bg-slate-900 p-4">

                  <h4 className="font-semibold text-cyan-400 mb-3">
                    🕐 Posting Time Research
                  </h4>

                  <p className="text-xs text-slate-400 mb-4">
                    {
                      trendResearch.postingTimeReason
                    }
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    {(
                      [
                        [
                          "YouTube",
                          trendResearch
                            .postingTime
                            .youtube,
                        ],

                        [
                          "Instagram",
                          trendResearch
                            .postingTime
                            .instagram,
                        ],

                        [
                          "Facebook",
                          trendResearch
                            .postingTime
                            .facebook,
                        ],
                      ] as [
                        string,
                        PostingRecommendation
                      ][]
                    ).map(
                      ([
                        platform,
                        rec,
                      ]) => (
                        <div
                          key={
                            platform
                          }
                          className="rounded-lg border border-slate-700 p-3"
                        >

                          <h5 className="font-semibold text-slate-200 mb-2">
                            {
                              platform
                            }
                          </h5>

                          <p className="text-sm text-slate-300">
                            <b>
                              Best:
                            </b>{" "}
                            {
                              rec.bestDay ||
                              "—"
                            }
                            {rec.bestTime
                              ? ` • ${rec.bestTime}`
                              : ""}
                          </p>

                          <p className="text-sm text-slate-300 mt-1">
                            <b>
                              Backup:
                            </b>{" "}
                            {
                              rec.backupDay ||
                              "—"
                            }
                            {rec.backupTime
                              ? ` • ${rec.backupTime}`
                              : ""}
                          </p>

                          <p className="text-xs text-yellow-300 mt-2">
                            <b>
                              Confidence:
                            </b>{" "}
                            {
                              rec.confidence
                            }
                          </p>

                          {rec.reason && (
                            <p className="text-xs text-slate-400 mt-1">
                              {
                                rec.reason
                              }
                            </p>
                          )}

                        </div>
                      )
                    )}

                  </div>

                  {/* OVERALL */}

                  <div className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">

                    <p className="text-sm text-slate-200">

                      <b>
                        Overall:
                      </b>{" "}

                      {
                        trendResearch
                          .postingTime
                          .overall
                          .bestDay ||
                        "Insufficient data"
                      }

                      {
                        trendResearch
                          .postingTime
                          .overall
                          .bestTime
                          ? ` • ${
                              trendResearch
                                .postingTime
                                .overall
                                .bestTime
                            }`
                          : ""
                      }

                    </p>

                    <p className="text-xs text-yellow-300 mt-1">

                      <b>
                        Confidence:
                      </b>{" "}

                      {
                        trendResearch
                          .postingTime
                          .overall
                          .confidence
                      }

                    </p>

                    {
                      trendResearch
                        .postingTime
                        .overall
                        .reason && (
                      <p className="text-xs text-slate-400 mt-1">
                        {
                          trendResearch
                            .postingTime
                            .overall
                            .reason
                        }
                      </p>
                    )}

                  </div>

                </div>

                {/* =================================================
                    SOURCES
                ================================================= */}

                {trendResearch.sources
                  .length > 0 && (
                  <div className="mt-5">

                    <h4 className="font-semibold text-cyan-400 mb-2">
                      Sources
                    </h4>

                    <div className="space-y-2">

                      {trendResearch.sources.map(
                        (
                          source,
                          i
                        ) => (
                          <div
                            key={i}
                            className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                          >

                            <a
                              href={
                                source.url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-blue-400 hover:underline break-words"
                            >
                              {
                                source.title
                              }
                            </a>

                            {source.use && (
                              <p className="text-xs text-slate-500 mt-1">
                                Use:{" "}
                                {
                                  source.use
                                }
                              </p>
                            )}

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* =================================================
                SAVED PROJECTS
            ================================================= */}

            <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-lg font-semibold">
                  Saved Projects
                </h3>

                <span className="text-sm text-slate-400">
                  {
                    savedProjects.length
                  }{" "}
                  saved
                </span>

              </div>

              <button
                onClick={
                  saveProject
                }
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 p-3 font-semibold mb-4 transition"
              >
                Save Project
              </button>

              {savedProjects.length ===
              0 ? (
                <p className="text-sm text-slate-400">
                  No saved projects
                  yet.
                </p>
              ) : (
                <div className="space-y-3">

                  {savedProjects.map(
                    (
                      project,
                      index
                    ) => (
                      <div
                        key={`${project.savedAt}-${index}`}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-4"
                      >

                        <h4 className="font-semibold">
                          {
                            project.episode ||
                            "Untitled Episode"
                          }
                        </h4>

                        <p className="text-xs text-slate-400 mt-1">
                          Saved:{" "}
                          {new Date(
                            project.savedAt
                          ).toLocaleString()}
                        </p>

                        <p className="text-xs text-slate-500 mt-2">
                          Shots:{" "}
                          {
                            project
                              .shots
                              ?.length ??
                            0
                          }
                        </p>

                        <div className="flex gap-2 mt-4">

                          <button
                            onClick={() =>
                              loadProject(
                                project
                              )
                            }
                            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 p-2 text-sm font-semibold"
                          >
                            Load
                          </button>

                          <button
                            onClick={() =>
                              deleteProject(
                                index
                              )
                            }
                            className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 p-2 text-sm font-semibold"
                          >
                            Delete
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </div>

        </div>

        <div className="premium-footer">
          Developed by ST
        </div>

      </div>
    </main>
  );
}