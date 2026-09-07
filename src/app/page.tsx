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
const UI_BACKGROUND_THEMES = [
  { id: "gold-grid", name: "Cinematic Gold Grid", icon: "▦" },
  { id: "luxury-gold", name: "Luxury Black & Gold", icon: "✦" },
  { id: "carbon", name: "Dark Carbon Fiber", icon: "▤" },
  { id: "midnight-blue", name: "Midnight Blue", icon: "◈" },
  { id: "deep-red", name: "Deep Red Cinema", icon: "◆" },
  { id: "neon-cyber", name: "Neon Cyber", icon: "⌁" },
  { id: "studio-spotlight", name: "Dark Studio Spotlight", icon: "◉" },
  { id: "obsidian", name: "Minimal Obsidian", icon: "●" },
  { id: "aurora-noir", name: "Aurora Noir", icon: "✧" },
  { id: "emerald-noir", name: "Emerald Noir", icon: "◇" },
  { id: "violet-cinema", name: "Violet Cinema", icon: "◌" },
  { id: "silver-steel", name: "Silver Steel", icon: "⬡" },
  { id: "amber-cinema", name: "Amber Cinema", icon: "◐" },
  { id: "royal-blue", name: "Royal Blue", icon: "✦" },
  { id: "plum-noir", name: "Plum Noir", icon: "◈" },
  { id: "warm-studio", name: "Warm Studio", icon: "◉" },
] as const;

type UIBackgroundTheme = (typeof UI_BACKGROUND_THEMES)[number]["id"];

const BUTTON_COLOR_THEMES = [
  { id: "purple-velvet", name: "1. Purple / Velvet", icon: "●", swatch: "#9b3cff" },
  { id: "teal-mist", name: "2. Teal / Mist", icon: "●", swatch: "#48e1df" },
  { id: "amber-golden-haze", name: "3. Amber / Golden Haze", icon: "●", swatch: "#ffc84a" },
  { id: "royal-blue-luxe", name: "4. Royal Blue / Luxe", icon: "●", swatch: "#238cff" },
  { id: "rose-pink-neon", name: "5. Rose Pink / Neon", icon: "●", swatch: "#ff4fa3" },
  { id: "lime-green-matrix", name: "6. Lime Green / Matrix", icon: "●", swatch: "#6dff3f" },
  { id: "orange-sunset", name: "7. Orange / Sunset", icon: "●", swatch: "#ff7b22" },
  { id: "cyan-aqua", name: "8. Cyan / Aqua", icon: "●", swatch: "#10dce8" },
  { id: "violet-lavender", name: "9. Violet / Lavender", icon: "●", swatch: "#a779ff" },
  { id: "silver-steel", name: "10. Silver / Steel", icon: "●", swatch: "#d7e5f2" },
  { id: "deep-red-blood", name: "11. Deep Red / Blood", icon: "●", swatch: "#ff1e35" },
  { id: "indigo-galaxy", name: "12. Indigo / Galaxy", icon: "●", swatch: "#5550ff" },
  { id: "turquoise-ocean", name: "13. Turquoise / Ocean", icon: "●", swatch: "#17dfe4" },
  { id: "magenta-electric", name: "14. Magenta / Electric", icon: "●", swatch: "#ff16d4" },
  { id: "black-neon-edge", name: "15. Black / Neon Edge", icon: "●", swatch: "#dce8f5" },
] as const;

type ButtonColorTheme = (typeof BUTTON_COLOR_THEMES)[number]["id"];


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
  const [uiBackground, setUiBackground] = useState<UIBackgroundTheme>("gold-grid");
  const [bgMenuOpen, setBgMenuOpen] = useState(false);
