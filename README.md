<img width="1200" height="800" alt="image" src="https://github.com/user-attachments/assets/6f38436d-3074-4100-92fa-b5d1bd9634ec" />


# Digital Earth-Tone GoodNotes Planner 🌿

A reusable prompt-driven workflow for generating a **7-page, earth-tone daily planner PDF** optimized for
**GoodNotes, Notability, and other handwriting apps**.

This repository is designed to be:
- 📓 A home for your **planner prompt(s)**
- 📄 A place to store **generated sample PDFs**
- 📚 A simple, public-ready reference for others who want to use or adapt your system

---

## ✨ Features

- Warm **earth-tone aesthetic** (browns, tans, beiges, muted golds)
- **GoodNotes-optimized** page size (~600 × 900 px, portrait)
- Clean layout for **handwriting** (no fillable fields)
- **Time-blocked daily pages** for each day of the week:
  - 8:00–9:00 – Morning routine • Centering  
  - 9:00–11:00 – High-focus work (applications/learning/networking based on theme)  
  - 11:00–12:00 – Research • Admin tasks  
  - 12:00–13:00 – Lunch + outdoor time  
  - 13:00–14:30 – Deep work (learning, projects, portfolio)  
  - 14:30–15:00 – Break • Movement  
  - 15:00–16:00 – Networking • Skill refinement  
  - 16:00–17:00 – Exercise • Walk • Recharge  
  - Evening – Creativity • Reading • Reflection  

Each block includes handwriting space so you can plan, reflect, and track your day.

---

## 📂 Repository Structure

```text
.
├── README.md                      # Project overview (this file)
├── LICENSE                        # MIT License (default, feel free to change)
├── install.sh                     # Simple setup / usage helper script
├── docs/
│   ├── Overview.md                # Concept & design philosophy
│   └── Usage.md                   # How to use the prompt and planner
├── prompts/
│   └── GoodNotesPlannerPrompt.md  # Full prompt used to generate the planner
├── assets/
│   └── .gitkeep                   # Placeholder for screenshots, mockups, etc.
└── samples/
    └── .gitkeep                   # Placeholder for exported planner PDFs
```

---

## 🚀 Getting Started

You don’t need any special tooling to use this project.

### 1. Open the prompt

Open:

- `prompts/GoodNotesPlannerPrompt.md`

Copy the full prompt inside and paste it into ChatGPT (or another compatible LLM).

### 2. Generate the planner

Ask the model to:

- Generate a **7-page PDF** using the included prompt
- Make sure it uses:
  - Warm earth tones
  - GoodNotes-friendly dimensions
  - The exact time blocks and daily themes described in the prompt

Save that generated PDF into:

- `samples/`

For example: `samples/seven_day_goodnotes_earthtone_timeslots.pdf`

### 3. Use in GoodNotes (or similar)

- Import the PDF into GoodNotes / Notability / your favorite handwriting app
- Duplicate pages as needed
- Optionally, create multiple notebooks (e.g., one per month)

---

## 🧭 Documentation

- `docs/Overview.md` – Why this planner exists, the design goals, and core ideas
- `docs/Usage.md` – How to use or customize the prompt, plus tips for digital planning

---

## 🛠️ install.sh

There’s a small helper script:

```bash
./install.sh
```

It doesn’t install dependencies (none are required), but:
- Gives a quick overview in the terminal
- Points you to the key files to open first
- Serves as a simple “onboarding” step for new users or collaborators

---

## 🧩 Customization Ideas

Things you (or contributors) might add:

- 🌿 Botanical or watercolor themes
- 🌙 Celestial / boho / minimalist aesthetics
- 📅 Weekly or monthly dashboards
- ✅ Habit and mood trackers
- 🗂 Hyperlinked tabbed navigation
- 🧠 Reflection and journaling pages

Feel free to fork this repo and adapt it to your own planning style.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-idea`)
3. Commit your changes (`git commit -m "Add new planner template"`)
4. Push to the branch (`git push origin feature/my-idea`)
5. Open a Pull Request

Suggestions, design tweaks, and new prompt variants are all welcome.

---

## 📜 License

This project is licensed under the **MIT License**.  
See the [`LICENSE`](./LICENSE) file for details.
