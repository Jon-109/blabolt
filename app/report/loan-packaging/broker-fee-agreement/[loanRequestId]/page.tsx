import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { renderBrokerFeeAgreementSvg } from '@/lib/loan-packaging/broker-fee-agreement-svg';

export const dynamic = 'force-dynamic';

async function getAgreement(loanRequestId: string, accessToken?: string) {
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
    .from('broker_fee_agreements')
    .select('id,user_id,loan_request_id,status,business_name,signer_name,agreed_to_terms,signed_at')
    .eq('user_id', user.id)
    .eq('loan_request_id', loanRequestId)
    .maybeSingle();

  return data ?? null;
}

export default async function BrokerFeeAgreementPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ loanRequestId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { loanRequestId } = await params;
  const { token } = await searchParams;

  const agreement = await getAgreement(loanRequestId, token);
  if (
    !agreement ||
    typeof agreement.business_name !== 'string' ||
    agreement.business_name.trim().length === 0 ||
    typeof agreement.signer_name !== 'string' ||
    agreement.signer_name.trim().length === 0 ||
    !agreement.agreed_to_terms
  ) {
    return notFound();
  }

  const svg = renderBrokerFeeAgreementSvg({
    businessName: agreement.business_name,
    signerName: agreement.signer_name,
    signedAt: typeof agreement.signed_at === 'string' ? agreement.signed_at : null,
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
