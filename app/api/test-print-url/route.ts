import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { printUrl } = body;
    
    if (!printUrl) {
      return NextResponse.json({ error: 'Missing printUrl' }, { status: 400 });
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
    
  } catch (error: any) {
    console.error('[test-print-url] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to test print URL',
      details: error.message 
    }, { status: 500 });
  }
}
