import { NextRequest, NextResponse } from 'next/server';
import { getCashFlowAnalysisById } from '@/lib/getCashFlowAnalysisById';
import { uploadPdfToSupabase } from '@/lib/uploadPdfToSupabase';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Helper to get absolute URL for print route
function getPrintUrl(req: NextRequest, analysisId: string, type: string, accessToken?: string) {
  const origin = process.env.SITE_URL || req.headers.get('origin') || 'http://localhost:3000';
  let url = `${origin}/report/print/${analysisId}/${type}`;
  if (accessToken) {
    url += `?token=${encodeURIComponent(accessToken)}`;
  }
  console.log('[generate-pdf] Print page origin:', origin);
  console.log('[generate-pdf] Constructed print URL:', url);
  return url;
}

export async function POST(req: NextRequest) {
  console.log('[generate-pdf] POST handler initiated.');
  try {
    const body = await req.json();
    
    // Branch: Templates system
    if (body?.submissionId && body?.templateType) {
      return await handleTemplatesPdfGeneration(req, body);
    }
    
    // Legacy: Cash-flow analysis system
    const { analysisId, type, accessToken } = body;
    console.log(`[generate-pdf] Received analysisId: ${analysisId}, type: ${type}, accessToken: ${!!accessToken}`);

    if (!analysisId || !type || !accessToken) {
      console.error('[generate-pdf] Error: Missing analysisId, type, or accessToken.');
      return NextResponse.json({ error: 'Missing analysisId, type, or accessToken' }, { status: 400 });
    }

    // Create a Supabase client with the user's access token for RLS
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
    const supabase = createSupabaseClient(
      NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    console.log('[generate-pdf] Step 1: Fetching analysis...');
    const analysis = await getCashFlowAnalysisById(analysisId, supabase);
    if (!analysis) {
      console.error(`[generate-pdf] Error: Analysis not found for ID: ${analysisId}`);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.log('[generate-pdf] Step 1: Analysis fetched successfully.');

    console.log('[generate-pdf] Step 2: Preparing Browserless.io request...');
    const printUrl = getPrintUrl(req, analysisId, type, accessToken);
    console.log(`[generate-pdf] Using print URL: ${printUrl}`);

    // Check if Browserless API key is available
    const browserlessApiKey = process.env.BROWSERLESS_API_KEY;
    if (!browserlessApiKey) {
      console.error('[generate-pdf] Error: BROWSERLESS_API_KEY environment variable is not set');
      throw new Error('PDF generation service is not configured. Please contact support.');
    }

    // Use Browserless.io API to generate PDF
    console.log('[generate-pdf] Step 3: Sending request to Browserless.io...');
    const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`;
    console.log(`[generate-pdf] Browserless URL (without token): https://production-sfo.browserless.io/pdf`);
    
    const requestBody = {
      url: printUrl,
      options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '24px', bottom: '24px', left: '16px', right: '16px' },
        waitUntil: 'networkidle0',
        timeout: 30000
      }
    };
    console.log('[generate-pdf] Request body:', JSON.stringify(requestBody, null, 2));
    
    const browserlessResponse = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`[generate-pdf] Browserless response status: ${browserlessResponse.status}`);
    console.log(`[generate-pdf] Browserless response headers:`, Object.fromEntries(browserlessResponse.headers.entries()));

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error(`[generate-pdf] Browserless error response: ${errorText}`);
      throw new Error(`Browserless PDF generation failed: ${browserlessResponse.status} - ${errorText}`);
    }

    const pdfBuffer = Buffer.from(await browserlessResponse.arrayBuffer());
    console.log('[generate-pdf] Step 3: PDF generated successfully via Browserless.');

    console.log('[generate-pdf] Step 4: Uploading PDF to Supabase...');
    let pdfUrl: string | null = null;
    try {
      const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
      pdfUrl = await uploadPdfToSupabase(buffer, analysisId, type);
      console.log(`[generate-pdf] Step 4: PDF uploaded to Supabase. URL: ${pdfUrl}`);
    } catch (uploadErr: any) {
      console.error('[generate-pdf] PDF upload error:', uploadErr.message, uploadErr.stack);
      // Continue, but pdfUrl will be null. The main PDF generation succeeded.
    }

    console.log('[generate-pdf] Step 5: Updating database with PDF URL (if available)...');
    try {
      if (pdfUrl) {
        const { createClient } = await import('@/supabase/helpers/server');
        const { cookies: nextCookies } = await import('next/headers'); // Renamed to avoid conflict
        const supabase = createClient(await nextCookies());
        const updateData: any = {};
        if (type === 'full') updateData.cash_flow_pdf_url = pdfUrl;
        else updateData.debt_summary_pdf_url = pdfUrl;
        const { error: dbUpdateError } = await supabase
          .from('cash_flow_analyses')
          .update(updateData)
          .eq('id', analysisId);
        if (dbUpdateError) {
          console.error('[generate-pdf] DB update error:', dbUpdateError.message, dbUpdateError.details);
        } else {
          console.log('[generate-pdf] Step 5: Database updated successfully with PDF URL.');
        }
      } else {
        console.log('[generate-pdf] Step 5: No PDF URL to update in database (upload might have failed).');
      }
    } catch (dbErr: any) {
      console.error('[generate-pdf] Failed to update analysis record with PDF URL:', dbErr.message, dbErr.stack);
    }

    console.log('[generate-pdf] Step 6: Preparing PDF response...');
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
    console.log('[generate-pdf] PDF response prepared. Sending...');
    return response;
  } catch (err: any) {
    console.error('[generate-pdf] Overall PDF generation error:', err.message, err.stack);
    return NextResponse.json({ error: 'Failed to generate PDF', details: err?.message }, { status: 500 });
  }
}

