/** lib/templates/fetch.ts */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { TemplateSubmission, TemplateType } from './types';

/**
 * Fetch template submissions for the current user
 */
export async function fetchUserTemplateSubmissions(
  templateType?: TemplateType
): Promise<TemplateSubmission[]> {
  const supabase = createClientComponentClient();
  
  let query = supabase
    .from('template_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (templateType) {
    query = query.eq('template_type', templateType);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching template submissions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a specific template submission by ID
 */
export async function fetchTemplateSubmission(
  submissionId: string
): Promise<TemplateSubmission | null> {
  const supabase = createClientComponentClient();
  
  const { data, error } = await supabase
    .from('template_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching template submission:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new template submission
 */
export async function createTemplateSubmission(
  templateType: TemplateType,
  formData: any
): Promise<TemplateSubmission> {
  const supabase = createClientComponentClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('template_submissions')
    .insert({
      user_id: user.id,
      template_type: templateType,
      form_data: formData
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating template submission:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing template submission
 */
export async function updateTemplateSubmission(
  submissionId: string,
  formData: any,
  pdfUrl?: string | null
): Promise<TemplateSubmission> {
  const supabase = createClientComponentClient();
  
  const updateData: any = { form_data: formData };
  if (pdfUrl !== undefined) {
    updateData.pdf_url = pdfUrl;
  }

  const { data, error } = await supabase
    .from('template_submissions')
    .update(updateData)
    .eq('id', submissionId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating template submission:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a template submission
 */
export async function deleteTemplateSubmission(submissionId: string): Promise<void> {
  const supabase = createClientComponentClient();
  
  const { error } = await supabase
    .from('template_submissions')
    .delete()
    .eq('id', submissionId);

  if (error) {
    console.error('Error deleting template submission:', error);
    throw error;
  }
}
