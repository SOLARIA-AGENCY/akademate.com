import { NextResponse } from 'next/server'
import os from 'os'

export const dynamic = 'force-dynamic'

// Cache for server info — refresh at most once every 5 minutes
let serverInfoCache: {
  name: string
  ip: string
  type: string
  datacenter: string
  status: string
} | null = null
let serverInfoCachedAt = 0
const SERVER_INFO_TTL_MS = 5 * 60 * 1000

async function getHetznerServerInfo() {
  const token = process.env.HETZNER_API_TOKEN
  const serverId = process.env.HETZNER_SERVER_ID
  if (!token || !serverId) return null

  const now = Date.now()
  if (serverInfoCache && now - serverInfoCachedAt < SERVER_INFO_TTL_MS) {
    return serverInfoCache
  }

  try {
    const res = await fetch(`https://api.hetzner.cloud/v1/servers/${serverId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const server = data?.server
    if (!server) return null
    serverInfoCache = {
      name: server.name ?? 'akademate-prod',
      ip: server.public_net?.ipv4?.ip ?? '46.62.222.138',
      type: server.server_type?.name ?? 'cx23',
      datacenter: server.datacenter?.name ?? 'fsn1',
      status: server.status ?? 'running',
    }
    serverInfoCachedAt = now
    return serverInfoCache
  } catch {
    return null
  }
}

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const cpus1 = os.cpus()
    setTimeout(() => {
      const cpus2 = os.cpus()
      let idle = 0
      let total = 0
      for (let i = 0; i < cpus1.length; i++) {
        const c1 = cpus1[i]!.times
        const c2 = cpus2[i]!.times
        const idleDiff = c2.idle - c1.idle
        const totalDiff =
          (c2.user - c1.user) +
          (c2.nice - c1.nice) +
          (c2.sys - c1.sys) +
          (c2.idle - c1.idle) +
          (c2.irq - c1.irq)
        idle += idleDiff
        total += totalDiff
      }
      const usagePercent = total > 0 ? Math.round(100 - (idle / total) * 100) : 0
      resolve(usagePercent)
    }, 200)
  })
}

async function getHetznerMetrics() {
  const token = process.env.HETZNER_API_TOKEN
  const serverId = process.env.HETZNER_SERVER_ID
  if (!token || !serverId) return null

  try {
    const end = new Date().toISOString()
    const start = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const url = `https://api.hetzner.cloud/v1/servers/${serverId}/metrics?type=cpu,disk,network&start=${start}&end=${end}&step=60`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    // Extract latest values
    const metrics = data?.metrics?.time_series
    const getLatest = (series: { values?: [number, string][] } | undefined) => {
      if (!series?.values?.length) return null
      const last = series.values[series.values.length - 1]
      if (!last) return null
      return Math.round(parseFloat(last[1]))
    }
    return {
      cpu: getLatest(metrics?.['cpu']),
      diskRead: getLatest(metrics?.['disk.0.iops.read']),
      diskWrite: getLatest(metrics?.['disk.0.iops.write']),
      networkIn: getLatest(metrics?.['network.0.bandwidth.in']),
      networkOut: getLatest(metrics?.['network.0.bandwidth.out']),
    }
  } catch {
    return null
  }
}

export async function GET() {
  const [cpuUsage, hetznerMetrics] = await Promise.all([
    getCpuUsage(),
    getHetznerMetrics(),
  ])
  const serverInfo = await getHetznerServerInfo()

  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory
  const memoryPercent = Math.round((usedMemory / totalMemory) * 100)

  const uptimeSeconds = os.uptime()
  const uptimeDays = Math.floor(uptimeSeconds / 86400)
  const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600)

  return NextResponse.json({
    cpu: hetznerMetrics?.cpu ?? cpuUsage,
    memory: {
      used: Math.round(usedMemory / 1024 / 1024),
      total: Math.round(totalMemory / 1024 / 1024),
      percent: memoryPercent,
    },
    uptime: {
      seconds: uptimeSeconds,
      display: `${uptimeDays}d ${uptimeHours}h`,
    },
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    hetzner: hetznerMetrics,
    source: hetznerMetrics ? 'hetzner' : 'system',
    serverInfo,
  })
}
