import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default {
  ...defineCloudflareConfig(),
  // The repo has a bun.lock, so OpenNext otherwise tries `bun run build`.
  buildCommand: 'pnpm exec next build',
}
