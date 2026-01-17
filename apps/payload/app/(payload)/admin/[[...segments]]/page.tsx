/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import AdminStub from './AdminStub'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  if (!process.env.DATABASE_URL) {
    return { title: 'Login - Payload' }
  }

  return generatePageMetadata({ config, params, searchParams })
}

const Page = async ({ params, searchParams }: Args) => {
  if (!process.env.DATABASE_URL) {
    const resolvedParams = await params
    return <AdminStub segments={resolvedParams.segments ?? []} />
  }

  return RootPage({ config, params, searchParams, importMap })
}

export default Page
