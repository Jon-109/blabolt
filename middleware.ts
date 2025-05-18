// Completely disabled middleware to fix bootstrap script issues
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Always bypass middleware completely
  return NextResponse.next()
}

// Empty matcher to prevent middleware from running on any routes
export const config = {
  matcher: []
}
