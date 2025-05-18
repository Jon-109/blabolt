import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Upload the file
  const { data, error } = await supabase.storage.from(bucket).upload(filename, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new Error('Failed to upload PDF to Supabase Storage: ' + error.message);

  // Get the public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  if (!urlData?.publicUrl) throw new Error('Failed to get public URL for uploaded PDF');

  return urlData.publicUrl;
}
