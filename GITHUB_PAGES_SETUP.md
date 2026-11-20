# Focus & Ambient Studio — GitHub Pages Deployment Setup

## 1. Overview
This guide documents the automated CI/CD pipeline and GitHub Pages hosting configuration for Focus & Ambient Studio.

- **GitHub Account:** `BISHWADEEPT23`
- **Target Repository Name:** `focus-ambient-studio`
- **Target Remote URL:** `https://github.com/BISHWADEEPT23/focus-ambient-studio.git`
- **Production Live URL:** `https://bishwadeept23.github.io/focus-ambient-studio/`
- **Deployment Branch:** `master`
- **Hosting Platform:** GitHub Pages (Official Actions Workflow)

---

## 2. GitHub Pages Architecture & Compatibility

### 2.1 Subpath Base Configuration
GitHub Pages project repositories are served under a pathname subfolder (`/<repository-name>/`). The application has been configured with:
- **Vite Base Path:** `base: process.env.VITE_BASE_PATH || '/focus-ambient-studio/'` in `vite.config.ts`.
- **HTML Asset Interpolation:** `%BASE_URL%manifest.json` and `%BASE_URL%icon-192.svg` in `index.html`.
- **Dynamic Service Worker Registration:** Computes scope and script URL using `import.meta.env.BASE_URL` in `src/registerServiceWorker.ts`.
- **PWA Manifest Relativization:** `public/manifest.json` uses `./` relative resolution for `start_url`, `id`, `scope`, and icons, making it subpath-resilient.
- **Dynamic Service Worker Scope Detection:** `public/sw.js` determines its own scope path from `self.registration.scope`, guaranteeing offline precaching and cache-first handling within `/focus-ambient-studio/`.

---

## 3. GitHub Actions CI/CD Pipeline (`.github/workflows/deploy.yml`)

The deployment pipeline is fully automated and triggers on every push to `master`:
1. **Checkout:** Checks out the verified Git repository tree.
2. **Environment:** Sets up Node.js v20 with npm caching.
3. **Dependency Installation:** Runs `npm ci` for deterministic package resolution.
4. **Static Typecheck:** Runs `npx tsc --noEmit` to ensure 0 type errors.
5. **Automated Unit & Integration Tests:** Runs all 71 Vitest tests (`npm test -- --run`).
6. **Production Build:** Executes `npm run build` with `VITE_BASE_PATH=/focus-ambient-studio/`.
7. **Artifact Upload:** Bundles `dist/` using `actions/upload-pages-artifact@v3`.
8. **Deployment:** Deploys to GitHub Pages via `actions/deploy-pages@v4` with least-privilege permissions:
   ```yaml
   permissions:
     contents: read
     pages: write
     id-token: write
   ```

---

## 4. GitHub Remote Creation & Push Protocol

Before publishing, explicit approval is required. Once approved:
1. Create the repository on GitHub:
   ```bash
   gh repo create focus-ambient-studio --private --source=. --remote=origin
   ```
   *(Note: GitHub Pages on standard free accounts requires public repository visibility. If public visibility is approved, `--public` is used).*
2. Push the verified Git history to the remote:
   ```bash
   git push -u origin master
   ```
3. Enable GitHub Pages using GitHub Actions as the build source:
   - Navigate to **Settings > Pages** in the GitHub repository.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
   - The workflow `.github/workflows/deploy.yml` will automatically trigger and deploy the site to `https://bishwadeept23.github.io/focus-ambient-studio/`.

---

## 5. Rollback Instructions

If a production defect is discovered on the live GitHub Pages site:
1. Revert to the known good checkpoint commit:
   ```bash
   git revert HEAD
   git push origin master
   ```
   *Or reset to a previous verified commit and push:*
   ```bash
   git push origin <previous-commit-hash>:master --force
   ```
2. GitHub Actions will automatically re-run the build and redeploy the previous stable build within ~60 seconds.
