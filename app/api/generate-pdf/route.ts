import { NextRequest, NextResponse } from 'next/server';
import { getCashFlowAnalysisById } from '@/lib/getCashFlowAnalysisById';
import { uploadPdfToSupabase } from '@/lib/uploadPdfToSupabase';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/supabase/helpers/server';
import { cookies as nextCookies } from 'next/headers';
import { generateAndStoreTemplatePdf } from '@/lib/templates/pdf';
import type { TemplateType } from '@/lib/templates/types';
import { TEMPLATE_REQUIREMENT_KEY_BY_TEMPLATE, type TemplateKey } from '@/lib/loan-packaging/constants';
import { createPdfRenderToken } from '@/lib/server/pdf-render-token';

export const runtime = 'nodejs';
const PDF_REQUEST_TIMEOUT_MS = 60000;
const PDF_PAGE_MARGIN = '10px';
const PDF_VIEWPORT = { width: 1440, height: 2200 };
const TEMPLATE_TYPES = new Set([
  'balance_sheet',
  'income_statement',
  'personal_financial_statement',
  'personal_debt_summary',
  'business_debt_summary',
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function getOrigin(req: NextRequest) {
  const configuredOrigin = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (forwardedProto && forwardedHost) {
    const forwardedOrigin = `${forwardedProto}://${forwardedHost}`;
    if (!forwardedOrigin.includes('localhost') && !forwardedOrigin.includes('127.0.0.1')) {
      return forwardedOrigin;
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const origin = req.nextUrl.origin;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    throw new Error(
      'Localhost is not reachable by Browserless. Set SITE_URL (or NEXT_PUBLIC_APP_URL) to a public tunnel URL (for example ngrok) and retry PDF generation.',
    );
  }

  return origin;
}

function getUserSupabase(accessToken: string) {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;

  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase client configuration is missing');
  }

  return createSupabaseClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  );
}

async function requireUser(accessToken: string) {
  const supabase = getUserSupabase(accessToken);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return { supabase, user, accessToken };
}

async function resolveAuthContext(accessToken: string | null) {
  if (accessToken) {
    return requireUser(accessToken);
  }

  const serverSupabase = createServerSupabase(await nextCookies());
  const { data, error } = await serverSupabase.auth.getSession();
  if (error || !data.session?.access_token || !data.session.user) {
    return null;
  }

  return requireUser(data.session.access_token);
}

function getBrowserlessApiKey() {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('PDF generation service is not configured');
  }
  return apiKey;
}

function getLegacyPrintUrl(req: NextRequest, analysisId: string, type: string) {
  const origin = getOrigin(req);
  const renderToken = createPdfRenderToken(analysisId, type as 'full' | 'summary');
  return `${origin}/report/print/${analysisId}/${type}?renderToken=${encodeURIComponent(renderToken)}`;
}

function getPrintWaitSelector(type: 'full' | 'summary') {
  return type === 'full' ? '#cash-flow-report-root' : '#business-debt-summary';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    if (isNonEmptyString(body.submissionId) && isNonEmptyString(body.templateType)) {
      return handleTemplatesPdfGeneration(req, body);
    }

    const analysisId = isNonEmptyString(body.analysisId) ? body.analysisId : null;
    const type = body.type === 'full' || body.type === 'summary' ? body.type : null;
    const accessToken = isNonEmptyString(body.accessToken) ? body.accessToken : null;
    const shouldDownload = body.download !== false;

    if (!analysisId || !type) {
      return NextResponse.json({ error: 'Missing analysisId, type, or accessToken' }, { status: 400 });
    }

    const authContext = await resolveAuthContext(accessToken);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysis = await getCashFlowAnalysisById(analysisId, authContext.supabase);
    if (!analysis) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const browserlessApiKey = getBrowserlessApiKey();
    const printUrl = getLegacyPrintUrl(req, analysisId, type);
    const pdfBuffer = await generatePdfBuffer(
      printUrl,
      browserlessApiKey,
      getPrintWaitSelector(type),
    );

    let pdfUrl: string | null = null;
    try {
      pdfUrl = await uploadPdfToSupabase(pdfBuffer, analysisId, type);
    } catch (uploadErr: unknown) {
      const message = uploadErr instanceof Error ? uploadErr.message : 'Unknown upload error';
      console.error('[generate-pdf] PDF upload error:', message);
    }

    try {
      if (pdfUrl) {
        const { createClient } = await import('@/supabase/helpers/server');
        const { cookies: nextCookies } = await import('next/headers');
        const supabase = createClient(await nextCookies());
        const updateData: Record<string, string> = {};

        if (type === 'full') {
          updateData.cash_flow_pdf_url = pdfUrl;
        } else {
          updateData.debt_summary_pdf_url = pdfUrl;
        }

        const { error: dbUpdateError } = await supabase
          .from('cash_flow_analyses')
          .update(updateData)
          .eq('id', analysisId);

        if (dbUpdateError) {
          console.error('[generate-pdf] Failed to update analysis PDF URL:', dbUpdateError.message);
        }
      }
    } catch (dbErr: unknown) {
      const message = dbErr instanceof Error ? dbErr.message : 'Unknown DB error';
      console.error('[generate-pdf] Failed to update analysis record:', message);
    }

    if (!shouldDownload) {
      if (!pdfUrl) {
        return NextResponse.json({ error: 'Failed to store generated PDF' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        pdfUrl,
      });
    }

    const filename =
      type === 'full'
        ? `CashFlowAnalysis-${analysis.loanInfo?.businessName?.replace(/\s+/g, '_') ?? 'Business'}.pdf`
        : `BusinessDebtSummary-${analysis.loanInfo?.businessName?.replace(/\s+/g, '_') ?? 'Business'}.pdf`;

    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-PDF-URL': pdfUrl || '',
      },
    });

    response.headers.set('Access-Control-Expose-Headers', 'X-PDF-URL');
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate-pdf] Overall PDF generation error:', message);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

