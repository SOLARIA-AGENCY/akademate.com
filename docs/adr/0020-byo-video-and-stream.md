# 0020 - BYO videoconferencia + Stream VOD

- Status: Accepted
- Date: 2026-08-29
- Sources: Stream docs; RealtimeKit https://developers.cloudflare.com/realtime/realtimekit/ (2026-08-25)
- Context: Akademate no debe pagar seats Meet/Zoom/Teams de cada academia. El campus necesita VOD. Cloudflare RealtimeKit permite aulas en vivo pero no es V1.
- Decision:
  - Live V1: `VideoConferenceProvider` BYO (Google Meet, Zoom, Microsoft Teams) vía OAuth del tenant.
  - VOD: Cloudflare Stream + `VideoAsset` metadata en D1/Postgres. Signed playback. No blobs en SQL.
  - `AkademateLiveProvider` (RealtimeKit) = FUTURE sin cambiar `ClassSession`.
  - Join/leave → AttendanceEvidence; Akademate es la fuente académica.
- Consequences: Integraciones OAuth y cifrado de tokens. Metering Stream separado de Academy Finance.
