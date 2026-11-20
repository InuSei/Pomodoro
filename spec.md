# Product Specification: RMT-Chan (MTLE Study & Focus Companion)

## 1. Overview & Vision
**RMT-Chan** is a personalized, aesthetic web application designed specifically for Medical Technology Licensure Examination (MTLE) preparation. Built as a thoughtful, distraction-free study companion—distinct from rigid time-trackers like Yeolpumta (YPT)—it combines **short-attention-span-friendly Pomodoro intervals**, **AI-powered active recall flashcards** generated directly from pasted review notes, and a **cozy, non-generic pastel pink UI** with a soothing dusty-rose dark mode.

* **Target User:** Single primary user (MedTech reviewee preparing for the Philippine MTLE).
* **Deployment Target:** Vercel (Serverless Next.js Full-Stack).
* **Database:** MongoDB Atlas (Free M0 Tier — 512MB limit).

---

## 2. Core Design & Aesthetic Direction
To avoid generic "AI-template" gradients or harsh neon pinks, the interface uses a tactile, editorial stationery feel ("Cozy Study Desk" / Japanese stationery aesthetic) with soft borders, subtle paper-like elevation, and high-contrast typography for long study hours.

### 2.1 Color Palette & Theme Toggle
* **Light Mode ("Strawberry Milk & Linen"):**
  * **Primary Background:** `#FFF9FA` (Warm Alabaster Blush)
  * **Card / Surface:** `#FFFFFF` with `1px solid #F3DCE2` border
  * **Primary Accent:** `#E58C9E` (Soft Rose Pink — buttons, active timer ring)
  * **Secondary Accent:** `#F8E5EA` (Pastel Petal — tags, hover states)
  * **Text Primary:** `#3D2C31` (Deep Espresso Plum — easier on the eyes than pure black)
  * **Text Muted:** `#8C7279` (Dusty Mauve)
* **Dark Mode ("Midnight Velvet & Dusty Rose" — Low Eye Strain):**
  * *Designed specifically for late-night review without neon glare.*
  * **Primary Background:** `#181316` (Deep Charcoal Plum)
  * **Card / Surface:** `#221B1F` with `1px solid #362A31` border
  * **Primary Accent:** `#D47A8E` (Muted Dusty Rose)
  * **Secondary Accent:** `#2E2329` (Warm Plum Tint)
  * **Text Primary:** `#F4E8EC` (Soft Warm Cream-Pink)
  * **Text Muted:** `#A68E96` (Muted Mauve-Grey)

### 2.2 Custom Background Wallpaper System (Architecture Decision)
* **Storage Strategy:** **Client-Side `IndexedDB` + Overlay Opacity Slider** (Recommended over MongoDB storage).
  * *Why:* MongoDB Atlas Free Tier is capped at 512MB. Storing uncompressed wallpapers in MongoDB consumes storage rapidly and slows down API payloads. Storing wallpapers in `IndexedDB` allows instant, zero-latency loading of high-resolution images without touching database limits.
* **User Controls:**
  * Upload any local image (`.jpg`, `.png`, `.webp`).
  * **Glassmorphism Readability Shield:** Automatic translucent backdrop-blur (`backdrop-filter: blur(12px)`) behind cards + a user-adjustable **Background Dim/Tint Slider (0%–85%)** so text remains crisp over any photo.
  * Instant "Reset to Clean Solid Theme" button.

---

## 3. Functional Requirements

### 3.1 Authentication & Personalization (Single-User Gift Setup)
* **Passphrase / PIN Gate:**
  * Lightweight custom authentication using a secret passphrase/PIN stored via an environment variable (`APP_ACCESS_PIN`) and validated with an HTTP-only signed JWT cookie (`jose`).
  * Prevents random visitors on the public Vercel URL from altering notes or consuming AI API credits, without forcing email/password registration flows.
* **Personal Touch Engine:**
  * **MTLE Countdown Widget:** Configurable target exam date (e.g., March or August MTLE) displaying days remaining and a gentle encouraging subtitle.
  * **Break-Time Encouragement Cards:** A curated pool of sweet, customizable motivational messages (editable via a hidden/settings JSON or MongoDB collection) that appear randomly during break screens (e.g., *"Drink water, future RMT! You're doing amazing."*).

### 3.2 Attention-Friendly Timer & Preset Engine
Designed specifically for a **short attention span** studying dense clinical topics, balancing micro-sprints with longer exam-stamina blocks.