// Handle PDF generation for templates system
async function handleTemplatesPdfGeneration(req: NextRequest, body: any) {
  const { submissionId, templateType } = body;
  console.log(`[generate-pdf] Templates: submissionId: ${submissionId}, templateType: ${templateType}`);

  // Create Supabase client using service role for server-side operations
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const supabase = createSupabaseClient(
    NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Verify submission exists and get user_id for RLS check
  const { data: submission, error: fetchError } = await supabase
    .from('template_submissions')
    .select('id,user_id,template_type')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    console.error('[generate-pdf] Templates: Submission not found:', fetchError);
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  if (submission.template_type !== templateType) {
    console.error('[generate-pdf] Templates: Template type mismatch');
    return NextResponse.json({ error: 'Template type mismatch' }, { status: 400 });
  }

  // Build print URL
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || req.headers.get('origin') || 'http://localhost:3000';
  const printUrl = `${origin}/report/template/${submissionId}/${templateType}`;
  console.log(`[generate-pdf] Templates: Print URL: ${printUrl}`);

  // Check if Browserless API key is available
  const browserlessApiKey = process.env.BROWSERLESS_API_KEY;
  if (!browserlessApiKey) {
    console.error('[generate-pdf] Templates: BROWSERLESS_API_KEY environment variable is not set');
    return NextResponse.json({ error: 'PDF generation service is not configured. Please contact support.' }, { status: 500 });
  }

  // Generate PDF using Browserless
  console.log('[generate-pdf] Templates: Generating PDF via Browserless...');
  const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`;
  
  const requestBody = {
    url: printUrl,
    options: {
      format: 'A4',
      printBackground: true,
      margin: { top: '24px', bottom: '24px', left: '16px', right: '16px' },
      waitUntil: 'networkidle0',
      timeout: 30000
    }
  };
  console.log('[generate-pdf] Templates: Request body:', JSON.stringify(requestBody, null, 2));
  
  const browserlessResponse = await fetch(browserlessUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  console.log(`[generate-pdf] Templates: Browserless response status: ${browserlessResponse.status}`);

  if (!browserlessResponse.ok) {
    const errorText = await browserlessResponse.text();
    console.error('[generate-pdf] Templates: Browserless error:', errorText);
    throw new Error(`Browserless PDF generation failed: ${browserlessResponse.status} - ${errorText}`);
  }

  const pdfBuffer = Buffer.from(await browserlessResponse.arrayBuffer());
  console.log('[generate-pdf] Templates: PDF generated successfully');

  // Upload to Supabase Storage
  console.log('[generate-pdf] Templates: Uploading to Supabase Storage...');
  const filename = `template_${templateType}_${submissionId}_${randomUUID()}.pdf`;
  const { data: uploaded, error: uploadErr } = await supabase.storage
    .from('pdfs')
    .upload(filename, pdfBuffer, { contentType: 'application/pdf', upsert: false });

  if (uploadErr) {
    console.error('[generate-pdf] Templates: Upload error:', uploadErr);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  // Create signed URL
  const { data: signed } = await supabase
    .storage
    .from('pdfs')
    .createSignedUrl(uploaded.path, 60 * 60 * 24 * 7); // 7 days

  const pdfUrl = signed?.signedUrl || null;
  console.log(`[generate-pdf] Templates: PDF uploaded, signed URL: ${pdfUrl}`);

  // Return JSON response with PDF URL (different from legacy cash-flow which returns the PDF buffer)
  return NextResponse.json({ pdfUrl });
}
