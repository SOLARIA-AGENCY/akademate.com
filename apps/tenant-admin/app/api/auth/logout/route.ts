import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Clear any server-side cookies if present
    const cookieStore = await cookies()

    // Clear payload-token cookie if it exists
    cookieStore.delete('payload-token')

    // Clear any session cookies
    cookieStore.delete('cep_session')

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    )
  }
}