* **Built-In Curated Presets:**
  1. **Brain-Fog / Micro-Sprint (`20m Focus` / `5m Break`):** Low-friction entry for days when starting feels overwhelming.
  2. **Classic Balanced (`45m Focus` / `10m Break`):** Ideal for reading lecture handouts and annotating transes.
  3. **Deep Dive (`60m Focus` / `15m Break`):** Extended topic mastery block.
  4. **Board Stamina Block (`120m Total` with Automated Mid-Session Checkpoints):**
     * Structure: `55m Focus` $\rightarrow$ `10m Stretch Break` $\rightarrow$ `55m Focus` $\rightarrow$ `15m Long Break`.
     * Prevents burnout during 2-hour mock exam drills while maintaining multi-hour continuity.
* **Custom Preset Builder:**
  * Users can create, name, and save custom sequences (e.g., multi-segment sessions with custom focus duration, break duration, and number of cycles).
* **Short-Attention-Span Micro-Mechanics:**
  * **Session Micro-Checklist (1–3 Tiny Goals):** Before starting the clock, the user jots down 1–3 tiny sub-tasks (e.g., *"Read page 1–4 of Enterobacteriaceae"*). Checking them off triggers a subtle, satisfying chime and micro-animation for quick dopamine feedback.
  * **Gentle Audio & Visual Cues:** Soft marimba/chime audio alerts (toggleable) and tab-title live countdown (`[24:15] Clinical Chem — RMT-Chan`).
  * **No-Guilt Pause/Reset:** Pausing does not "fail" the session; elapsed focus minutes are still optionally loggable toward daily subject goals.

### 3.3 MTLE Subject Tagging (Companion to YPT)
Since YPT handles strict stopwatch tracking, this app focuses on **topic-level focus quality** across the 6 core MTLE board subjects:
1. **Clinical Chemistry (CC)** — *20%*
2. **Microbiology & Parasitology (Micro/Para)** — *20%*
3. **Hematology (Hema)** — *20%*
4. **Blood Banking / Immunohematology & Serology (ISBB)** — *20%*
5. **Clinical Microscopy (CM)** — *10%*
6. **Histopathologic Techniques & Medical Technology Laws (Histopath/MT Laws)** — *10%*

* **Lightweight Analytics:** Simple weekly donut/bar breakdown showing which subjects received focus sessions, helping spot neglected subjects before board week.

### 3.4 AI-Powered Active Recall & Flashcard Generator (Option B)
Directly converts raw review notes into quick recall drills without manual card typing.

* **Input Flow ("Paste & Quiz"):**
  * User selects an MTLE Subject (e.g., *Hematology*) and pastes a snippet of lecture notes, transes, or mnemonics (up to ~4,000 characters per batch) into a clean drawer.
  * Clicking **"Generate Quick Recall Cards"** sends the text to a Next.js API route (`/api/generate-cards`) powered by **Gemini 2.5 Flash** (structured JSON output).
* **AI Output Format:**
  * Generates **3 to 8 high-yield MTLE-style flashcards** per batch, focusing on:
    * Reference values & critical panic values
    * Differentiating biochemical tests / staining reactions
    * Pathognomonic findings & causative agents
    * Specimen collection & rejection criteria
  * Each card contains: `question` (front), `answer` (back), `highYieldTip` (short mnemonic/rationale), and `subjectTag`.
* **Break-Time / Post-Session Recall Mode:**
  * When a focus timer ends, the user is greeted with an optional **"2-Minute Quick Recall"** prompt featuring 2–3 cards from the subject they just studied (or due cards from their deck).
  * Simple self-rating buttons: **"Needs Review"** (re-queues sooner) vs. **"Got It"** (marks mastered).

---

## 4. Technical Architecture & Stack

* **Framework:** Next.js 14+ (App Router) with TypeScript
* **Styling:** Tailwind CSS + `lucide-react` icons
* **Database:** MongoDB Atlas (M0 Free Tier) via Mongoose ODM
* **AI Integration:** Google Gemini API (`@google/genai` SDK using `gemini-2.5-flash` for fast, low-cost JSON generation)
* **Client Storage:** `IndexedDB` (via `idb-keyval`) for custom background wallpapers & audio volume preferences
* **Hosting:** Vercel (Environment variables configured in Vercel Project Settings)

---

## 5. MongoDB Data Models (Lean Schema for 512MB M0 Tier)

To ensure the database stays well under 50MB even after months of daily studying, only structured text and timestamps are persisted.

