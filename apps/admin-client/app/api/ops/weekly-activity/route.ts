import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getWeekBounds(date: Date): { monday: Date; sunday: Date } {
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() + diffToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { monday, sunday }
}

async function countByDayOfWeek(
  table: string,
  monday: Date,
  sunday: Date,
): Promise<number[]> {
  const db = getDb()
  const counts = [0, 0, 0, 0, 0, 0, 0]

  try {
    const result = await db.query(
      `SELECT created_at FROM ${table}
       WHERE created_at >= $1 AND created_at <= $2`,
      [monday.toISOString(), sunday.toISOString()],
    )

    for (const row of result.rows) {
      const created = new Date(row.created_at)
      const jsDay = created.getDay()
      const idx = jsDay === 0 ? 6 : jsDay - 1
      if (idx >= 0 && idx <= 6) counts[idx] = (counts[idx] ?? 0) + 1
    }
  } catch {
    // table may not exist, return zeros
  }

  return counts
}

export async function GET() {
  const now = new Date()
  const { monday, sunday } = getWeekBounds(now)

  const [tenants, users] = await Promise.all([
    countByDayOfWeek('tenants', monday, sunday),
    countByDayOfWeek('users', monday, sunday),
  ])

  const total = tenants.map((t, i) => t + (users[i] ?? 0))

  return NextResponse.json({
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    tenants,
    users,
    total,
  })
}
