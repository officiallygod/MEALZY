# MEALZY

MEALZY is a responsive, cross-platform meal planning and food inventory management application designed for web browsers, progressive web applications (PWA), and native mobile operating systems (iOS and Android via Capacitor).

The system addresses meal scheduling, macro tracking, leftover distribution, and perishable food monitoring through a local-first, privacy-focused architecture.

---

## Overview

Traditional meal planning applications often introduce cognitive friction through outdated calendar interfaces, rigid ingredient structures, or reliance on costly proprietary cloud backends. MEALZY provides a streamlined, responsive solution with:

- A rolling seven-day timeline anchored to the current day, eliminating historical dates from the active planning view.
- A hybrid schedule interface offering both a daily Bento-style focus and a comprehensive seven-day Kanban overview.
- Fluid drag-and-drop scheduling across meal slots (Breakfast, Lunch, Dinner, Snack).
- Multi-portion leftover scheduling ("Cook Once, Eat Multiple") that automatically allocates subsequent portions across future days.
- A perishable inventory monitor (Fridge Radar) that tracks cooked meals and alerts users to items approaching extended shelf life.
- Client-side heuristic recommendation logic to identify user dietary trends and propose recipe variations without external API dependencies.
- A zero-cost, privacy-preserving cloud synchronization layer utilizing user-owned Google Drive application storage (`appDataFolder`).

---

## System Architecture

MEALZY is structured as a local-first Progressive Web Application with client-side persistence and optional cross-device cloud synchronization.

```
+-------------------------------------------------------------+
|                     Presentation Layer                      |
| Next.js 15 (App Router, React 19) + Tailwind CSS            |
+-------------------------------------------------------------+
|                      State & Persistence                    |
| Dexie.js (IndexedDB) + LocalStorage + Cookie Management     |
+-------------------------------------------------------------+
|                      Intelligence Engine                    |
| Client-Side Heuristic Model (Trends, Twists & Rescues)      |
+-------------------------------------------------------------+
|                  Cross-Device Sync Layer                    |
| Google Identity Services -> Google Drive (appDataFolder)   |
+-------------------------------------------------------------+
|                   Native Runtime Target                     |
| Capacitor 6 (iOS & Android Native Webview Packaging)       |
+-------------------------------------------------------------+
```

### Technology Stack

- Framework: Next.js 15 (React 19, Static HTML Export)
- Styling: Tailwind CSS
- Animation Engine: Framer Motion
- Client Database: Dexie.js (IndexedDB wrapper)
- Icons: Lucide React
- Mobile Runtime: Capacitor 6 Core & CLI
- Continuous Deployment: GitHub Actions to GitHub Pages

---

## Functional Specifications

### 1. Rolling Seven-Day Planner
The application dynamically calculates a rolling seven-day window starting from today. Past days are omitted from the primary interface to preserve planning focus. Users can toggle between:
- Day Bento View: Detailed inspection of individual meal slots, macros, and preparation metadata.
- Seven-Day Overview: Comprehensive visual board across all upcoming dates.

### 2. Leftover Distribution Engine
When recording a meal as cooked, users can specify portion yield (1x to 4x portions). The system automatically creates linked leftover records in subsequent meal slots and registers the batch within the perishable inventory tracker.

### 3. Perishable Inventory Monitoring (Fridge Radar)
Cooked batches and refrigerated meals are timestamped. If an item remains unconsumed beyond designated thresholds (3+ days), the interface presents priority consumption prompts. Users can:
- Assign the item to today's schedule with a single interaction.
- Log early completion ("Gone Already"), which removes related pending leftovers and issues a replan prompt.

### 4. Client-Side Recommendation Heuristics
An embedded heuristic model evaluates scheduling history, preferred macro distributions, and recurring dietary patterns to generate:
- Repeat recommendations for frequent choices.
- Recipe variations ("Flavors with a Twist") that modify familiar base recipes.
- Fridge rescue suggestions pairing aging perishables into cohesive meals.

### 5. Curated Culinary Catalog and Fallback Rendering
The system incorporates an extensive catalog of popular meals complete with nutritional benchmarks. For custom dishes without associated photographic assets, the interface procedurally generates high-contrast typographic badge graphics, eliminating missing asset placeholders.

### 6. Privacy & Cookie Compliance
An integrated consent interface allows granular configuration of client-side storage behaviors, distinguishing between essential scheduling tokens, inventory state preservation, and local analytical preferences.

---

## Cloud Synchronization Architecture

MEALZY uses a zero-cost, decentralized cloud synchronization model that requires no centralized database infrastructure.

### Google Drive AppData Synchronization
- Protocol: Google OAuth 2.0 (PKCE via Google Identity Services)
- Scope: `https://www.googleapis.com/auth/drive.appdata`
- Storage: An encrypted snapshot file (`mealzy_sync.json`) stored within the user's private Google Drive application data folder.
- Benefits:
  - Zero centralized infrastructure overhead or database hosting costs.
  - User meal history and dietary data remain strictly within the user's personal Google account.
  - Multi-device synchronization functions across web browsers, tablets, and native mobile installs.

---

## Environment Configuration & Security

All environment variables follow standard client-side prefixing rules. No private server keys are stored in the repository.

### Configuration Template (.env.example)

```bash
# Public Google OAuth Client ID for Google Drive AppData Sync
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""

# Application Deployment URL
NEXT_PUBLIC_APP_URL="https://officiallygod.github.io/MEALZY"

# Optional: Supabase configuration (if utilizing alternative Postgres storage)
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
```

### GitHub Actions Secrets
For deployments hosted on GitHub Pages, configure the following repository secret or variable under Settings -> Secrets and variables -> Actions:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: The public Google OAuth 2.0 Client ID generated in the Google Cloud Console.

---

## Local Development & Compilation

### Prerequisites
- Node.js 18.18.0 or higher (Node.js 22 LTS recommended)
- npm 8.0.0 or higher

### Installation
```bash
git clone git@github.com:officiallygod/MEALZY.git
cd MEALZY
npm install
```

### Development Server
```bash
npm run dev
```
Access the application locally at `http://localhost:3000`.

### Production Build & Static Export
```bash
npm run build
```
Compiled static assets are generated in the `out/` directory, ready for static web hosting.

### Native Mobile Packaging (Capacitor)
```bash
# Add native platform targets
npx cap add android
npx cap add ios

# Sync static build assets to native projects
npm run build
npx cap sync

# Open in platform IDEs
npm run cap:open:android
npm run cap:open:ios
```

---

## Continuous Deployment

This repository includes an automated GitHub Actions workflow located at `.github/workflows/deploy.yml`. 

To activate automated deployment:
1. Navigate to repository Settings -> Pages.
2. Under Build and deployment -> Source, select "GitHub Actions".
3. Subsequent commits to the `main` branch will automatically compile and deploy the static export to GitHub Pages.

---

## License

This project is distributed under the MIT License. See LICENSE for details.
