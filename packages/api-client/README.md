# @akademate/api-client

SDK multitenant para consumir la API/Collections de Payload y rutas Next. Maneja resolución de tenant por dominio y adjunta claims/headers comunes.

## Objetivos
- Resolver `tenantId` a partir del host o de tokens emitidos por Payload.
- Ofrecer helpers para listados y mutaciones con paginación y depth.
- Preparar ganchos para invalidación/revalidación en frontends.
