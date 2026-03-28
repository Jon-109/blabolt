import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

/**
 * Uploads a PDF buffer to Supabase Storage and returns the public URL.
 * @param pdfBuffer Buffer of the PDF file
 * @param analysisId ID of the analysis
 * @param type 'full' | 'summary'
 * @returns Public URL of the uploaded PDF
 */
export async function uploadPdfToSupabase(pdfBuffer: Buffer, analysisId: string, type: 'full' | 'summary') {
  // Use a unique filename for each PDF
  const filename = `${type === 'full' ? 'cash_flow' : 'debt_summary'}_${analysisId}_${randomUUID()}.pdf`;
  const bucket = 'pdfs';

  // Create a Supabase client using the service role key (server-side only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase storage configuration is missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Upload the file
  const { error } = await supabase.storage.from(bucket).upload(filename, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new Error('Failed to upload PDF to Supabase Storage: ' + error.message);

  if (process.env.PDF_URL_MODE === 'public') {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    if (!urlData?.publicUrl) throw new Error('Failed to get public URL for uploaded PDF');
    return urlData.publicUrl;
  }

  // Default to signed URLs to avoid exposing sensitive PDFs publicly.
  const { data: signedData, error: signedError } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(filename, 60 * 60 * 24 * 30);

  if (signedError || !signedData?.signedUrl) {
    throw new Error('Failed to create signed URL for uploaded PDF');
  }

  return signedData.signedUrl;
}
