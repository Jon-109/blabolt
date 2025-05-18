import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Create a fallback client that won't crash the app
export const createClient = () => {
  try {
    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Initializing Supabase client with URL:', !!supabaseUrl);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables. Authentication will not work.')
      // Return a dummy client that won't crash but won't work either
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
          signOut: async () => ({ error: new Error('Supabase not configured') })
        }
      } as any
    }
    
    // Create the real client with direct configuration
    const client = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true, // Let supabase-js handle OAuth session in URL
      },
    })
    
    // Log successful client creation
    console.log('Supabase client created successfully');
    
    // Force refresh auth on client init
    setTimeout(async () => {
      const { data } = await client.auth.getSession();
      console.log('Initial auth check:', !!data.session);
    }, 100);
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    // Return a dummy client that won't crash but won't work either
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error }),
        signOut: async () => ({ error })
      }
    } as any
  }
}

// Use this in client components
export const supabase = createClient()
