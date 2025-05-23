import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';



import { getCashFlowAnalysisById } from '@/lib/getCashFlowAnalysisById';
import { uploadPdfToSupabase } from '@/lib/uploadPdfToSupabase';

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

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('[generate-pdf] POST handler initiated.');
  try {
    const { analysisId, type, accessToken } = await req.json();
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

    // Puppeteer v22+ launch
    const browser = await puppeteer.launch({
      headless: true, // 'new' is not in type definition; use true for compatibility
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    console.log('[generate-pdf] Step 2: Puppeteer launched, new page created.');


    const printUrl = getPrintUrl(req, analysisId, type, accessToken);
    console.log(`[generate-pdf] Navigating to print URL: ${printUrl}`);

    // --- Set user's cookies in Puppeteer so print page has session ---
    console.log('[generate-pdf] Setting cookies for Puppeteer...');
    const cookiesArr = req.cookies.getAll().map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: new URL(printUrl).hostname, // Use dynamic domain from origin
      path: '/',
      httpOnly: false, 
      secure: new URL(printUrl).protocol === 'https:', // Secure if origin is https
      sameSite: 'Lax' as 'Lax',
    }));
    if (cookiesArr.length > 0) {
      await page.setCookie(...cookiesArr);
      console.log('[generate-pdf] Cookies set for Puppeteer:', cookiesArr.map(c => c.name));
    } else {
      console.log('[generate-pdf] No cookies to set for Puppeteer.');
    }

    console.log('[generate-pdf] Going to print page with networkidle0...');
    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30000 }); // Increased timeout
    console.log('[generate-pdf] Navigation to print page successful.');

    console.log('[generate-pdf] Step 3: Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: { top: '24px', bottom: '24px', left: '16px', right: '16px' }, // Ensure units
    });
    console.log('[generate-pdf] Step 3: PDF generated successfully.');
    await browser.close();
    console.log('[generate-pdf] Puppeteer browser closed.');

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
