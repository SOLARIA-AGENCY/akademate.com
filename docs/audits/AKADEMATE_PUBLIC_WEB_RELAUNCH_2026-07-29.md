# Akademate public web relaunch — 2026-07-29

## Scope

- Surface: `apps/web` at `akademate.com` and `www.akademate.com`.
- Positioning: the operating system for modern academies, with AI assistance as an optional capability rather than the primary sales moat.
- Commercial language: English-first, confident and outcome-led.
- Plans: Launch, Business and Enterprise (dedicated or on-premise), without public prices.
- Customer proof: CEP Formación only. Additional carousel entries describe academy types, not fictional customers.

## Visual thesis

Calm, intelligent control for modern academies: Akademate cobalt, deep ink, warm daylight and editorial images of adult education. The product narrative moves from the academy operation to in-person delivery, online delivery, AI assistance, governance, plans and resources.

## Public architecture

- `/`: commercial landing and primary conversion journey.
- `/features`: 15 operational groups plus interactive product workflows.
- `/pricing`: Business and Enterprise plan narratives, comparison and FAQ.
- `/solutions`: customer-type index with eight detailed vertical pages.
- `/blog`: editorial index with four articles and product news.
- `/blog/ai-assisted-academy-operations`: original article and image.
- `/blog/one-operation-in-person-online-academies`: original article and image.
- `/sobre-nosotros`: company narrative.
- `/contacto`: consent-gated commercial form.
- `/legal/*`: centralized legal and regulatory information.

## Competitive structure benchmark

Official product surfaces from Classter, iSAMS, OpenEduCat and openSIS were reviewed for message architecture only. Akademate adopts the useful category patterns — one connected system, modular depth, navigable capability catalogue, institution fit and repeated demo CTA — without copying text, design or claims.

## Trust boundaries

- GDPR, EU AI Act, ISO 27001, SOC 2 and OWASP appear as reference frameworks for operational alignment.
- GDPR and EU AI Act visual marks link to the corresponding privacy and transparency information; they are not described as certifications or official endorsements.
- ISO 27001, SOC 2 and OWASP remain roadmap/reference frameworks and are not presented as completed audits or certifications.
- No fictional organisation is represented as an Akademate customer.
- No analytics or marketing tracker is present; a consent manager remains unnecessary until a non-essential purpose is introduced.

## Generated assets

- `akademate-hero-operations.jpg`
- `akademate-in-person-academy.jpg`
- `akademate-online-academy.jpg`
- `blog-ai-assisted-operations.jpg`
- `blog-hybrid-academy.jpg`

Fourteen images were generated independently for Akademate, contain no embedded text or UI, and were converted to production JPEG assets. Primary commercial pages and customer types use dedicated imagery.

## Local evidence

- TypeScript: pass.
- Vitest: 32/32.
- Cloudflare contact relay: 5/5 adversarial tests.
- Next production build: pass, 77 static/dynamic routes generated.
- Playwright adversarial suite: mobile, links/routes, blog 404, legal copy, consent fail-closed, tracker absence, console and network.
- Browser visual QA: 1440×1000 and 390×844; no document overflow, broken images or console errors.
- Live Playwright suite: 10/10 against the served production artifact.

Production is only considered updated after the deployed `/api/health` revision matches the commit SHA and the live pages pass independent visual/network verification.