async function generatePdfBuffer(
  printUrl: string,
  browserlessApiKey: string,
  selector: string,
) {
  const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`;
  const requestBody = {
    url: printUrl,
    emulateMediaType: 'screen',
    viewport: PDF_VIEWPORT,
    waitForSelector: {
      selector,
      timeout: 10_000,
    },
    waitForTimeout: 750,
    options: {
      format: 'A4',
      printBackground: true,
      margin: {
        top: PDF_PAGE_MARGIN,
        right: PDF_PAGE_MARGIN,
        bottom: PDF_PAGE_MARGIN,
        left: PDF_PAGE_MARGIN,
      },
    },
  };

  const browserlessResponse = await fetch(browserlessUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(PDF_REQUEST_TIMEOUT_MS),
  });

  if (!browserlessResponse.ok) {
    const errorText = await browserlessResponse.text();
    throw new Error(`Browserless PDF generation failed: ${browserlessResponse.status} - ${errorText}`);
  }

  return Buffer.from(await browserlessResponse.arrayBuffer());
}

async function handleTemplatesPdfGeneration(req: NextRequest, body: Record<string, unknown>) {
  const submissionId = isNonEmptyString(body.submissionId) ? body.submissionId : null;
  const templateType =
    isNonEmptyString(body.templateType) && TEMPLATE_TYPES.has(body.templateType)
      ? body.templateType
      : null;
  const accessToken = isNonEmptyString(body.accessToken) ? body.accessToken : null;
  const loanRequestId = isNonEmptyString(body.loanRequestId) ? body.loanRequestId : null;
  const requirementKey = isNonEmptyString(body.requirementKey) ? body.requirementKey : null;

  if (!submissionId || !templateType) {
    return NextResponse.json({ error: 'Missing submissionId or templateType' }, { status: 400 });
  }

  const authContext = await resolveAuthContext(accessToken);
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase service configuration is missing' }, { status: 500 });
  }

  const serviceSupabase = createSupabaseClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: submission, error: fetchError } = await serviceSupabase
    .from('template_submissions')
    .select('id,user_id,template_type')
    .eq('id', submissionId)
    .is('archived_at', null)
    .single();

  if (fetchError || !submission || submission.user_id !== authContext.user.id) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  if (submission.template_type !== templateType) {
    return NextResponse.json({ error: 'Template type mismatch' }, { status: 400 });
  }

  try {
    const result = await generateAndStoreTemplatePdf({
      req,
      admin: serviceSupabase,
      accessToken: authContext.accessToken,
      userId: authContext.user.id,
      submissionId,
      templateType: templateType as TemplateType,
      fileNamePrefix: `legacy-template-${templateType}`,
      bucket: 'pdfs',
    });

    await serviceSupabase
      .from('template_submissions')
      .update({ pdf_url: result.signedUrl })
      .eq('id', submissionId)
      .eq('user_id', authContext.user.id);

    if (loanRequestId) {
      const { data: loanRequest } = await serviceSupabase
        .from('loan_requests')
        .select('id,user_id,service_type')
        .eq('id', loanRequestId)
        .eq('user_id', authContext.user.id)
        .maybeSingle();

      if (loanRequest) {
        const resolvedRequirementKey =
          requirementKey ??
          TEMPLATE_REQUIREMENT_KEY_BY_TEMPLATE[templateType as TemplateKey] ??
          templateType;
        const nowIso = new Date().toISOString();

        await serviceSupabase.from('loan_request_documents').upsert(
          {
            loan_request_id: loanRequestId,
            user_id: authContext.user.id,
            requirement_key: resolvedRequirementKey,
            status: 'generated',
            source: 'template',
            file_path: result.filePath,
            mime_type: 'application/pdf',
            file_size_bytes: result.bytes,
            uploaded_at: nowIso,
            metadata: {
              bucket: 'pdfs',
              template_submission_id: submissionId,
              template_requirement_key: resolvedRequirementKey,
              template_key: templateType,
              generated_at: nowIso,
              original_file_name: `${templateType}.pdf`,
            },
          },
          {
            onConflict: 'loan_request_id,requirement_key',
          },
        );

        await serviceSupabase.from('generated_reports').insert({
          user_id: authContext.user.id,
          loan_request_id: loanRequestId,
          report_type: `${templateType}_pdf`,
          source_type: 'template',
          source_id: submissionId,
          file_path: result.filePath,
          mime_type: 'application/pdf',
          file_size_bytes: result.bytes,
          visibility: 'private',
        });

        await serviceSupabase
          .from('loan_requests')
          .update({ updated_at: nowIso })
          .eq('id', loanRequestId)
          .eq('user_id', authContext.user.id);
      }
    }

    return NextResponse.json({ pdfUrl: result.signedUrl || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create template PDF';
    console.error('[generate-pdf] Templates generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
