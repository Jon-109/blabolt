import { NextRequest, NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';

interface ApiUserContext {
  accessToken: string;
  user: User;
}

interface ApiUserFailure {
  response: NextResponse;
}

export async function requireApiUser(req: NextRequest): Promise<ApiUserContext | ApiUserFailure> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      response: NextResponse.json({ error: 'Missing bearer token' }, { status: 401 }),
    };
  }

  const accessToken = authHeader.split(' ')[1]?.trim();
  if (!accessToken) {
    return {
      response: NextResponse.json({ error: 'Invalid bearer token' }, { status: 401 }),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      response: NextResponse.json({ error: 'Supabase authentication configuration is missing' }, { status: 500 }),
    };
  }

  const tokenClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data, error } = await tokenClient.auth.getUser(accessToken);

  if (error || !data.user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    accessToken,
    user: data.user,
  };
}

export function isApiUserFailure(
  value: ApiUserContext | ApiUserFailure,
): value is ApiUserFailure {
  return 'response' in value;
}
