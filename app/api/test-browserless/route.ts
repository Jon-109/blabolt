import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[test-browserless] Testing Browserless.io connection...');
    
    // Check if Browserless API key is available
    const browserlessApiKey = process.env.BROWSERLESS_API_KEY;
    if (!browserlessApiKey) {
      console.error('[test-browserless] BROWSERLESS_API_KEY environment variable is not set');
      return NextResponse.json({ 
        error: 'BROWSERLESS_API_KEY environment variable is not set',
        hasApiKey: false
      }, { status: 500 });
    }
    
    console.log('[test-browserless] API key found, testing connection...');
    
    // Test with a simple URL
    const testUrl = 'https://example.com';
    const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`;
    
    const requestBody = {
      url: testUrl,
      options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '24px', bottom: '24px', left: '16px', right: '16px' },
        waitUntil: 'networkidle0',
        timeout: 10000
      }
    };
    
    console.log('[test-browserless] Sending test request to Browserless...');
    
    const browserlessResponse = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`[test-browserless] Response status: ${browserlessResponse.status}`);
    console.log(`[test-browserless] Response headers:`, Object.fromEntries(browserlessResponse.headers.entries()));
    
    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error(`[test-browserless] Error response: ${errorText}`);
      return NextResponse.json({
        error: `Browserless test failed: ${browserlessResponse.status}`,
        details: errorText,
        hasApiKey: true,
        testUrl
      }, { status: 500 });
    }
    
    const pdfBuffer = await browserlessResponse.arrayBuffer();
    const pdfSize = pdfBuffer.byteLength;
    
    console.log(`[test-browserless] PDF generated successfully, size: ${pdfSize} bytes`);
    
    return NextResponse.json({
      status: 'success',
      message: 'Browserless.io connection successful',
      hasApiKey: true,
      testUrl,
      pdfSize,
      responseStatus: browserlessResponse.status
    });
    
  } catch (error: any) {
    console.error('[test-browserless] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to test Browserless connection',
      details: error.message,
      hasApiKey: !!process.env.BROWSERLESS_API_KEY
    }, { status: 500 });
  }
}
