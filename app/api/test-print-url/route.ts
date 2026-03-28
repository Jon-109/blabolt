import { NextRequest, NextResponse } from 'next/server';

function denyOutsideDevelopment() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

function isAllowedPrintUrl(printUrl: string, req: NextRequest) {
  try {
    const parsed = new URL(printUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const allowedHosts = new Set<string>();
    const candidates = [
      process.env.SITE_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      req.nextUrl.origin,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        allowedHosts.add(new URL(candidate).host);
      } catch {
        // Ignore malformed candidate values.
      }
    }

    return allowedHosts.has(parsed.host);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const devOnlyResponse = denyOutsideDevelopment();
  if (devOnlyResponse) {
    return devOnlyResponse;
  }

  try {
    const body = await req.json();
    const { printUrl } = body;
    
    if (!printUrl) {
      return NextResponse.json({ error: 'Missing printUrl' }, { status: 400 });
    }

    if (!isAllowedPrintUrl(printUrl, req)) {
      return NextResponse.json(
        { error: 'printUrl must match an allowed app origin' },
        { status: 400 }
      );
    }

    console.log(`[test-print-url] Testing URL: ${printUrl}`);
    
    // Test if the print URL is accessible
    const response = await fetch(printUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Test-Bot/1.0)'
      }
    });
    
    console.log(`[test-print-url] Response status: ${response.status}`);
    console.log(`[test-print-url] Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[test-print-url] Error response: ${errorText}`);
      return NextResponse.json({ 
        error: `Print URL returned ${response.status}`,
        details: errorText.substring(0, 500) // Limit error text length
      }, { status: 500 });
    }
    
    const html = await response.text();
    const htmlLength = html.length;
    const hasContent = html.includes('</html>') && htmlLength > 1000; // Basic check for valid HTML
    
    console.log(`[test-print-url] HTML length: ${htmlLength}`);
    console.log(`[test-print-url] Has valid content: ${hasContent}`);
    
    return NextResponse.json({
      status: 'success',
      printUrl,
      responseStatus: response.status,
      htmlLength,
      hasContent,
      preview: html.substring(0, 200) // First 200 chars for debugging
    });
    
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('[test-print-url] Error:', details);
    return NextResponse.json({ 
      error: 'Failed to test print URL',
      details
    }, { status: 500 });
  }
}
