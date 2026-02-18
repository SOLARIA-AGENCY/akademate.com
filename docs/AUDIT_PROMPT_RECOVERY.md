# AUDIT & RECOVERY PROMPT: Akademate.com Deployment on NEMESIS

**Role:** Senior DevOps Architect & Full-Stack Engineer (Next.js/Docker Expert)
**Date:** February 18, 2026
**Target:** NEMESIS Server (`100.99.60.106`) | User: `cmdr`

## 1. Executive Summary & Objective
We are in the middle of a manual remediation of the **Akademate.com monorepo** (Next.js, Payload CMS, TurboRepo/pnpm). The local build is broken due to Edge Runtime restrictions, so we are bypassing local checks to build directly on the remote server via Docker.

**Goal:** Successfully deploy `web`, `admin`, and `payload` services to the NEMESIS staging environment, ensuring they boot correctly and are accessible.

## 2. Infrastructure & Credentials
- **Server IP:** `100.99.60.106`
- **User:** `cmdr`
- **SSH Key:** `~/.ssh/id_ed25519_nemesis` (Available in local context)
- **Project Path (Remote):** `~/akademate`
- **Docker Path:** `~/akademate/infrastructure/docker`
- **Environment:** `staging`

## 3. Incident History & Current State
We have iterated through 14 deployment attempts (`akademate-deploy-v14.tar.gz`). Here is the trail of fixes and remaining issues:

### **A. Codebase Fixes (Applied)**
1.  **Edge Runtime / Middleware:**
    *   *Issue:* `apps/tenant-admin/middleware.ts` used in-memory `Map` and `request.ip` type hacks, causing `TypeError: ip is not a function` during Edge builds.
    *   *Fix:* Disabled rate limiting logic (stateless) and hardcoded `127.0.0.1` as fallback IP. **Audit required:** Verify if this is sustainable or needs Redis.
2.  **Dependencies:**
    *   Added `socket.io-client` to `apps/admin-client`.
    *   Aligned `@aws-sdk/client-s3` and `s3-request-presigner` versions to `^3.744.0`.
    *   Added `packages/realtime`, `packages/ui` to Dockerfile `COPY` steps.
3.  **Build Config:**
    *   Enabled `output: 'standalone'` in `next.config.ts` for all apps (initially).
    *   *Later Reverted:* Dockerfiles were switched **FROM** using `standalone` output **TO** standard `pnpm start` in the last iteration (v14) because containers crashed with `Cannot find module server.js`.

### **B. Docker & Deployment Issues (Active)**
1.  **Container Crashes (Module Not Found):**
    *   Standalone builds were failing to find `server.js` or `dist/server.js`.
    *   Current strategy (v14) copies `.next`, `public`, `node_modules` and runs `pnpm start`. **Status:** `deploy.sh` was interrupted; functionality unverified.
2.  **Port Conflict:**
    *   Host port `80` was in use by another process (`coolify-proxy` or similar).
    *   *Fix:* `docker-compose.yml` updated to map Nginx to `8088:80` and `8443:443`.
3.  **Missing Files:**
    *   Root `postcss.config.cjs` and `tailwind.config.js` were missing in app Docker contexts. *Fixed in Dockerfiles.*
    *   `apps/web/public` and `apps/payload/public` were missing. *Fixed by creating placeholders.*

## 4. Required Audit & Remediation Tasks

Please perform the following steps in order:

### **Phase 1: Verification**
1.  **Analyze Docker Strategy:** Review `infrastructure/docker/Dockerfile.*`.
    *   *Decision:* Should we revert to `output: 'standalone'` and fix the pathing (e.g., `COPY .next/standalone /app`), OR stick with the heavy `pnpm start` image?
    *   *Recommendation:* Standalone is preferred for production. The previous error was likely due to incorrect `COPY` paths (e.g., missing `server.js` location in the standalone tree).
2.  **Check Remote State:**
    *   SSH into NEMESIS.
    *   Run `docker ps -a` and `docker logs akademate-payload`.
    *   Check if the v14 deployment actually ran or if it's in a corrupted state.

### **Phase 2: Fix & Deploy**
1.  **Refine Dockerfiles:**
    *   Ensure the `CMD` matches the actual build output structure.
    *   If using `standalone`: `CMD ["node", "apps/APP_NAME/server.js"]` (verify path inside image).
    *   If using `start`: Ensure `next` binary is found in `$PATH` or use `npm run start`.
2.  **Environment Variables:**
    *   Ensure `PAYLOAD_SECRET` is correctly passed via build args (already added to `docker-compose.yml` but needs verification).
3.  **Clean Deploy:**
    *   Prune Docker builder cache on NEMESIS if necessary (`docker builder prune`).
    *   Run `./infrastructure/scripts/deploy.sh staging all`.

### **Phase 3: Validation**
1.  **Health Check:** Verify HTTP `200 OK` on:
    *   Web: `http://100.99.60.106:8088`
    *   Payload: `http://100.99.60.106:3003/admin`
2.  **Logs:** Ensure no restart loops or connection errors to Postgres/Redis.

**Constraints:**
- Do **NOT** revert the Edge Runtime fixes in `middleware.ts` yet; they are necessary to pass the build.
- Use `tar` + `scp` for file transfer as git pull is not configured/reliable on the server for this specific branch state.
