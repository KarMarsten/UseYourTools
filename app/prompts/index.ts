export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
}

export const prompts: Prompt[] = [
  {
    id: 'goodnotes-planner',
    title: 'GoodNotes Planner',
    description: 'Earth-tone minimalist daily planner prompt optimized for GoodNotes',
    content: `🌿 UseYourTools – Earth-Tone Minimalist Daily Planner Prompt

(GoodNotes-Optimized PDF Generator)

Create a 7-page daily planner PDF optimized specifically for GoodNotes, Notability, and other handwriting apps.
This planner must use a warm earth-tone minimalist aesthetic with a subtle leaf motif.

This planner should be calming, clean, warm, and handwritten-friendly.

⸻

🎨 Design Requirements

Color Palette (Use These or Similar Earth Tones)
	•	Primary Brown: #8C6A4A
	•	Secondary Sand: #C9A66B
	•	Warm Tan Accent: #A67C52
	•	Soft Beige Background: #E7D7C1
	•	Deep Earth Brown (Text): #4A3A2A

Styling
	•	Clean, modern minimalism
	•	Very subtle leaf icon used in header or next to section titles
	•	Lots of whitespace
	•	Rounded, soft spacing
	•	Thin handwriting lines below each block

Page Layout
	•	Size: 600 × 900 px, portrait
	•	Earth-tone header bar for each day
	•	Leaf symbol (simple, single-line) used sparingly

⸻

📅 Daily Themes

Each page corresponds to one day and includes its theme:
	•	Monday — Momentum & Planning
	•	Tuesday — Deep Focus & Skill Growth
	•	Wednesday — Networking & Connection
	•	Thursday — Projects & Mastery
	•	Friday — Review & Celebration
	•	Saturday — Joy & Life Admin
	•	Sunday — Rest & Renewal

⸻

⏰ Daily Time Blocks

Use these EXACT blocks, in this order:
	•	8:00–9:00 — Morning routine • Centering
	•	9:00–11:00 — High-focus work (applications/learning/networking)
	•	11:00–12:00 — Research • Admin tasks
	•	12:00–13:00 — Lunch + outdoor time
	•	13:00–14:30 — Deep work (learning, projects, portfolio)
	•	14:30–15:00 — Break • Movement
	•	15:00–16:00 — Networking • Skill refinement
	•	16:00–17:00 — Exercise • Walk • Recharge
	•	Evening — Creativity • Reading • Reflection

⸻

✏️ Writing Lines Under Each Block

Under each time block, include:
	•	Two horizontal handwriting lines
	•	Soft earth-tone line color
	•	Spaced generously for stylus writing

⸻

🌿 Leaf Motif Guidelines

Use a very small, simple leaf icon, for example:
	•	next to the header text
	•	or next to the time-block title

Leaf should be:
	•	Minimal, line-based
	•	Earth-tone colored
	•	Not decorative or complex

⸻

📤 Export Requirements

Export the final 7-page planner as:

seven_day_goodnotes_earthtone_timeslots.pdf

⸻

END OF PROMPT`,
  },
];

export const getPromptById = (id: string): Prompt | undefined => {
  return prompts.find((p) => p.id === id);
};

