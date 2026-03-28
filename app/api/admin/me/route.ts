import { NextResponse } from 'next/server';
import { getAdminIdentityOrNull } from '@/lib/server/admin-access';

export const runtime = 'nodejs';

export async function GET() {
  const identity = await getAdminIdentityOrNull();

  return NextResponse.json({
    isAdmin: Boolean(identity),
    email: identity?.email ?? null,
  });
}
