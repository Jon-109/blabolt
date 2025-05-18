import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface ThankYouPageProps {
  // params is removed as this is not a dynamic route
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  // Ensure Supabase env vars are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not set.');
  }

  // Use only the get method for cookies in Server Components
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // set and remove should NOT be included in server components
      },
    }
  );
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect if there's an auth error or user is not found
  if (error || !user) {
    redirect('/login');
  }

  const firstName = user?.user_metadata?.first_name || null;
  const email = user?.email || null;
  const submissionIdValue = searchParams?.submissionId;
  const submissionId = Array.isArray(submissionIdValue) ? submissionIdValue[0] : submissionIdValue;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
        <CheckCircle className="text-green-500 w-20 h-20 mb-4" strokeWidth={1.5} />
        <h1 className="text-3xl font-bold mb-2">
          {firstName ? `Thanks, ${firstName}!` : 'Thanks!'}
        </h1>
        <h2 className="text-xl font-semibold mb-4 text-primary-blue">Reports on the way!</h2>
        {email ? (
          <p className="text-gray-700 mb-2">
            We’ve sent your PDFs to <span className="font-semibold">{email}</span>
          </p>
        ) : (
          <p className="text-gray-700 mb-2">We’re preparing your reports.</p>
        )}
        {submissionId && (
          <p className="text-gray-400 text-sm mb-4">Reference #{submissionId}</p>
        )}
        <Link
          href="/loan-services"
          className="mt-4 w-full inline-block bg-primary-blue text-white text-lg font-semibold py-3 px-6 rounded-lg hover:bg-primary-blue/90 transition-colors shadow"
        >
          Start Your Loan Package Now
        </Link>
        <Link
          href="/dashboard"
          className="mt-2 text-sm text-gray-500 hover:text-primary-blue underline"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
