# IMAGE-PROMPTS: regeneración de assets (pipeline de imagen)

Prompts listos para el generador de imagen (mismo estilo que el resto de assets del repo: foto natural 1536×1024 landscape, luz de día, paleta Akademate azules/blancos, look real-photo, SIN texto ni watermarks ni logos). Entregable de la decisión "sí, generar" (2026-09-07). Nota de capacidad: ZCode en este entorno no genera imágenes; ejecutar en el pipeline habitual y soltar los archivos en `apps/web/public/images/marketing/`.

## PRIORIDAD 1 — Redo autoescuela (reemplaza `akademate-driving-school.jpg`, defectuosa: retrovisor flotante, geometría furgoneta/sedán inconsistente, mano deformada)

**Prompt (EN):**
> Photorealistic wide landscape photo, driving school lesson: a calm female driving instructor in her 30s sits in the front passenger seat of a modern white compact car with dual controls, giving guidance to a young male student driver (19-20) holding the steering wheel with both hands, both wearing seatbelts. Shot from the open rear-left door angle, showing the full side profile of ONE consistent modern hatchback car with clean, correct car body geometry, properly attached side mirror and door panels. European city street softly blurred in the background, morning daylight, natural colors, navy and white tones. Real photo look, sharp focus on the two people, no text, no logos, no watermarks, no roof sign.

**Checklist de QA antes de subir:** una sola geometría de coche coherente · retrovisor y puerta bien unidos al cuerpo · manos de 5 dedos correctas · sin texto/marcas · 1536×1024 · nombre exacto `akademate-driving-school-v2.jpg` y actualizar las 3 referencias en `lib/marketing-content.ts` + `lib/vertical-experience-content.ts` (o mantener filename viejo si se prefiere zero-diff, pero -v2 respeta la convención del repo).

## Prioridad 2 — Las 7 del plan web (WEB-ALIGNMENT-PLAN §4, aprobadas)

1. `akademate-access-nfc-tap-v1.jpg` — close-up: hand holding smartphone mid-tap on a black wall-mounted access reader beside a glass pedestrian gate of a modern gym/academy entrance, reader glowing green ring, shallow depth of field, cool blue daylight (composición hero de Kisi).
2. `akademate-access-qr-checkin-v1.jpg` — student at a studio door scanning a wall tablet/reader with their phone QR, subtle "checked-in" green tick on the tablet screen UI only, bright reception ambience.
3. `akademate-signage-reception-v1.jpg` — academy reception wall screen showing today's class schedule grid and a QR code corner, clean modern interior, blurred people walking (composición ScreenCloud).
4. `akademate-ai-sidebar-agent-v1.png` — UI render 1586×992: Akademate dashboard with a right-side chat panel; the assistant answers with a cited data chip (" attendance 92% this month"), product-mock style matching `akademate-*-v2.png` renders (patrón Fin/ClickUp; label on-page: "Illustrative product example").
5. `akademate-ai-mcp-byo-v1.png` — clean product diagram: client's ChatGPT/Claude window ↔ MCP layer ↔ Akademate modules, flat brand-blue diagram style, no third-party logos (use generic labels "ChatGPT" / "Claude" as plain text allowed here only as text labels).
6. `akademate-growth-landing-v1.png` — UI render: split view, left a campaign landing page builder preview, right a UTM attribution table; brand-consistent dashboard style.
7. `akademate-solo-studio-owner-v1.jpg` — warm photo: solo studio owner (woman 35-45) at reception with a tablet, small single-room studio behind her, inviting light (solo si se reabre la card Solo en web; hoy Solo es interno).

## Regla común

Generar en 1536×1024 (jpg foto) o 1586×992 (png UI) · nombres kebab-case `akademate-<tema>-v1` · sin texto dentro de la imagen salvo UI-mock etiquetada · revisión humana de anatomía/geometría antes de subir (la autoescuela v1 falló justo ahí).