### 5.1 `StudySession` Collection
```json
{
  "_id": "ObjectId",
  "subject": "Clinical Chemistry",
  "durationMinutes": 45,
  "presetName": "Classic Balanced",
  "microGoals": [
    { "text": "Liver function enzymes & AST/ALT ratios", "completed": true }
  ],
  "completedAt": "2026-11-19T14:30:00.000Z"
}
```

### 5.2 `Flashcard` Collection
```json
{
  "_id": "ObjectId",
  "subject": "Microbiology & Parasitology",
  "topicTitle": "Enterobacteriaceae IMViC",
  "question": "Which organism yields an IMViC pattern of ++-- and produces a metallic green sheen on EMB agar?",
  "answer": "Escherichia coli",
  "highYieldTip": "E. coli = Indole (+), Methyl Red (+), Voges-Proskauer (-), Citrate (-).",
  "status": "learning", // "learning" | "mastered"
  "reviewCount": 2,
  "lastReviewedAt": "2026-11-19T15:00:00.000Z",
  "createdAt": "2026-11-19T14:00:00.000Z"
}
```

### 5.3 `UserConfig` Collection (Single Document)
```json
{
  "_id": "ObjectId",
  "displayName": "Future RMT",
  "examDate": "2027-03-15T00:00:00.000Z",
  "themeMode": "light", // "light" | "dark"
  "wallpaperOpacity": 0.65,
  "customPresets": [
    {
      "id": "stamina-2hr",
      "name": "Board Stamina (2hr)",
      "segments": [
        { "type": "focus", "minutes": 55 },
        { "type": "break", "minutes": 10 },
        { "type": "focus", "minutes": 55 },
        { "type": "break", "minutes": 15 }
      ]
    }
  ],
  "encouragementNotes": [
    "Take a deep breath, stretch your shoulders, and hydrate!",
    "One topic at a time—you're going to crush the MTLE!",
    "Rest is part of retention. Proud of how hard you're working!"
  ]
}
```

---

## 6. UI Layout & User Flow

1. **Lock Screen (`/login`):**
   * Minimalist pastel card with a custom greeting, soft icon, and PIN/Passphrase input.
2. **Main Study Workspace (`/`):**
   * **Top Bar:** Personal greeting + MTLE Exam Countdown pill + Theme Toggle (Pastel Pink / Dusty Rose Dark) + Wallpaper Upload/Adjust modal trigger.
   * **Left / Center Hero Panel (The Focus Engine):**
     * Subject Selector pills (CC, Micro/Para, Hema, ISBB, CM, Histopath).
     * Preset Dropdown + "Custom Sequence" creator.
     * Large, clean circular or tabular countdown display with segment indicators (e.g., *Block 1 of 2*).
     * **Session Micro-Goals** input box (add up to 3 bite-sized checkboxes).
   * **Right / Collapsible Side Panel (AI Notes & Flashcard Deck):**
     * **Tab 1 — Paste Notes:** Textarea to paste reviewer notes $\rightarrow$ *"Generate Flashcards"* button.
     * **Tab 2 — Review Deck:** Filterable by MTLE subject; interactive flip-card viewer with *"Got It"* / *"Review Again"* controls.
   * **Bottom Drawer / Modal — Subject Balance:**
     * Clean visual summary of focus blocks completed per MTLE board subject.

---

## 7. Environment Variables (Vercel Deployment)

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mtle_pomodoro?retryWrites=true&w=majority
GEMINI_API_KEY=your_google_gemini_api_key
APP_ACCESS_PIN=your_secret_passcode
JWT_SECRET=random_32_char_secret_string
```

---

## 8. Implementation Roadmap (Suggested Build Order)
1. **Phase 1 (Foundation & Aesthetic):** Initialize Next.js + Tailwind, configure the Pastel Pink & Dusty Rose Dark theme variables, `IndexedDB` wallpaper uploader with blur/dim slider, and PIN auth middleware.
2. **Phase 2 (Attention-Friendly Timer):** Build the multi-segment Pomodoro engine supporting both single intervals (`20/5`, `60/15`) and multi-checkpoint blocks (`55/10/55/15`), paired with session micro-goals.
3. **Phase 3 (MongoDB & Subject Logging):** Connect Mongoose models to persist completed sessions, custom presets, countdown date, and custom encouragement notes.
4. **Phase 4 (AI Flashcard Pipeline):** Integrate Gemini 2.5 Flash API route to parse pasted review notes into structured MTLE flashcards and trigger post-session recall prompts.