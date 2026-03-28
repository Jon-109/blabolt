import { createHmac, timingSafeEqual } from 'crypto';

type PdfRenderTokenPayload = {
  analysisId: string;
  type: 'full' | 'summary';
  exp: number;
};

function getRenderSecret(): string {
  const secret =
    process.env.PDF_RENDER_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error('PDF render token secret is missing');
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string): string {
  return createHmac('sha256', getRenderSecret()).update(value).digest('base64url');
}

export function createPdfRenderToken(
  analysisId: string,
  type: 'full' | 'summary',
  ttlMs = 5 * 60 * 1000,
): string {
  const payload: PdfRenderTokenPayload = {
    analysisId,
    type,
    exp: Date.now() + ttlMs,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyPdfRenderToken(token: string | null | undefined): PdfRenderTokenPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as PdfRenderTokenPayload;
    if (!payload.analysisId || (payload.type !== 'full' && payload.type !== 'summary')) {
      return null;
    }
    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
