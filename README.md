# ⚡ MEALZY — Aesthetic Gen-Z Meal Planner & Fridge Radar

> **Plan what to make. Track what to eat. Never let good food rot in the fridge.**  
> Inspired by neo-brutalism, bold high-contrast aesthetics, and springy micro-interactions. Built for Web, iOS, and Android.

---

## ✨ Key Features

1. **Dynamic Rolling 7-Day View (Starts from Today)**
   - No past days cluttering your week. The planner automatically anchors to **Today** and rolls forward 7 days dynamically.
   - Switch effortlessly between **Day Bento Grid** and the **Full 7-Day Board**.

2. **Fluid Drag-and-Drop with Spring Physics**
   - Grab any dish and drop it into Breakfast, Lunch, Dinner, or Snacks across any day with luminous neon drop targets (`DROP HERE ⚡`).

3. **"Cook Once, Eat 3x-4x" Leftover Engine**
   - Tap **Cook** on any dish, choose your portion multiplier (1x, 2x, 3x, or 4x Meal Prep King 👑).
   - MEALZY automatically schedules leftovers into your future days' slots and checks them into the **Fridge Radar**.

4. **Quirky Gen-Z Fridge-Rot Radar**
   - Batches cooked 2–3+ days ago trigger an urgent alert: *"ROTTING IN FRIDGE! Eat that ASAP 🚨"*.
   - One-tap buttons to *"Eat for Lunch"* or *"Eat for Dinner"* today.
   - **Gone Already?** If you polished off a dish before expected, tap "Gone Already!" to clear it, earn the *Quick Muncher* badge, and instantly replan/cook again!

5. **Internal AI Flavor Twist Engine (Zero API Charges)**
   - Client-side heuristic model that analyzes your eating habits.
   - Generates *"Same Vibe, With a Twist 🔥"* (e.g. transforms *Miso Salmon* into *Gochujang Honey Salmon Bowls* or *Pesto Pasta* into *Sun-Dried Tomato Burrata Rigatoni*).
   - 100% offline-compatible with zero recurring API costs.

6. **Curated 200+ Aesthetic Food Library (Zero Broken Placeholders)**
   - High-res photography for popular dishes.
   - For custom user recipes, MEALZY dynamically generates a high-fashion typographic card with category emoji and pastel gradient mesh—**never** showing an empty box or broken image.

7. **Aesthetic Cookie & Consent Dialog**
   - Neo-brutalist floating card with playful Gen-Z copy and granular switches for Essential Storage, Fridge Memory, and Taste Analytics.

---

## 🏛️ Tech Stack & Architecture

- **Core Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Neo-brutalist design tokens
- **Animations**: [Framer Motion](https://www.framer-motion.com/) + [Canvas Confetti](https://github.com/catdad/canvas-confetti)
- **Local-First Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Cross-Platform Bridge**: [Capacitor 6](https://capacitorjs.com/) for native iOS & Android export

---

## 🔑 Zero-Cost Cloud Database Options ($0 Forever)

You don't need to pay for a hosted database. MEALZY supports two free pathways:

### Option A: Google Drive AppData Sync (Recommended & 100% Free)
- MEALZY saves an encrypted sync state (`mealzy_sync.json`) directly into the user's private Google Drive `appDataFolder`.
- **Cost**: $0 forever, infinite user scale, zero server maintenance, 100% user privacy.
- **Key required**: A free **Google OAuth Client ID** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

### Option B: Supabase Free PostgreSQL
- Standard relational DB with free Auth (Email & Google) and Row-Level Security.
- **Keys required**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option C: 100% Offline / Local-First (No Keys Needed)
- Works instantly out-of-the-box in any browser or mobile webview using IndexedDB + browser cookies!

---

## 🚀 Getting Started

### 1. Install & Run Locally
```bash
# Clone the repo
git clone git@github.com:officiallygod/MEALZY.git
cd MEALZY

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view MEALZY in action!

### 2. Build for Production
```bash
npm run build
npm run start
```

### 3. Package to Native iOS & Android
```bash
# Initialize Capacitor native platforms
npx cap add android
npx cap add ios

# Build the web app and sync native assets
npm run build
npx cap sync

# Open in Android Studio or Xcode
npm run cap:open:android
npm run cap:open:ios
```

---

## 📄 License
MIT License. Built with love & good taste.
