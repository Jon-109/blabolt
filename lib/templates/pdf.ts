import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TemplateType } from './types';

const PDF_REQUEST_TIMEOUT_MS = 60_000;

function getOrigin(req: NextRequest): string {
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

function getBrowserlessApiKey(): string {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('PDF generation service is not configured');
  }

  return apiKey;
}

async function generatePdfBuffer(printUrl: string): Promise<Buffer> {
  const browserlessApiKey = getBrowserlessApiKey();
  const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`;
  const requestBody = {
    url: printUrl,
    options: {
      format: 'A4',
      printBackground: true,
      margin: { top: '24px', bottom: '24px', left: '16px', right: '16px' },
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

interface GenerateTemplatePdfParams {
  req: NextRequest;
  admin: SupabaseClient;
  accessToken: string;
  userId: string;
  submissionId: string;
  templateType: TemplateType;
  fileNamePrefix?: string;
  bucket?: string;
}

export interface GeneratedTemplatePdfResult {
  filePath: string;
  signedUrl: string | null;
  bytes: number;
}

export async function generateAndStoreTemplatePdf({
  req,
  admin,
  accessToken,
  userId,
  submissionId,
  templateType,
  fileNamePrefix = 'template',
  bucket = 'pdfs',
}: GenerateTemplatePdfParams): Promise<GeneratedTemplatePdfResult> {
  const origin = getOrigin(req);
  const printUrl = `${origin}/report/template/${submissionId}/${templateType}?token=${encodeURIComponent(accessToken)}`;
  const pdfBuffer = await generatePdfBuffer(printUrl);

  const sanitizedPrefix = fileNamePrefix
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'template';

  const filePath = `${userId}/templates/${templateType}/${sanitizedPrefix}-${randomUUID()}.pdf`;

  const { error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) {
    throw new Error(uploadErr.message);
  }

  const { data: signed, error: signedUrlError } = await admin.storage
    .from(bucket)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (signedUrlError) {
    throw new Error(signedUrlError.message);
  }

  return {
    filePath,
    signedUrl: signed?.signedUrl ?? null,
    bytes: pdfBuffer.length,
  };
}