const [buttonColorTheme, setButtonColorTheme] =
  useState<ButtonColorTheme>("royal-blue-luxe");  const [buttonColorMenuOpen, setButtonColorMenuOpen] = useState(false);
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
    <main className="premium-ui min-h-screen text-white" data-bg={uiBackground} data-button-theme={buttonColorTheme}>
      <style jsx global>{`
        .premium-ui {
          --gold: #c9a45b;
          --gold-light: #e6c77b;
          --gold-dark: #8f6b2e;
          --ink: #07090b;
          --panel: rgba(15, 17, 19, 0.88);
          --panel-2: rgba(20, 22, 25, 0.92);
          --line: rgba(201, 164, 91, 0.24);
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% -8%, rgba(201,164,91,.16), transparent 32%),
            radial-gradient(circle at 8% 45%, rgba(201,164,91,.055), transparent 24%),
            radial-gradient(circle at 92% 72%, rgba(201,164,91,.065), transparent 25%),
            linear-gradient(135deg, #030405 0%, #080a0c 48%, #040506 100%);
          min-height: 100vh;
        }

        /* Subtle cinematic technical grid — intentionally low contrast so it never
           competes with the controls or cards. */
        .premium-ui::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: .62;
          background-image:
            linear-gradient(rgba(201,164,91,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,164,91,.055) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
          background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;
          mask-image: radial-gradient(ellipse at center, black 5%, black 78%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 5%, black 78%, transparent 100%);
        }

        .premium-ui::after {
          content: "";
          position: fixed;
          inset: -20%;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 18%, rgba(201,164,91,.14), transparent 17%),
            radial-gradient(circle at 15% 82%, rgba(201,164,91,.045), transparent 15%),
            radial-gradient(circle at 88% 38%, rgba(201,164,91,.04), transparent 16%);
          filter: blur(32px);
        }

        .premium-ui * {
          scrollbar-color: rgba(201,164,91,.45) rgba(255,255,255,.04);
        }

        .premium-shell {
          position: relative;
          z-index: 1;
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

        .top-left-logo {
          width: 108px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-shrink: 0;
          filter: drop-shadow(0 0 12px rgba(224, 176, 76, .18));
        }

        .top-left-logo img {
          width: 108px;
          height: auto;
          display: block;
          object-fit: contain;
          mix-blend-mode: screen;
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

        /* PREMIUM DARK DROPDOWN OPTIONS */
.premium-ui select {
  color-scheme: dark;
  background-color: #111315 !important;
  color: #f1eee7 !important;
}

.premium-ui select option {
  background-color: #111315 !important;
  color: #f1eee7 !important;
}

.premium-ui select option:checked {
  background-color: #c9a45b !important;
  color: #08090a !important;
}

.premium-ui select option:hover {
  background-color: #2a2418 !important;
  color: #ffffff !important;
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
          transition: transform .18s ease, box-shadow .22s ease, filter .18s ease, background .22s ease, border-color .22s ease;
        }

        /* =====================================================
           PREMIUM ACTION BARS — REFERENCE STYLE
           Normal / Hover / Pressed / Disabled
        ===================================================== */
        .premium-ui .premium-action-button {
          display: grid !important;
          grid-template-columns: 52px minmax(0, 1fr) 52px;
          align-items: center;
          width: 100%;
          min-height: 52px;
          padding: 0 10px !important;
          border-radius: 12px !important;
          border: 1px solid var(--button-border) !important;
          background: linear-gradient(180deg, var(--button-top) 0%, var(--button-mid) 46%, #020406 100%) !important;
          color: var(--button-text) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.13), inset 0 -14px 28px rgba(0,0,0,.34), 0 0 0 1px var(--button-border-soft), 0 8px 24px rgba(0,0,0,.32);
          position: relative;
          overflow: hidden;
          isolation: isolate;
          font-weight: 650;
          letter-spacing: .01em;
          text-align: center;
        }

        .premium-ui .premium-action-button::before {
          content: "▤";
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: stretch;
          border-right: 1px solid color-mix(in srgb, var(--button-text) 55%, transparent);
          color: var(--button-text);
          font-size: 20px;
          line-height: 1;
          text-shadow: 0 0 8px var(--button-glow-soft);
          position: relative;
          z-index: 2;
        }

        .premium-ui .premium-action-button::after {
          content: "→";
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: stretch;
          color: var(--button-text);
          font-size: 29px;
          font-weight: 300;
          line-height: 1;
          text-shadow: 0 0 9px var(--button-glow-soft);
          position: relative;
          z-index: 2;
        }

        .premium-ui .premium-action-button:not(:disabled):hover {
          transform: translateY(-1px);
          filter: none;
          background: linear-gradient(180deg, var(--button-hover-top) 0%, var(--button-hover-mid) 46%, #020406 100%) !important;
          color: var(--button-hover-text) !important;
          border-color: var(--button-hover-border) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.22), inset 0 -16px 30px rgba(0,0,0,.40), 0 0 10px var(--button-glow-strong), 0 0 28px var(--button-glow-soft), 0 10px 30px rgba(0,0,0,.38);
        }

        .premium-ui .premium-action-button:not(:disabled):hover::before,
        .premium-ui .premium-action-button:not(:disabled):hover::after {
          color: var(--button-hover-text);
        }

        .premium-ui .premium-action-button:not(:disabled):active {
          transform: translateY(1px) scale(.995);
          filter: brightness(.92);
          background: linear-gradient(180deg, var(--button-mid) 0%, #020406 70%, #000 100%) !important;
          border-color: var(--button-border) !important;
          color: var(--button-text) !important;
          box-shadow: inset 0 3px 10px rgba(0,0,0,.58), inset 0 -2px 0 rgba(255,255,255,.045), 0 0 0 1px var(--button-border-soft), 0 3px 9px rgba(0,0,0,.45);
        }

        .premium-ui .premium-action-button:disabled {
          cursor: not-allowed !important;
          transform: none !important;
          filter: saturate(.25) brightness(.68);
          background: linear-gradient(180deg, #20252a 0%, #0d1013 48%, #050607 100%) !important;
          border-color: rgba(150,165,178,.34) !important;
          color: rgba(214,224,232,.52) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.055), inset 0 -12px 24px rgba(0,0,0,.42), 0 0 0 1px rgba(160,175,190,.06);
        }

        .premium-ui .premium-action-button:disabled::before,
        .premium-ui .premium-action-button:disabled::after {
          color: rgba(214,224,232,.52);
          text-shadow: none;
        }

        /* =====================================================
           ACTION BUTTON COLOR THEMES — 15 PREMIUM NEON PALETTES
        ===================================================== */
        .premium-ui[data-button-theme="purple-velvet"] {
          --button-top: #32104f; --button-mid: #100419; --button-border: #8f32e8;
          --button-border-soft: rgba(155,60,255,.16); --button-text: #c17aff;
          --button-hover-top: #5a1b83; --button-hover-mid: #190629; --button-hover-border: #b85cff;
          --button-hover-text: #efd4ff; --button-glow-strong: rgba(155,60,255,.62); --button-glow-soft: rgba(155,60,255,.30);
        }
        .premium-ui[data-button-theme="teal-mist"] {
          --button-top: #123f40; --button-mid: #041719; --button-border: #22bfc0;
          --button-border-soft: rgba(72,225,223,.16); --button-text: #5cf0ed;
          --button-hover-top: #1b6969; --button-hover-mid: #062728; --button-hover-border: #72fffb;
          --button-hover-text: #d0fffd; --button-glow-strong: rgba(72,225,223,.60); --button-glow-soft: rgba(72,225,223,.30);
        }
        .premium-ui[data-button-theme="amber-golden-haze"] {
          --button-top: #1A1A1A; --button-mid: #030303; --button-border: #D4AF37;
          --button-border-soft: rgba(212,175,55,.35); --button-text: #F5D77A;
          --button-hover-top: #292929; --button-hover-mid: #050505; --button-hover-border: #FFE7A0;
          --button-hover-text: #FFF4CC; --button-glow-strong: rgba(255,215,100,.75); --button-glow-soft: rgba(212,175,55,.35);
        }
        .premium-ui[data-button-theme="royal-blue-luxe"] {
          --button-top: #132d55; --button-mid: #050d1c; --button-border: #1f78dc;
          --button-border-soft: rgba(35,140,255,.16); --button-text: #63b8ff;
          --button-hover-top: #2459a0; --button-hover-mid: #08152a; --button-hover-border: #55aaff;
          --button-hover-text: #c8e7ff; --button-glow-strong: rgba(35,140,255,.62); --button-glow-soft: rgba(35,140,255,.30);
        }
        .premium-ui[data-button-theme="rose-pink-neon"] {
          --button-top: #4a1230; --button-mid: #17040f; --button-border: #dc347e;
          --button-border-soft: rgba(255,79,163,.16); --button-text: #ff63ae;
          --button-hover-top: #812050; --button-hover-mid: #250715; --button-hover-border: #ff69b5;
          --button-hover-text: #ffd1e8; --button-glow-strong: rgba(255,79,163,.65); --button-glow-soft: rgba(255,79,163,.32);
        }
        .premium-ui[data-button-theme="lime-green-matrix"] {
          --button-top: #173d12; --button-mid: #061506; --button-border: #43d82e;
          --button-border-soft: rgba(109,255,63,.16); --button-text: #7dff5b;
          --button-hover-top: #2a7620; --button-hover-mid: #0a2208; --button-hover-border: #8cff72;
          --button-hover-text: #ddffd5; --button-glow-strong: rgba(109,255,63,.62); --button-glow-soft: rgba(109,255,63,.30);
        }
        .premium-ui[data-button-theme="orange-sunset"] {
          --button-top: #4a220b; --button-mid: #170802; --button-border: #d75d10;
          --button-border-soft: rgba(255,123,34,.16); --button-text: #ff984d;
          --button-hover-top: #7c3a10; --button-hover-mid: #250d03; --button-hover-border: #ff9b4a;
          --button-hover-text: #ffe0c2; --button-glow-strong: rgba(255,123,34,.62); --button-glow-soft: rgba(255,123,34,.30);
        }
        .premium-ui[data-button-theme="cyan-aqua"] {
          --button-top: #073b42; --button-mid: #031416; --button-border: #09bdcb;
          --button-border-soft: rgba(16,220,232,.16); --button-text: #35eaf4;
          --button-hover-top: #0c6a75; --button-hover-mid: #05242a; --button-hover-border: #62f7ff;
          --button-hover-text: #d0fcff; --button-glow-strong: rgba(16,220,232,.65); --button-glow-soft: rgba(16,220,232,.32);
        }
        .premium-ui[data-button-theme="violet-lavender"] {
          --button-top: #2d1b55; --button-mid: #0d0618; --button-border: #8557d9;
          --button-border-soft: rgba(167,121,255,.16); --button-text: #b994ff;
          --button-hover-top: #50338b; --button-hover-mid: #160a2b; --button-hover-border: #c09bff;
          --button-hover-text: #eee4ff; --button-glow-strong: rgba(167,121,255,.60); --button-glow-soft: rgba(167,121,255,.30);
        }
        .premium-ui[data-button-theme="silver-steel"] {
          --button-top: #313a43; --button-mid: #0e1216; --button-border: #8292a0;
          --button-border-soft: rgba(215,229,242,.15); --button-text: #dce9f4;
          --button-hover-top: #586773; --button-hover-mid: #171d23; --button-hover-border: #f0f7ff;
          --button-hover-text: #ffffff; --button-glow-strong: rgba(215,229,242,.48); --button-glow-soft: rgba(215,229,242,.22);
        }
        .premium-ui[data-button-theme="deep-red-blood"] {
          --button-top: #4d0d16; --button-mid: #160205; --button-border: #dc142d;
          --button-border-soft: rgba(255,30,53,.17); --button-text: #ff4053;
          --button-hover-top: #841522; --button-hover-mid: #250308; --button-hover-border: #ff334b;
          --button-hover-text: #ffc1c8; --button-glow-strong: rgba(255,30,53,.68); --button-glow-soft: rgba(255,30,53,.34);
        }
        .premium-ui[data-button-theme="indigo-galaxy"] {
          --button-top: #1a1a55; --button-mid: #060619; --button-border: #4949db;
          --button-border-soft: rgba(85,80,255,.17); --button-text: #7e7cff;
          --button-hover-top: #3030a0; --button-hover-mid: #0b0b2d; --button-hover-border: #7976ff;
          --button-hover-text: #d8d7ff; --button-glow-strong: rgba(85,80,255,.65); --button-glow-soft: rgba(85,80,255,.32);
        }
        .premium-ui[data-button-theme="turquoise-ocean"] {
          --button-top: #063c43; --button-mid: #031416; --button-border: #0abfc5;
          --button-border-soft: rgba(23,223,228,.16); --button-text: #38eef0;
          --button-hover-top: #0b6c74; --button-hover-mid: #05252a; --button-hover-border: #62ffff;
          --button-hover-text: #d0ffff; --button-glow-strong: rgba(23,223,228,.64); --button-glow-soft: rgba(23,223,228,.32);
        }
        .premium-ui[data-button-theme="magenta-electric"] {
          --button-top: #4b0b3d; --button-mid: #180315; --button-border: #db10b6;
          --button-border-soft: rgba(255,22,212,.18); --button-text: #ff4be1;
          --button-hover-top: #86156f; --button-hover-mid: #290523; --button-hover-border: #ff55e7;
          --button-hover-text: #ffd0f5; --button-glow-strong: rgba(255,22,212,.68); --button-glow-soft: rgba(255,22,212,.34);
        }
        .premium-ui[data-button-theme="black-neon-edge"] {
          --button-top: #313840; --button-mid: #07090c; --button-border: #a9c0d3;
          --button-border-soft: rgba(220,232,245,.13); --button-text: #e0edf7;
          --button-hover-top: #536575; --button-hover-mid: #0c1015; --button-hover-border: #f1f8ff;
          --button-hover-text: #ffffff; --button-glow-strong: rgba(220,232,245,.55); --button-glow-soft: rgba(220,232,245,.25);
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

        /* =====================================================
           UI BACKGROUND THEMES
           These change only the application chrome/background.
           Character/stage background selection remains untouched.
        ===================================================== */
        .premium-ui[data-bg="gold-grid"] {
          background:
            radial-gradient(circle at 50% -8%, rgba(201,164,91,.16), transparent 32%),
            radial-gradient(circle at 8% 45%, rgba(201,164,91,.055), transparent 24%),
            radial-gradient(circle at 92% 72%, rgba(201,164,91,.065), transparent 25%),
            linear-gradient(135deg, #030405 0%, #080a0c 48%, #040506 100%);
        }
        .premium-ui[data-bg="luxury-gold"] {
          background:
            radial-gradient(ellipse at 50% 0%, rgba(218,178,92,.23), transparent 35%),
            radial-gradient(circle at 15% 70%, rgba(170,125,48,.08), transparent 28%),
            linear-gradient(145deg, #020303 0%, #0c0a07 52%, #020202 100%);
        }
        .premium-ui[data-bg="carbon"] {
          background-color: #080a0c;
          background-image:
            linear-gradient(135deg, rgba(255,255,255,.025) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.025) 50%, rgba(255,255,255,.025) 75%, transparent 75%),
            radial-gradient(circle at 50% 0%, rgba(201,164,91,.08), transparent 32%);
          background-size: 10px 10px, auto;
        }
        .premium-ui[data-bg="midnight-blue"] {
          background:
            radial-gradient(circle at 72% 12%, rgba(55,92,160,.22), transparent 28%),
            radial-gradient(circle at 12% 80%, rgba(24,52,104,.18), transparent 30%),
            linear-gradient(145deg, #02050b 0%, #07101d 50%, #020306 100%);
        }
        .premium-ui[data-bg="deep-red"] {
          background:
            radial-gradient(circle at 70% 15%, rgba(120,25,25,.25), transparent 28%),
            radial-gradient(circle at 18% 78%, rgba(83,16,22,.18), transparent 28%),
            linear-gradient(145deg, #050303 0%, #130708 48%, #030202 100%);
        }
        .premium-ui[data-bg="neon-cyber"] {
          background:
            radial-gradient(circle at 18% 18%, rgba(0,190,210,.12), transparent 25%),
            radial-gradient(circle at 82% 75%, rgba(130,55,210,.14), transparent 27%),
            linear-gradient(145deg, #020507 0%, #090610 52%, #020304 100%);
        }
        .premium-ui[data-bg="studio-spotlight"] {
          background:
            radial-gradient(ellipse 45% 38% at 50% 18%, rgba(245,238,220,.12), transparent 70%),
            radial-gradient(ellipse at 50% 100%, rgba(201,164,91,.07), transparent 38%),
            linear-gradient(180deg, #101112 0%, #050607 42%, #020303 100%);
        }
        .premium-ui[data-bg="obsidian"] {
          background:
            radial-gradient(circle at 50% 0%, rgba(255,255,255,.055), transparent 30%),
            linear-gradient(145deg, #030405 0%, #0b0d0f 50%, #030405 100%);
        }
        .premium-ui[data-bg="aurora-noir"] {
          background:
            radial-gradient(ellipse 55% 35% at 18% 12%, rgba(45,190,150,.16), transparent 68%),
            radial-gradient(ellipse 50% 34% at 82% 20%, rgba(90,90,220,.14), transparent 70%),
            linear-gradient(145deg, #020506 0%, #07100f 48%, #040407 100%);
        }
        .premium-ui[data-bg="emerald-noir"] {
          background:
            radial-gradient(circle at 75% 12%, rgba(20,145,105,.20), transparent 30%),
            radial-gradient(circle at 15% 78%, rgba(10,85,65,.15), transparent 28%),
            linear-gradient(145deg, #020403 0%, #07100d 52%, #020303 100%);
        }
        .premium-ui[data-bg="violet-cinema"] {
          background:
            radial-gradient(circle at 70% 16%, rgba(125,70,190,.22), transparent 30%),
            radial-gradient(circle at 20% 78%, rgba(75,35,125,.16), transparent 28%),
            linear-gradient(145deg, #040305 0%, #0e0712 50%, #030204 100%);
        }
        .premium-ui[data-bg="silver-steel"] {
          background:
            radial-gradient(ellipse at 50% 0%, rgba(210,220,225,.13), transparent 32%),
            radial-gradient(circle at 12% 75%, rgba(130,145,155,.07), transparent 25%),
            linear-gradient(145deg, #050708 0%, #111416 50%, #030405 100%);
        }
        .premium-ui[data-bg="amber-cinema"] {
          background:
            radial-gradient(circle at 52% 14%, rgba(220,150,45,.22), transparent 30%),
            radial-gradient(circle at 10% 82%, rgba(150,75,20,.10), transparent 25%),
            linear-gradient(145deg, #050403 0%, #140e06 52%, #030302 100%);
        }
        .premium-ui[data-bg="royal-blue"] {
          background:
            radial-gradient(circle at 78% 10%, rgba(45,90,210,.22), transparent 28%),
            radial-gradient(circle at 18% 82%, rgba(35,60,150,.14), transparent 28%),
            linear-gradient(145deg, #020409 0%, #07102a 50%, #020306 100%);
        }
        .premium-ui[data-bg="plum-noir"] {
          background:
            radial-gradient(circle at 72% 18%, rgba(155,55,120,.20), transparent 30%),
            radial-gradient(circle at 15% 78%, rgba(95,35,90,.13), transparent 28%),
            linear-gradient(145deg, #050304 0%, #12070f 50%, #030203 100%);
        }
        .premium-ui[data-bg="warm-studio"] {
          background:
            radial-gradient(ellipse 48% 42% at 50% 18%, rgba(255,205,125,.14), transparent 70%),
            radial-gradient(circle at 50% 85%, rgba(201,164,91,.07), transparent 28%),
            linear-gradient(180deg, #14100b 0%, #080706 45%, #020202 100%);
        }

        .premium-ui[data-bg="carbon"]::before {
          opacity: .18;
        }
        .premium-ui[data-bg="midnight-blue"]::before {
          background-image:
            linear-gradient(rgba(80,130,210,.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(80,130,210,.045) 1px, transparent 1px);
          background-size: 72px 72px;
          opacity: .55;
        }
        .premium-ui[data-bg="deep-red"]::before {
          background-image:
            linear-gradient(rgba(180,55,55,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,55,55,.04) 1px, transparent 1px);
          background-size: 80px 80px;
          opacity: .5;
        }
        .premium-ui[data-bg="neon-cyber"]::before {
          background-image:
            linear-gradient(rgba(0,190,210,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(150,70,220,.035) 1px, transparent 1px);
          background-size: 56px 56px;
          opacity: .65;
        }
        .premium-ui[data-bg="studio-spotlight"]::before,
        .premium-ui[data-bg="obsidian"]::before,
        .premium-ui[data-bg="silver-steel"]::before,
        .premium-ui[data-bg="warm-studio"]::before {
          opacity: .10;
        }
        .premium-ui[data-bg="aurora-noir"]::before,
        .premium-ui[data-bg="emerald-noir"]::before {
          background-image:
            linear-gradient(rgba(55,190,155,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(55,190,155,.035) 1px, transparent 1px);
          background-size: 72px 72px;
          opacity: .42;
        }
        .premium-ui[data-bg="violet-cinema"]::before,
        .premium-ui[data-bg="plum-noir"]::before {
          background-image:
            linear-gradient(rgba(155,75,190,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(155,75,190,.035) 1px, transparent 1px);
          background-size: 76px 76px;
          opacity: .42;
        }
        .premium-ui[data-bg="silver-steel"]::before {
          background-image:
            linear-gradient(rgba(205,215,220,.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(205,215,220,.028) 1px, transparent 1px);
          background-size: 80px 80px;
        }
        .premium-ui[data-bg="amber-cinema"]::before,
        .premium-ui[data-bg="warm-studio"]::before {
          background-image:
            linear-gradient(rgba(220,165,75,.032) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220,165,75,.032) 1px, transparent 1px);
          background-size: 84px 84px;
          opacity: .38;
        }
        .premium-ui[data-bg="royal-blue"]::before {
          background-image:
            linear-gradient(rgba(75,115,220,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(75,115,220,.035) 1px, transparent 1px);
          background-size: 72px 72px;
          opacity: .45;
        }

        .button-color-picker {
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid rgba(22,120,181,.30);
          background: rgba(8,9,10,.76);
          border-radius: 12px;
          padding: 7px 10px;
          box-shadow: inset 0 0 18px rgba(56,191,255,.025);
          position: relative;
          z-index: 50;
        }
        .button-color-picker:hover { border-color: var(--button-hover-border); }
        .button-color-trigger { border-color: var(--button-border) !important; background: linear-gradient(145deg, var(--button-top) 0%, #080b0e 100%); color: var(--button-text); }
        .button-color-trigger:hover { border-color: var(--button-hover-border) !important; background: linear-gradient(145deg, var(--button-hover-top) 0%, #090e13 100%); color: var(--button-hover-text); }
        .button-color-menu { border-color: var(--button-border) !important; background: #080b0e; }
        .button-color-menu .background-dropdown-option:hover { background: color-mix(in srgb, var(--button-hover-border) 12%, transparent); border-color: color-mix(in srgb, var(--button-hover-border) 28%, transparent); }
        .button-color-menu .background-dropdown-option.is-active { background: linear-gradient(90deg, color-mix(in srgb, var(--button-border) 16%, transparent), color-mix(in srgb, var(--button-border) 5%, transparent)); border-color: color-mix(in srgb, var(--button-border) 30%, transparent); color: var(--button-hover-text); }
        .button-color-menu .background-check { color: var(--button-text); }
        .button-theme-swatch {
          width: 11px;
          height: 11px;
          min-width: 11px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.35);
          display: inline-block;
        }
        .button-theme-swatch-trigger {
          width: 10px;
          height: 10px;
          min-width: 10px;
          margin-right: 2px;
        }
        .button-theme-icon {
          display: none;
        }

        .background-picker {
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid rgba(201,164,91,.30);
          background: rgba(8,9,10,.76);
          border-radius: 12px;
          padding: 7px 10px;
          box-shadow: inset 0 0 18px rgba(201,164,91,.025);
        }
        .background-picker-label {
          color: #aaa69c;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          white-space: nowrap;
        }
        .background-picker {
          position: relative;
          z-index: 50;
        }
        .background-dropdown {
          position: relative;
          min-width: 230px;
        }
        .background-dropdown-trigger {
          width: 100%;
          min-width: 230px;
          height: 38px;
          padding: 0 36px 0 12px;
          border: 1px solid rgba(201,164,91,.46);
          border-radius: 8px;
          background: linear-gradient(145deg, #1c1811 0%, #0b0b0a 100%);
          color: #f4e8c8;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          position: relative;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 4px 16px rgba(0,0,0,.25);
        }
        .background-dropdown-trigger:hover {
          border-color: rgba(230,199,123,.78);
          background: linear-gradient(145deg, #241e14 0%, #0d0c0a 100%);
        }
        .background-dropdown-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-54%);
          color: #e6c77b;
          font-size: 18px;
          line-height: 1;
        }
        .background-dropdown-menu {
          position: absolute;
          top: calc(100% + 7px);
          right: 0;
          width: 280px;
          max-height: 360px;
          overflow-y: auto;
          padding: 6px;
          border: 1px solid rgba(201,164,91,.48);
          border-radius: 10px;
          background: #0b0b0a;
          box-shadow: 0 18px 50px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.035);
          z-index: 9999;
        }
        .background-dropdown-menu::-webkit-scrollbar { width: 7px; }
        .background-dropdown-menu::-webkit-scrollbar-track { background: #080807; border-radius: 8px; }
        .background-dropdown-menu::-webkit-scrollbar-thumb { background: #4d3c20; border-radius: 8px; }
        .background-dropdown-option {
          width: 100%;
          min-height: 36px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          margin: 1px 0;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: #ddd7c9;
          text-align: left;
          font-size: 12.5px;
          cursor: pointer;
        }
        .background-dropdown-option:hover {
          background: rgba(201,164,91,.12);
          border-color: rgba(201,164,91,.22);
          color: #f4e8c8;
        }
        .background-dropdown-option.is-active {
          background: linear-gradient(90deg, rgba(201,164,91,.16), rgba(201,164,91,.055));
          border-color: rgba(201,164,91,.30);
          color: #f4e8c8;
        }
        .background-check {
          margin-left: auto;
          color: #e6c77b;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .premium-shell { padding: 20px 16px 30px; }
          .premium-header { align-items: flex-start; }
          .flow-badge { display: none; }
          .background-picker { width: 100%; }
          .button-color-picker { width: 100%; }
          .background-dropdown { min-width: 0; width: 100%; }
          .button-color-dropdown { min-width: 0; }
          .background-dropdown-trigger { min-width: 0; width: 100%; }
          .background-dropdown-menu { width: 100%; }
          .top-right-logo { width: 70px; height: 44px; }
          .top-right-logo img { width: 70px; }
          .premium-grid { grid-template-columns: 1fr; }
          .premium-card { padding: 20px !important; }
          .st-mark { width: 76px; font-size: 36px; }
          .brand-divider { display: none; }
        }
      `}</style>

      <div className="premium-shell">

        <header className="premium-header">
          <div className="premium-brand">
            <div className="top-left-logo" aria-label="ST"><img src="/st-logo-transparent.png" alt="ST" /></div>
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

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="background-picker" title="Change the Studio UI background">
              <span className="background-picker-label">BG</span>
              <div className="background-dropdown">
                <button
                  type="button"
                  className="background-dropdown-trigger"
                  onClick={() => setBgMenuOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={bgMenuOpen}
                >
                  {UI_BACKGROUND_THEMES.find((theme) => theme.id === uiBackground)?.icon} {UI_BACKGROUND_THEMES.find((theme) => theme.id === uiBackground)?.name}
                  <span className="background-dropdown-arrow">⌄</span>
                </button>
                {bgMenuOpen && (
                  <div className="background-dropdown-menu" role="listbox" aria-label="Studio background themes">
                    {UI_BACKGROUND_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        role="option"
                        aria-selected={uiBackground === theme.id}
                        className={`background-dropdown-option ${uiBackground === theme.id ? "is-active" : ""}`}
                        onClick={() => {
                          setUiBackground(theme.id);
                          setBgMenuOpen(false);
                        }}
                      >
                        <span>{theme.icon}</span>
                        <span>{theme.name}</span>
                        {uiBackground === theme.id && <span className="background-check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="button-color-picker" title="Change the action button color theme">
              <span className="background-picker-label">COLOR</span>
              <div className="background-dropdown button-color-dropdown">
                <button
                  type="button"
                  className="background-dropdown-trigger button-color-trigger"
                  onClick={() => setButtonColorMenuOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={buttonColorMenuOpen}
                >
                  <span
                    className="button-theme-swatch button-theme-swatch-trigger"
                    style={{ background: BUTTON_COLOR_THEMES.find((theme) => theme.id === buttonColorTheme)?.swatch, boxShadow: `0 0 9px ${BUTTON_COLOR_THEMES.find((theme) => theme.id === buttonColorTheme)?.swatch}` }}
                    aria-hidden="true"
                  />
                  {BUTTON_COLOR_THEMES.find((theme) => theme.id === buttonColorTheme)?.name}
                  <span className="background-dropdown-arrow">⌄</span>
                </button>
                {buttonColorMenuOpen && (
                  <div className="background-dropdown-menu button-color-menu" role="listbox" aria-label="Action button color themes">
                    {BUTTON_COLOR_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        role="option"
                        aria-selected={buttonColorTheme === theme.id}
                        className={`background-dropdown-option ${buttonColorTheme === theme.id ? "is-active" : ""}`}
                        onClick={() => {
                          setButtonColorTheme(theme.id);
                          setButtonColorMenuOpen(false);
                        }}
                      >
                        <span
                          className="button-theme-swatch"
                          style={{ background: theme.swatch, boxShadow: `0 0 10px ${theme.swatch}` }}
                          aria-hidden="true"
                        />
                        <span className="button-theme-icon">{theme.icon}</span>
                        <span>{theme.name}</span>
                        {buttonColorTheme === theme.id && <span className="background-check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
              className="premium-action-button w-full rounded-lg p-3 font-semibold mt-6"
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
              className="premium-action-button w-full rounded-lg p-3 font-semibold mt-3"
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
              className="premium-action-button w-full rounded-lg p-3 font-semibold mt-3"
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
                              className="premium-action-button w-full rounded-lg p-2 text-sm font-semibold mt-3"
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
                              className="premium-action-button w-full rounded-lg p-2 text-sm font-semibold mt-2"
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
                          className="premium-action-button w-full rounded-lg p-2 text-sm font-semibold mt-3"
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
              className="premium-action-button w-full rounded-lg p-3 font-semibold mt-4"
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
                className="premium-action-button w-full mt-3 rounded-lg p-3 font-semibold"
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
                className="premium-action-button w-full rounded-lg p-3 font-semibold"
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
                className="premium-action-button w-full mt-3 rounded-lg p-3 font-semibold"
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
                className="premium-action-button w-full rounded-lg p-3 font-semibold mb-4"
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
                            className="premium-action-button flex-1 rounded-lg p-2 text-sm font-semibold"
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
