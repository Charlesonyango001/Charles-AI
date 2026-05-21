# Charles AI Companion 🚀

Charles AI is an advanced, highly polished, multi-agent AI companion designed to help students, content creators, and local entrepreneurs. Powered by Gemini, Charles offers localized expertise, creative tools, search facilities, and image synthesis wrapped in an ultra-modern, dark cyberpunk-inspired dashboard.

---

## ✨ Features and Enhancements

1. **Progressive Web App (PWA)**:
   - **Offline Capability**: Features a robust, standard-compliant Service Worker (`sw.js`) that caches static elements, layouts, and assets for speedy load times and basic offline access.
   - **Web App Manifest**: Complete with `/manifest.json` describing icons, background assets, glowing violet color themes, and portrait display configurations.
   - **Installs onto Home Screen**: Custom-built `beforeinstallprompt` stream handlers render a responsive, glowing **Install Charles AI** launcher banner directly within the workspace sidebar.

2. **Advanced Multi-Agent Switching**:
   - Easily swap between customized intelligence modules like *Charles the Architect* (for code, repo analytics, test setups, and dev automation), *Mwalimu Charles* (revision, KCSE study plans, and educators styling), *Coach Charles* (career guidance, business hacks, and startup tips), and *Creative Charles* (image generation and video scripting).

3. **Performance, Accessibility, & Error Boundaries**:
   - **Pulsating Rich Loaders**: Implemented high-fidelity multi-colored loading bubbles that animate whenever Charles is formulating models or synthesizing canvas prints.
   - **Chat-Stream Error Bubbles**: Caught connection blocks and API glitches, rendering warnings as elegant inline chat alerts with setup guides instead of abrupt browser alert blocks.
   - **Touch Target Optimization**: Elevated padding targets to safe sizes matching responsive mobile limits.

4. **Production Serverless Support**:
   - Implemented lazy SDK loading and exported the Express server cleanly to support seamless hosting on Vercel's serverless functions wrapper without startup crash risks.

---

## 🛠️ Vercel Deployment Instructions

Charles AI has been fully prepared and optimized for seamless deployment to **Vercel** as a full-stack application (React SPA + serverless Express backend proxy).

### Step 1: Push Project to GitHub
Initialize git and push your repository to GitHub, GitLab, or Bitbucket:
```bash
git init
git add .
git commit -m "feat: prepare Charles AI for production vercel deployment"
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### Step 2: Import into Vercel Dashboard
1. Go to your [Vercel Dashboard](https://vercel.com/) and click **"Add New"** -> **"Project"**.
2. Connect your Git provider and import the `charles-ai` repository.

### Step 3: Configure Environment Variables
Before launching, you **must** configure your backend tokens inside the **Vercel Project Settings**:
1. Navigate to the **"Environment Variables"** tab.
2. Add the following key:
   - `GEMINI_API_KEY`: Your official Google AI Studio Gemini API Key.
3. Keep the environment as `production`.

### Step 4: Deploy 🌟
Click **"Deploy"**. Vercel will automatically read `/vercel.json`:
- It builds your frontend React client via Vite, depositing the compiled static site into `/dist`.
- It mounts `/api/index.ts` to coordinate serverless API routes (`/api/charles/*`), routing requests directly into the Express code cleanly.
- Vercel's Edge CDN will serve your images and web manifest for instant load times worldwide.

---

## 💻 Local Workspace Controls

To run and build the application locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Keys
Create a `.env` file at the root (refer to `.env.example`):
```env
GEMINI_API_KEY="your_actual_gemini_api_key"
NODE_ENV="development"
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to chat with Charles and test installation.

### 4. Build and Compile Static Assets
```bash
npm run build
```
This compiles the frontend assets, bundle-packages the custom server, and confirms that the workspace compiles with no errors.

---

## 🔒 Security and Privacy
Your API keys are completely shielded. The frontend client does **not** make direct calls to Gemini APIs; all prompts are proxied securely through the underlying serverless backend layer, keeping secrets safe from browser inspectors.
