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



const validateShotContinuity = (shotPrompt: string) => {
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

    lighting: prompt.includes("lighting"),

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

  console.log(
    "FAILED CONTINUITY CHECKS:",
    Object.entries(checks)
      .filter(([, value]) => !value)
      .map(([key]) => key)
  );

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.values(checks).length;

  return {
    checks,
    passed,
    total,
    isValid: passed === total,
  };
};

export default function Home() {
  const [selectedCharacter] = useState(character);

  const [episode, setEpisode] = useState("");
const [script, setScript] = useState("");
const [prompt, setPrompt] = useState("");
const [referenceImagePrompt, setReferenceImagePrompt] = useState("");

const [promptHistory, setPromptHistory] = useState<
  {
    episode: string;
    prompt: string;
    createdAt: string;
  }[]
>([]);

const [shotCount, setShotCount] = useState(1);

const [shots, setShots] = useState<
  {
    id: number;
    shotNumber: number;
    script: string;
    prompt: string;
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
  }[]
>([]);

const createShotBreakdown = () => {
  if (!script.trim()) {
    alert("Please enter a script first.");
    return;
  }

  const words = script.trim().split(/\s+/);

  const totalWords = words.length;
  const wordsPerShot = Math.ceil(totalWords / shotCount);

  const generatedShots = Array.from(
    { length: shotCount },
    (_, index) => {
      const start = index * wordsPerShot;
      const end = Math.min(start + wordsPerShot, totalWords);

      return {
        id: Date.now() + index,
        shotNumber: index + 1,
        script: words.slice(start, end).join(" "),
        prompt: "",
      };
    }
  );

  setShots(generatedShots);
};

  const generateShotPrompts = async () => {
  if (shots.length === 0) {
    alert("Create the shot breakdown first.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const generatedShots = await Promise.all(
      shots.map(async (shot) => {
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
${outfit}

STAGE:
${STAGE_LOCK.environment}
${STAGE_LOCK.setting}

BACKGROUND:
${background}

CAMERA:
${camera}

LIGHTING:
${light}

STYLE:
${style}

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

IMPORTANT CONTINUITY RULES:

Keep Aanya on the comedy stage.
Do NOT visually recreate the story being told.
Do NOT change the location.
Do NOT introduce another character as the main performer.

EPISODE CONTINUITY LOCK:

${CONTINUITY_LOCK.identity}

${CONTINUITY_LOCK.outfit}

${CONTINUITY_LOCK.environment}

${CONTINUITY_LOCK.lighting}

${CONTINUITY_LOCK.visualStyle}

${CONTINUITY_LOCK.performer}

${CONTINUITY_LOCK.continuity}

The shot must visually belong to the same continuous episode
as every other generated shot.

Do not redesign Aanya between shots.
Do not change her identity, outfit, stage environment,
lighting style, visual style, or overall appearance.

Only the shot-specific performance, framing, camera movement,
expression, pose, and dialogue may change according to the
selected settings and shot script.

OUTPUT:
Provide only the final copy-ready Google Flow cinematic prompt.
`;

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: shotPrompt,
            referenceImage: referenceImageData,
            referenceImageMimeType: referenceImageMimeType,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Shot generation failed.");
        }

        const finalShotPrompt = `${data.output.trim()}

${buildContinuityFooter()}`;

const continuity = validateShotContinuity(finalShotPrompt);

return {
  ...shot,
  prompt: finalShotPrompt,
  continuity,
};
      })
    );

    setShots(generatedShots);
  } catch (err) {
    console.error(err);
    setError("Failed to generate shot prompts.");
  } finally {
    setLoading(false);
  }
};


const [savedProjects, setSavedProjects] = useState<
  {
    episode: string;
    script: string;
    prompt: string;
    shotCount: number;
    shots: {
      id: number;
      shotNumber: number;
      script: string;
      prompt: string;
    }[];
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
  }[]
>([]);



useEffect(() => {
  const storedProjects = localStorage.getItem("ai-actor-projects");

  if (storedProjects) {
    setSavedProjects(JSON.parse(storedProjects));
  }
}, []);

const saveProject = () => {
  if (!episode.trim()) {
    alert("Please enter an episode name first.");
    return;
  }

  if (!prompt.trim() && shots.length === 0) {
  alert("Generate a prompt or create shot breakdown first.");
  return;
}

  const newProject = {
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
  savedAt: new Date().toISOString(),
};

  const updatedProjects = [...savedProjects, newProject];

  setSavedProjects(updatedProjects);

  localStorage.setItem(
    "ai-actor-projects",
    JSON.stringify(updatedProjects)
  );

  alert("Project Saved!");
};

const loadProject = (project: {
  episode: string;
  script?: string;
  prompt: string;
  shotCount?: number;
  shots?: {
    id: number;
    shotNumber: number;
    script: string;
    prompt: string;
  }[];
  mood?: string;
  expression?: string;
  pose?: string;
  language?: string;
  performancePreset?: string;
  outfit?: string;
  background?: string;
  camera?: string;
  light?: string;
  style?: string;
  savedAt: string;
}) => {
  setEpisode(project.episode);
  setScript(project.script || "");
  setPrompt(project.prompt);

  setShotCount(project.shotCount || 1);
  setShots(project.shots || []);

  if (project.mood) setMood(project.mood);
  if (project.expression) setExpression(project.expression);
  if (project.pose) setPose(project.pose);
  if (project.language) setLanguage(project.language);
  if (project.performancePreset) {
    setPerformancePreset(project.performancePreset);
  }

  if (project.outfit) setOutfit(project.outfit as any);
  if (project.background) setBackground(project.background as any);
  if (project.camera) setCamera(project.camera as any);
  if (project.light) setLight(project.light as any);
  if (project.style) setStyle(project.style as any);

  alert("Project Loaded!");
};

const deleteProject = (index: number) => {
  const updatedProjects = savedProjects.filter(
    (_, projectIndex) => projectIndex !== index
  );

  setSavedProjects(updatedProjects);

  localStorage.setItem(
    "ai-actor-projects",
    JSON.stringify(updatedProjects)
  );

  alert("Project Deleted!");
};

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

  const [mood, setMood] = useState(moods[0]);
  const [expression, setExpression] = useState(expressions[0]);
  const [pose, setPose] = useState(poses[0]);
  const [language, setLanguage] = useState("Hinglish");
  const [performancePreset, setPerformancePreset] = useState("Stand-up Comedy");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState("");
  const [referenceImageData, setReferenceImageData] = useState<string | null>(null);
const [referenceImageMimeType, setReferenceImageMimeType] = useState<string | null>(null);

  const [outfit, setOutfit] = useState(outfits[0]);
  const [background, setBackground] = useState(backgrounds[0]);
  const [camera, setCamera] = useState(cameras[0]);
  const [light, setLight] = useState(lighting[0]);
  const [style, setStyle] = useState(styles[0]);

  const buildContinuityFooter = () => `
CONTINUITY LOCK — MANDATORY FOR THIS SHOT

IDENTITY:
Same Aanya Rao character identity across every shot.
Preserve the exact face, facial structure, eyes, eyebrows, nose,
lips, jawline, skin tone, hair identity, hairstyle, and body proportions.

OUTFIT:
Maintain the exact selected outfit consistently across all shots.
Selected outfit: ${String(outfit)}

ENVIRONMENT:
This exact selected background and stage environment must remain visually identical across every shot.

Selected background: ${String(background)}

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

The selected background must remain the same comedy-club environment
throughout the entire episode.

The story or dialogue must NEVER cause a background change.

Aanya must remain on the same physical comedy stage throughout the episode.
Do not visually recreate the story being told.
Do not change the location.

LIGHTING:
Maintain consistent cinematic lighting direction, intensity,
color temperature, and overall lighting mood across every shot.

CAMERA:
Maintain the selected camera language and cinematic framing consistently.
Selected camera: ${String(camera)}

VISUAL STYLE:
Maintain the same cinematic visual style, realism level,
image quality, and overall production look across every shot.
Selected style: ${String(style)}

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

  return (    
  <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-2">
          🎭 AI Actor Studio
        </h1>

        <p className="text-gray-400 mb-8">
          Create consistent AI characters for Google Flow
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT PANEL */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">

            <h2 className="text-xl font-semibold mb-5">
              Episode Details
            </h2>

            <label className="block mb-2 text-sm">
              Character
            </label>

            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4">
              <option>{selectedCharacter.name}</option>
            </select>

            <label className="block mb-2 text-sm">
              Episode Name
            </label>

            <input
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              placeholder="Weekend Metro Story"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            />

            <label className="block mb-2 text-sm">
              Script
            </label>

            <textarea
              rows={8}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste your script..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            />

            <label className="block mb-2 text-sm">
  Number of Shots
</label>

<select
  value={shotCount}
  onChange={(e) => setShotCount(Number(e.target.value))}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
>
  {[1, 2, 3, 4, 5, 6].map((count) => (
    <option key={count} value={count}>
      {count} {count === 1 ? "Shot" : "Shots"}
    </option>
  ))}
</select>

            <label className="block mb-2 text-sm">
              Mood
            </label>

            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {moods.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <label className="block mb-2 text-sm">
              Expression
            </label>

            <select
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {expressions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
<label className="block mb-2 text-sm">
  Pose
</label>

<select
  value={pose}
  onChange={(e) => setPose(e.target.value)}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
>
  {poses.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}
</select>
 <label className="block mb-2 text-sm">
  Language
</label>

<select
  value={language}
  onChange={(e) => setLanguage(e.target.value)}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
>
  <option value="Hindi">Hindi</option>
  <option value="Hinglish">Hinglish</option>
  <option value="Kannada">Kannada</option>
  <option value="Marathi">Marathi</option>

            </select>
            <label className="block mb-2 text-sm">
  Performance Preset
</label>

<select
  value={performancePreset}
  onChange={(e) => setPerformancePreset(e.target.value)}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
>
  <option value="Stand-up Comedy">Stand-up Comedy</option>
  <option value="Storytelling">Storytelling</option>
  <option value="Emotional Story">Emotional Story</option>
  <option value="Interview">Interview</option>
  <option value="Casual Talking">Casual Talking</option>
  <option value="Crowd Interaction">Crowd Interaction</option>
  <option value="Punchline">Punchline</option>
</select>

<label className="block mb-2 text-sm">
  Character Reference
</label>

<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0];

   if (!file) {
  setReferenceImage(null);
  setReferenceImageName("");
  return;
}setReferenceImageName(file.name);

    const imageUrl = URL.createObjectURL(file);
    setReferenceImage(imageUrl);
    setReferenceImageMimeType(file.type);

const reader = new FileReader();

reader.onload = () => {
  const result = reader.result as string;

  const base64 = result.split(",")[1];

  setReferenceImageData(base64);
};

reader.readAsDataURL(file);
  }}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
/>

{referenceImage && (
  <div className="mb-4">
    <img
      src={referenceImage}
      alt="Character reference"
      className="w-full max-h-80 object-contain rounded-lg border border-slate-700"
    />
  </div>
)}


                        <label className="block mb-2 text-sm">
              Outfit
            </label>

            <select
              value={String(outfit)}
              onChange={(e) => setOutfit(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
            >
              {outfits.map((item, index) => (
                <option key={index} value={String(item)}>
                  {typeof item === "string" ? item : JSON.stringify(item)}
                </option>
              ))}
            </select>

<label className="block mb-2 text-sm">
  Background
</label>

<select
  value={String(background)}
  onChange={(e) => setBackground(e.target.value as any)}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
>
  {backgrounds.map((item, index) => (
    <option key={index} value={String(item)}>
      {typeof item === "string" ? item : JSON.stringify(item)}
    </option>
  ))}
</select>

<label className="block mb-2 text-sm">
  Camera
</label>

<select
  value={String(camera)}
  onChange={(e) => setCamera(e.target.value as any)}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
>
  {cameras.map((item, index) => (
    <option key={index} value={String(item)}>
      {typeof item === "string" ? item : JSON.stringify(item)}
    </option>
  ))}
</select>

<label className="block mb-2 text-sm">
  Lighting
</label>

<select
  value={String(light)}
  onChange={(e) => setLight(e.target.value as any)}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
>
  {lighting.map((item, index) => (
    <option key={index} value={String(item)}>
      {typeof item === "string" ? item : JSON.stringify(item)}
    </option>
  ))}
</select>



<label className="block mb-2 text-sm">
  Style
</label>

<select
  value={String(style)}
  onChange={(e) => setStyle(e.target.value as any)}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
>
  {styles.map((item, index) => (
    <option key={index} value={String(item)}>
      {typeof item === "string" ? item : JSON.stringify(item)}
    </option>
  ))}
</select>


            <button
  onClick={async () => {
    if (!script.trim()) {
      setError("Please enter a script first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const performanceInstructions: Record<string, string> = {
  "Stand-up Comedy":
    "Perform as a live stand-up comedian. Use confident comedic timing, natural pauses, subtle punchline emphasis, conversational hand gestures, and direct audience engagement.",

  "Storytelling":
    "Perform as a natural storyteller. Use expressive facial reactions, controlled hand gestures, varied pacing, and storytelling pauses while maintaining a conversational delivery.",

  "Emotional Story":
    "Perform with emotionally authentic storytelling. Use gentle facial expressions, slower pacing, meaningful pauses, restrained gestures, and sincere eye contact.",

  "Interview":
    "Perform in a natural interview style. Maintain relaxed posture, conversational facial expressions, attentive eye contact, subtle gestures, and realistic speaking behavior.",

  "Casual Talking":
    "Perform in a relaxed conversational style. Use natural body movement, subtle gestures, comfortable facial expressions, and an informal speaking rhythm.",

  "Crowd Interaction":
    "Perform as an interactive comedian engaging with the live audience. Use direct audience eye contact, responsive facial expressions, spontaneous gestures, pauses for audience reaction, and natural crowd interaction.",

  "Punchline":
    "Deliver the performance with strong comedic timing. Build naturally toward punchlines, use deliberate pauses before key jokes, subtle expression changes, and confident audience engagement.",
};

const selectedPerformanceInstruction =
  performanceInstructions[performancePreset] ||
  performanceInstructions["Stand-up Comedy"];

const aiPrompt = `
You are an expert cinematic AI prompt writer for Google Flow.



STAGE LOCK:

Environment: ${STAGE_LOCK.environment}
Setting: ${STAGE_LOCK.setting}
Performer Position: ${STAGE_LOCK.performerPosition}
Microphone: ${STAGE_LOCK.microphone}
Audience: ${STAGE_LOCK.audience}

Background:
${background}

Camera:
${camera}

Lighting:
${light}

Style:
${style}

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

OUTPUT:

Provide one complete copy-ready Google Flow cinematic prompt.

The final prompt must strictly follow all selected settings:

- Outfit: ${outfit}
- Background: ${background}
- Camera: ${camera}
- Lighting: ${light}
- Style: ${style}
- Performance Preset: ${performancePreset}
- Mood: ${mood}
- Expression: ${expression}
- Pose: ${pose}

Do not replace, ignore, or contradict any selected setting.

The dialogue must be spoken naturally by Aanya in the selected language.

Do not add subtitles, captions, logos, watermarks, or unrelated characters.




LANGUAGE INSTRUCTIONS:
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

STAGE LOCK:

Environment: ${STAGE_LOCK.environment}
Setting: ${STAGE_LOCK.setting}
Performer Position: ${STAGE_LOCK.performerPosition}
Microphone: ${STAGE_LOCK.microphone}
Audience: ${STAGE_LOCK.audience}
Background: ${background}
Camera: ${camera}
Lighting: ${light}
Style: ${style}



IMPORTANT VISUAL RULE:

The story being told must NOT be visually recreated.

The performer must remain on the stand-up comedy stage while telling the story.

Do NOT change the location based on the story.

For example, if the comedian talks about Mumbai local,
do NOT show a Mumbai local, railway station, or train.

Instead, show the comedian on the comedy stage
performing the Mumbai local story to the audience.

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

OUTPUT FORMAT:

SCENE:
Describe the scene visually.

CHARACTER:
Describe Aanya's appearance and performance.

CAMERA:
Selected Camera: ${camera}

Describe the shot type, camera movement, lens/framing, and composition according to the selected camera above.
The selected camera must be followed exactly.

LIGHTING:
Describe cinematic lighting.

DIALOGUE:
Write the dialogue naturally in ${language}.

FINAL GOOGLE FLOW PROMPT:
Provide one complete copy-ready cinematic prompt.

The FINAL GOOGLE FLOW PROMPT must strictly follow ALL selected settings:

- Outfit: ${outfit}
- Background: ${background}
- Camera: ${camera}
- Lighting: ${light}
- Style: ${style}
- Performance Preset: ${performancePreset}
- Mood: ${mood}
- Expression: ${expression}
- Pose: ${pose}

Do not replace, ignore, or contradict any of these selected settings.
All selected settings must be clearly reflected in the final cinematic prompt.

FINAL PROMPT CONSISTENCY RULES:

The generated video must preserve Aanya's exact identity from the master reference image.

Identity is the highest priority and must remain consistent across the entire shot:
- same facial structure
- same eyes, eyebrows, nose, lips, and jawline
- same skin tone
- same hair identity and hairstyle unless the selected outfit/style explicitly requires a change
- same body proportions
- same recognizable character identity

The selected Outfit, Background, Camera, Lighting, Style, Performance Preset, Mood, Expression, and Pose are mandatory instructions.

Do not silently substitute, reinterpret, remove, or contradict any selected setting.

Do not visually recreate the story described in the dialogue or script.
The performer must remain on the selected comedy-club stage environment.

The dialogue must be spoken naturally by Aanya in the selected language.
Do not add extra dialogue, narration, subtitles, captions, on-screen text, logos, or watermarks.

The final prompt must describe one coherent cinematic shot with consistent character identity, outfit, environment, camera, lighting, performance, and dialogue.

NEGATIVE PROMPT:
${selectedCharacter.negativePrompt}
`;

const firstFramePrompt = `
Create a photorealistic cinematic reference image of the established character Aanya Rao.

IDENTITY:
Use the uploaded master character reference image as the identity authority.
Preserve Aanya's exact:
- facial structure
- eyes, eyebrows, nose, lips, and jawline
- skin tone
- hairstyle and hair identity
- body proportions
- recognizable overall appearance

The character must clearly remain the same person as the master reference.

OUTFIT — MANDATORY:
${outfit}

Do NOT copy the clothing from the master reference image.
The selected outfit above must completely replace the clothing visible in the master reference.

CHARACTER:
Name: ${selectedCharacter.name}
Role: ${selectedCharacter.role}
Age: ${selectedCharacter.age}
Appearance: ${selectedCharacter.hair}

VISUAL STYLE:
${selectedCharacter.visualStyle}

ENVIRONMENT:
${background}

LIGHTING:
${light}

CAMERA / FRAMING:
${camera}

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

The final image must show the same Aanya identity from the master reference
wearing the selected outfit and matching the selected visual settings.

NEGATIVE PROMPT:
${selectedCharacter.negativePrompt}
`;

setReferenceImagePrompt(firstFramePrompt);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  prompt: aiPrompt,
  referenceImage: referenceImageData,
  referenceImageMimeType: referenceImageMimeType,
}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI generation failed.");
      }

      setPrompt(data.output);

      setPromptHistory((prev) => [
  {
    episode: episode || "Untitled Episode",
    prompt: data.output,
    createdAt: new Date().toISOString(),
  },
  ...prev,
]);
    } catch (err) {
      console.error(err);
      setError("AI generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }}


  
  disabled={loading}
  className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 font-semibold mt-6"
>
  {loading ? "Generating..." : "Analyze Script"}
</button>

<button
  onClick={createShotBreakdown}
  disabled={loading || !script.trim()}
  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 font-semibold mt-3 transition"
>
  Create Shot Breakdown
</button>

<button
  onClick={generateShotPrompts}
  disabled={loading || shots.length === 0}
  className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 font-semibold mt-3 transition"
>
  {loading ? "Generating Shot Prompts..." : "Generate Shot Prompts"}
</button>

          </div>

          {/* RIGHT PANEL */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">

            <h2 className="text-xl font-semibold mb-4">
              Prompt Preview
            </h2>
            {error && (
  <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-300">
    {error}
  </div>
)}

          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">

  <div className="px-4 py-3 bg-slate-850 border-b border-slate-700">
    <h3 className="text-sm font-semibold text-slate-200">
      Generated Google Flow Prompt
    </h3>
    <p className="text-xs text-slate-400 mt-1">
      Review the complete prompt before copying.
    </p>
  </div>

  <div className="p-4 min-h-[500px] max-h-[650px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-200">
    {prompt || "Prompt will appear here..."}
  </div>

</div>

</div>

{/* SHOT PROMPTS */}

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
      {shots.map((shot) => (
        <div
          key={shot.id}
          className="bg-slate-900 border border-slate-700 rounded-lg p-4"
        >
          <h4 className="font-semibold text-blue-400">
            Shot {shot.shotNumber}
          </h4>

          <textarea
  value={shot.script}
  onChange={(e) => {
    setShots((prev) =>
      prev.map((item) =>
        item.id === shot.id
          ? { ...item, script: e.target.value }
          : item
      )
    );
  }}
  rows={4}
  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mt-2 text-sm text-slate-300 resize-y"
  placeholder="Shot script..."
/>
<div className="flex items-center justify-between mb-2">
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
              <p className="text-xs text-slate-500 mb-2">
                Google Flow Prompt
              </p>

              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {shot.prompt}
                </p>
              </div>

              {shot.prompt && shot.continuity && (
  <span
    className={`text-xs ${
      shot.continuity.isValid
        ? "text-emerald-400"
        : "text-yellow-400"
    }`}
  >
    • Continuity{" "}
    {shot.continuity.isValid
      ? "OK"
      : "Review"}{" "}
    — {shot.continuity.passed}/{shot.continuity.total}
  </span>
)}

              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(shot.prompt);
                  alert(`Shot ${shot.shotNumber} prompt copied!`);
                }}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 p-2 text-sm font-semibold mt-3 transition"
              >
                Copy Shot {shot.shotNumber} Prompt
              </button>

<button
  onClick={async () => {
    setLoading(true);
    setError("");

    try {
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
${outfit}

STAGE:
${STAGE_LOCK.environment}
${STAGE_LOCK.setting}

BACKGROUND:
${background}

CAMERA:
${camera}

LIGHTING:
${light}

STYLE:
${style}

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

This regenerated shot must visually belong to the same
continuous episode as all other shots.

Do not redesign Aanya.
Do not change her identity, outfit, stage environment,
lighting, visual style, or overall appearance.

Only the shot-specific performance, framing, expression,
pose, camera movement, and dialogue may change according
to the selected shot settings.

Create a single coherent cinematic shot.

OUTPUT:
Provide only the final copy-ready Google Flow cinematic prompt.
`;

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: shotPrompt,
          referenceImage: referenceImageData,
          referenceImageMimeType: referenceImageMimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Shot regeneration failed.");
      }

     const regeneratedPrompt = `${data.output.trim()}

${buildContinuityFooter()}`;

const continuity = validateShotContinuity(regeneratedPrompt);

setShots((prev) =>
  prev.map((item) =>
    item.id === shot.id
      ? {
          ...item,
          prompt: regeneratedPrompt,
          continuity,
        }
      : item
  )
);
    } catch (err) {
      console.error(err);
      setError("Failed to regenerate shot prompt.");
    } finally {
      setLoading(false);
    }
  }}
  disabled={loading}
  className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 text-sm font-semibold mt-2 transition"
>
  {loading
    ? `Regenerating Shot ${shot.shotNumber}...`
    : `Regenerate Shot ${shot.shotNumber}`}
</button>

            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-3">
              Prompt not generated yet.
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
)}

{/* PROMPT HISTORY */}
<div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">
      Generated Prompt History
    </h3>

    <span className="text-sm text-slate-400">
      {promptHistory.length} generated
    </span>
  </div>

  {promptHistory.length === 0 ? (
    <p className="text-sm text-slate-400">
      No generated prompts yet.
    </p>
  ) : (
    <div className="space-y-3">
      {promptHistory.map((item, index) => (
        <div
          key={`${item.createdAt}-${index}`}
          className="bg-slate-900 border border-slate-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">
              {item.episode || "Untitled Episode"}
            </p>

            <span className="text-xs text-slate-500">
              {new Date(item.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="mt-3 max-h-40 overflow-auto bg-slate-800 rounded-lg p-3">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {item.prompt}
            </p>
          </div>

          <button
            onClick={async () => {
              await navigator.clipboard.writeText(item.prompt);
              alert("Historical prompt copied!");
            }}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 p-2 text-sm font-semibold mt-3 transition"
          >
            Copy Historical Prompt
          </button>
        </div>
      ))}
    </div>
  )}
</div>

<button
  onClick={async () => {
    if (!prompt) {
      alert("Generate a prompt first.");
      return;
    }

    await navigator.clipboard.writeText(prompt);
    alert("Prompt Copied!");
  }}
  className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 p-3 font-semibold mt-4 transition"
>
  Copy Prompt
</button>



{/* SAVED PROJECTS */}
<div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">

  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">
      Saved Projects
    </h3>

    <span className="text-sm text-slate-400">
      {savedProjects.length} saved
    </span>
  </div>

  <button
  onClick={saveProject}
  className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 p-3 font-semibold mb-4 transition"
>
  Save Project
</button>

{/* REFERENCE IMAGE / FIRST FRAME */}
<div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">

  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold text-white">
        Reference Image / First Frame
      </h3>

      <p className="text-sm text-slate-400 mt-1">
        Generate a reference image using the selected character identity,
        outfit, style, lighting, background, pose, and expression.
      </p>
    </div>

    <span className="text-xs text-slate-400">
      {referenceImagePrompt
        ? "Ready"
        : "Generate a prompt first"}
    </span>
  </div>

  <textarea
    value={referenceImagePrompt}
    readOnly
    placeholder="Reference image prompt will appear here after generating the cinematic prompt..."
    className="w-full min-h-[220px] bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-y focus:outline-none"
  />

  <button
    onClick={async () => {
      if (!referenceImagePrompt) {
        alert("Generate a prompt first.");
        return;
      }

      await navigator.clipboard.writeText(referenceImagePrompt);
      alert("Reference image prompt copied!");
    }}
    disabled={!referenceImagePrompt}
    className="w-full mt-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 font-semibold transition"
  >
    Copy Reference Image Prompt
  </button>

</div>


  {savedProjects.length === 0 ? (
    <p className="text-sm text-slate-400">
      No saved projects yet.
    </p>
  ) : (
    <div className="space-y-3">
      {savedProjects.map((project, index) => (
        <div
          key={`${project.savedAt}-${index}`}
          className="bg-slate-900 border border-slate-700 rounded-lg p-4"
        >
          <h4 className="font-semibold">
            {project.episode || "Untitled Episode"}
          </h4>

          <p className="text-xs text-slate-400 mt-1">
            Saved:{" "}
            {new Date(project.savedAt).toLocaleString()}
          </p>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => loadProject(project)}
              className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 p-2 text-sm font-semibold transition"
            >
              Load
            </button>

            <button
              onClick={() => deleteProject(index)}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 p-2 text-sm font-semibold transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
      </div>
    </div>
  </main>
);
}