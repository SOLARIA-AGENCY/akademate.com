# AUDIT & RECOVERY PROMPT: Akademate.com Deployment on NEMESIS

**Role:** Senior DevOps Architect & Full-Stack Engineer (Next.js/Docker Expert)
**Date:** February 19, 2026
**Target:** NEMESIS Server (`100.99.60.106`) | User: `cmdr`

## 1. Executive Summary & Objective
We have successfully deployed the **Akademate.com monorepo** (Next.js, Payload CMS, TurboRepo/pnpm) to the NEMESIS staging environment. The initial build issues (Edge Runtime) and runtime crashes (Module Not Found) have been resolved. The latest deployment (v15) also addressed a critical UI/UX issue where dashboard subsections were not inheriting the correct layout.

**Current Goal:** Maintain stability, monitor logs for runtime errors, and prepare for production hardening (e.g., restoring rate limiting with Redis).

## 2. Infrastructure & Credentials
- **Server IP:** `100.99.60.106` (Tailscale/VPN required)
- **User:** `cmdr`
- **SSH Key:** `~/.ssh/id_ed25519_nemesis`
- **Project Path (Remote):** `~/akademate`
- **Docker Path:** `~/akademate/infrastructure/docker`
- **Environment:** `staging`

## 3. Incident History & Resolution (v1-v15)

### **A. Codebase Fixes (Applied)**
1.  **Edge Runtime / Middleware:**
    *   *Issue:* `apps/tenant-admin/middleware.ts` used in-memory `Map` and `request.ip` type hacks.
    *   *Fix:* Disabled rate limiting logic (stateless) and hardcoded `127.0.0.1` as fallback IP.
2.  **Dependencies:**
    *   Added `socket.io-client` to `apps/admin-client`.
    *   Aligned `@aws-sdk` versions.
    *   Added `packages/realtime`, `packages/ui` to Dockerfile contexts.
3.  **UI/UX Layout:**
    *   *Issue:* Tenants, Billing, Support routes were siblings to `dashboard`, losing the sidebar layout.
    *   *Fix:* Moved `tenants`, `billing`, `support` directories into `apps/admin-client/app/dashboard/`.
    *   *Fix:* Updated `sidebar.tsx` links to point to `/dashboard/*`.

### **B. Docker Strategy (Current: v15)**
*   **Method:** Standard `pnpm start` (Not Standalone).
*   **Reason:** Standalone builds failed with `Cannot find module server.js` despite file verification. Reverting to full image resolved this.
*   **Dockerfiles:** Updated to copy `.next`, `public`, `package.json`, and `node_modules` (from builder) and run `CMD ["pnpm", "start"]`.

### **C. Deployment Status**
*   **Services:** `web`, `admin`, `payload` are UP and Healthy.
*   **Nginx:** Mapped to `8088:80` / `8443:443` to avoid host port 80 conflict.
*   **Migrations:** `db:migrate` failed in the script (`Command not found`), but the app is running. Schema seems stable for now.

## 4. Pending Tasks / Recommendations

### **Phase 1: Monitoring**
1.  **Log Analysis:**
    *   Watch `docker logs akademate-web` for `TypeError` (seen in `/cursos`).
    *   Watch `docker logs akademate-payload` for any database connection stability issues.

### **Phase 2: Hardening**
1.  **Rate Limiting:**
    *   Re-enable rate limiting in `middleware.ts` but use Redis (Upstash/KV) instead of `Map`.
2.  **Migration Script:**
    *   Fix the `db:migrate` command in `infrastructure/scripts/deploy.sh` or `package.json` to ensure schema updates apply correctly.
3.  **Optimization:**
    *   Revisit `output: 'standalone'` for Dockerfiles to reduce image size (currently large due to `node_modules`).

## 5. Verification Commands
- **SSH:** `ssh -i ~/.ssh/id_ed25519_nemesis cmdr@100.99.60.106`
- **Check Status:** `docker ps`
- **Check Logs:** `docker logs akademate-admin --tail 50`
- **Web Access:**
    - Web: `http://100.99.60.106:8088` (via Nginx)
    - Admin: `http://100.99.60.106:3004`
    - Payload: `http://100.99.60.106:3003`
