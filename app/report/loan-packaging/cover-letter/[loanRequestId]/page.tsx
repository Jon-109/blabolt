import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { renderCoverLetterSvg } from '@/lib/loan-packaging/cover-letter-svg';

export const dynamic = 'force-dynamic';

async function getLoanRequest(loanRequestId: string, accessToken?: string) {
  if (!accessToken) {
    return null;
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const tokenClient = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );

  const { data: { user }, error } = await tokenClient.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }

  const { data } = await tokenClient
    .from('loan_requests')
    .select('id,user_id,business_name,loan_purpose,loan_amount,cover_letter_content')
    .eq('id', loanRequestId)
    .eq('user_id', user.id)
    .maybeSingle();

  return data ?? null;
}

export default async function CoverLetterPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ loanRequestId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { loanRequestId } = await params;
  const { token } = await searchParams;

  const loanRequest = await getLoanRequest(loanRequestId, token);
  if (!loanRequest || typeof loanRequest.cover_letter_content !== 'string' || loanRequest.cover_letter_content.trim().length === 0) {
    return notFound();
  }

  const svg = renderCoverLetterSvg({
    businessName:
      typeof loanRequest.business_name === 'string' && loanRequest.business_name.trim().length > 0
        ? loanRequest.business_name
        : 'Business Applicant',
    loanPurpose:
      typeof loanRequest.loan_purpose === 'string' && loanRequest.loan_purpose.trim().length > 0
        ? loanRequest.loan_purpose
        : 'Business Financing',
    loanAmount: typeof loanRequest.loan_amount === 'number' ? loanRequest.loan_amount : null,
    content: loanRequest.cover_letter_content,
  });

  return (
    <main style={{ margin: 0, background: '#f8fafc', padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          style={{
            width: '816px',
            maxWidth: '100%',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)',
            background: '#fff',
          }}
        />
      </div>
    </main>
  );
}
