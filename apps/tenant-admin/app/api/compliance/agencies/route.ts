import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'placement-agencies',
    where: { published: { equals: true } },
    limit: 20,
    overrideAccess: true,
  })

  return NextResponse.json({
    success: true,
    data: result.docs.map((doc) => ({
      title: doc.title,
      slug: doc.public_slug,
      email: doc.email,
      hoursLabel: doc.hours_label,
      authorizationCode: doc.authorization_code,
      campusLabel: doc.campus_label,
      legalBlocks: doc.legal_blocks,
    })),
  })
}
