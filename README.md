# ⚡ MEALZY — Aesthetic Gen-Z Meal Planner & Fridge Radar

> **Plan what to make. Track what to eat. Never let good food rot in the fridge.**  
> Inspired by neo-brutalism, bold high-contrast aesthetics, and springy micro-interactions. Built for Web, GitHub Pages, iOS, and Android.

---

## 🌐 Live GitHub Pages Deployment

MEALZY is pre-configured with a zero-maintenance GitHub Actions CI/CD workflow that builds and exports static HTML on every push to `main`!

### Enabling GitHub Pages in 2 Clicks:
1. Open your repository on GitHub: [`https://github.com/officiallygod/MEALZY`](https://github.com/officiallygod/MEALZY)
2. Go to **Settings** → **Pages** (in the left sidebar).
3. Under **Build and deployment → Source**, change from *Deploy from a branch* to **GitHub Actions**.
4. That's it! GitHub Actions will run `.github/workflows/deploy.yml` and publish your app live at:  
   👉 **`https://officiallygod.github.io/MEALZY/`**

---

## 🔑 Where Are the Google Keys & How Does It Work?

### 1. Where do keys live?
- **In-Browser / GitHub Pages**: Click your profile icon in the top right → open the **"🔑 Cloud & Keys"** tab. You can paste your free Google OAuth Client ID right there in the browser! It is securely saved in your browser's `localStorage` so you never have to re-enter it.
- **In Local Development**: In the project root, duplicate `.env.example` to `.env.local` and set:
  ```env
  NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
  ```

### 2. How the $0 Free Cloud Architecture Works
- When you click **"Continue with Google"**, MEALZY initiates Google OAuth with the scope `https://www.googleapis.com/auth/drive.appdata`.
- MEALZY saves an encrypted sync state (`mealzy_sync.json`) directly inside your personal, private Google Drive hidden application storage (`appDataFolder`).
- **Why this is unbeatable**:
  - **Zero Database Bills**: You never pay for AWS, Firebase, or MongoDB hosting.
  - **Infinite Scale**: Works for 1 user or 1,000,000 users at $0 cost.
  - **100% User Privacy**: Meals and food logs never touch an external third-party database server.
  - **Offline-First**: Operates seamlessly offline with IndexedDB even with no internet connection.

### 3. How to get your free Google Client ID in 2 minutes:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials** → **OAuth client ID**.
3. Application Type: **Web application**.
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for local development)
   - `https://officiallygod.github.io` (for your live GitHub Pages app)
5. Copy the generated **Client ID** (ends with `.apps.googleusercontent.com`), paste it into the **Cloud & Keys** tab inside MEALZY, and click **Save Keys**!

---

## ✨ Features Checklist & Revisions

- [x] **Dynamic Rolling 7-Day Timeline (Anchored to Today)**: Eliminates past dates. The week starts on Today and rolls forward.
- [x] **Day Bento Grid & 7-Day Kanban**: Switch between single-day detail and full week board.
- [x] **Drag-and-Drop with Spring Physics**: Luminous neon drop indicators (`DROP HERE ⚡`) with smooth spring feedback.
- [x] **"Cook Once, Eat 3x-4x" Leftover Multiplier**: Choose how many times you want to eat a dish. Automatically schedules leftovers into future days.
- [x] **Quirky Gen-Z Fridge-Rot Radar**: Alerts when food has been in the fridge 2–3+ days (*"ROTTING IN FRIDGE! EAT ASAP 🚨"*).
- [x] **"Gone Already?" Early Finish Mode**: If a dish was eaten faster than expected, tap "Gone Already!" to clear it, trigger confetti, and earn the **"Quick Muncher 🏆"** badge with a 1-tap replan button.
- [x] **Curated 200+ Aesthetic Food Library**: High-res imagery with **zero broken placeholders** (custom dishes get a stylish typographic badge with pastel gradient & emoji).
- [x] **Internal Local AI Flavor Twists**: Generates variations of your favorite foods (e.g. *Miso Salmon* → *Gochujang Honey Salmon Bowls*) with zero recurring API costs.
- [x] **Recipe Link Importer**: Paste recipe links from TikTok, Instagram, and web blogs.
- [x] **Gen-Z Cookie Consent Popup**: Floating pill banner with customizable switches for essentials, fridge storage, and taste analytics.
- [x] **Cross-Platform**: Web, GitHub Pages, PWA, and Capacitor 6 ready for iOS & Android native export.

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

To build for production static export:
```bash
npm run build
```

To package as a native Android or iOS app:
```bash
npx cap add android
npx cap add ios
npm run build
npx cap sync
```

---

## 📄 License
MIT License. Built with style.
