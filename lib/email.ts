import 'server-only';

import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Email service is not configured');
  }

  resendClient ??= new Resend(apiKey);
  return resendClient;
}

export function getEmailConfig() {
  return {
    from: process.env.EMAIL_FROM || 'Business Lending Advocate <onboarding@resend.dev>',
    internalTo: process.env.EMAIL_INTERNAL_TO || 'jonathan@businesslendingadvocate.com',
    replyTo: process.env.EMAIL_REPLY_TO || 'jonathan@businesslendingadvocate.com',
  };
}

export function getPublicSiteUrl(): string {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, '');
}

export function createUnsubscribeToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
