import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

async function createSupabaseClientFromCookies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies()
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}

export async function GET() {
  const supabase = await createSupabaseClientFromCookies()
  if (!supabase) {
    return NextResponse.json({ error: 'Server auth configuration is missing' }, { status: 500 })
  }

  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return the authenticated user's info directly
    return NextResponse.json(session.session.user)
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT() {
  const supabase = await createSupabaseClientFromCookies()
  if (!supabase) {
    return NextResponse.json({ error: 'Server auth configuration is missing' }, { status: 500 })
  }

  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Profile updates are not supported as there is no 'profiles' table
    return NextResponse.json({ error: 'Profile updates are not supported.' }, { status: 501 })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
