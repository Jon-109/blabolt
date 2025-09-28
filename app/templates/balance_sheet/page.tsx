 'use client';

 import { useEffect, useRef, useState } from 'react';
 import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
 import { useRouter, usePathname } from 'next/navigation';
import type { BalanceSheetData } from '@/lib/templates/types';
import { BalanceSheetSchema } from '@/lib/templates/validate';
import { checkUserTemplateAccess } from '@/lib/templates/access';
import { Input } from '@/app/(components)/ui/input';
import { Textarea } from '@/app/(components)/ui/textarea';
import { FormField } from '@/app/(components)/templates/shared/FormField';
import { FormSection } from '@/app/(components)/templates/shared/FormSection';

export default function BalanceSheetFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [form, setForm] = useState<BalanceSheetData>({
    asOfDate: new Date().toISOString().split('T')[0] as string, // Default to today
    assets: { 
      cash: 0,
      accountsReceivable: undefined,
      inventory: undefined,
      otherCurrentAssets: undefined,
      fixedAssets: undefined,
      accumulatedDepreciation: undefined,
      otherAssets: undefined
    },
    liabilities: {
      accountsPayable: undefined,
      creditCards: undefined,
      shortTermLoans: undefined,
      longTermDebt: undefined,
      otherLiabilities: undefined
    },
    equity: {
      ownersEquity: undefined,
      retainedEarnings: undefined
    },
    notes: ''
  });

  // Check authentication and access on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
        return;
      }
      
      const access = await checkUserTemplateAccess(user.id, 'balance_sheet');
      if (!access.allowed) {
        if (access.redirectUrl) {
          router.push(access.redirectUrl);
        }
        return;
      }
      
      setUser(user);
    };
    
    checkAuth();
  }, [router, supabase.auth]);

  // Autosave every 2s after edit
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveDraft, 2000);
  };

  const saveDraft = async () => {
    if (!user) return;
    
    setSaveStatus('saving');
    try {
      if (!submissionId) {
        const { data, error } = await supabase
          .from('template_submissions')
          .insert({
            user_id: user.id,
            template_type: 'balance_sheet',
            form_data: form
          })
          .select('id,pdf_url')
          .single();
          
        if (error) throw error;
        
        if (data) {
          setSubmissionId(data.id);
          setPdfUrl(data.pdf_url);
        }
      } else {
        const { error } = await supabase
          .from('template_submissions')
          .update({ form_data: form })
          .eq('id', submissionId);
          
        if (error) throw error;
      }
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const validateForm = () => {
    try {
      BalanceSheetSchema.parse(form);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const onGenerate = async () => {
    if (!validateForm()) {
      alert('Please fix the validation errors before generating PDF.');
      return;
    }

    setLoading(true);
    try {
      // Ensure saved first
      if (!submissionId) {
        await saveDraft();
      }

      if (!submissionId) {
        throw new Error('Failed to save submission');
      }

      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId: submissionId,
          templateType: 'balance_sheet'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }
      
      const json = await res.json();
      setPdfUrl(json.pdfUrl);

      // Update the submission with PDF URL
      if (json.pdfUrl) {
        await supabase
          .from('template_submissions')
          .update({ pdf_url: json.pdfUrl })
          .eq('id', submissionId);
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (path: string, value: any) => {
    const keys = path.split('.');
    setForm(prev => {
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key) {
          current[key] = { ...current[key] };
          current = current[key];
        }
      }
      
      const lastKey = keys[keys.length - 1];
      if (lastKey) {
        current[lastKey] = value === '' ? undefined : value;
      }
      return updated;
    });
    queueSave();
  };

  if (!user) {
    return <div className="max-w-3xl mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="border-b pb-6">
        <h1 className="text-3xl font-bold mb-2">Balance Sheet</h1>
        <p className="text-neutral-600">
          Enter your business financial data to generate a professional balance sheet PDF.
        </p>
        <div className="mt-3 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              saveStatus === 'saving' ? 'bg-yellow-500' :
              saveStatus === 'saved' ? 'bg-green-500' :
              saveStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-neutral-600">
              {saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved' ? 'Saved' :
               saveStatus === 'error' ? 'Save failed' : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-8">
        <div className="space-y-4">
          <FormField
            label="As of Date"
            required
            labelHint="Snapshot date"
            help="Pick the date this balance sheet represents (usually today or the end of the month)."
            error={errors['asOfDate']}
          >
            <Input
              type="date"
              value={form.asOfDate}
              onChange={(e) => updateForm('asOfDate', e.target.value)}
            />
          </FormField>
        </div>

        <FormSection
          title="Assets"
          description="What the business owns. Use cost values where applicable."
        >
          <FormField
            label="Cash"
            required
            help="Money in checking/savings as of the selected date."
            error={errors['assets.cash']}
          >
            <Input
              type="number"
              step="0.01"
              value={form.assets.cash || ''}
              onChange={(e) => updateForm('assets.cash', Number(e.target.value) || 0)}
            />
          </FormField>

          <FormField
            label="Accounts Receivable"
            help="Unpaid customer invoices you expect to collect soon."
          >
            <Input
              type="number"
              step="0.01"
              value={form.assets.accountsReceivable || ''}
              onChange={(e) =>
                updateForm('assets.accountsReceivable', Number(e.target.value) || undefined)
              }
            />
          </FormField>

          <FormField
            label="Inventory"
            help="Cost value of items held for sale or use."
          >
            <Input
              type="number"
              step="0.01"
              value={form.assets.inventory || ''}
              onChange={(e) => updateForm('assets.inventory', Number(e.target.value) || undefined)}
            />
          </FormField>

          <FormField
            label="Other Current Assets"
            help="Short-term assets convertible to cash within 12 months."
          >
            <Input
              type="number"
              step="0.01"
              value={form.assets.otherCurrentAssets || ''}
              onChange={(e) =>
                updateForm('assets.otherCurrentAssets', Number(e.target.value) || undefined)
              }
            />
          </FormField>

          <FormField
            label="Fixed Assets"
            help="Long-term assets like equipment or property at purchase cost."
          >
            <Input
              type="number"
              step="0.01"
              value={form.assets.fixedAssets || ''}
              onChange={(e) => updateForm('assets.fixedAssets', Number(e.target.value) || undefined)}
            />
          </FormField>

          <FormField
            label="Accumulated Depreciation"
            help="Total depreciation taken on fixed assets (enter as a positive number)."
          >
            <Input
              type="number"
              step="0.01"
              value={form.assets.accumulatedDepreciation || ''}
              onChange={(e) =>
                updateForm('assets.accumulatedDepreciation', Number(e.target.value) || undefined)
              }
            />
          </FormField>

          <FormField
            label="Other Assets"
            help="Any long-term assets not listed above."
          >
            <Input
              type="number"
              step="0.01"
              value={form.assets.otherAssets || ''}
              onChange={(e) => updateForm('assets.otherAssets', Number(e.target.value) || undefined)}
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Liabilities"
          description="What the business owes."
        >
          <FormField
            label="Accounts Payable"
            help="Bills you owe to vendors/suppliers that are not yet paid."
          >
            <Input
              type="number"
              step="0.01"
              value={form.liabilities.accountsPayable || ''}
              onChange={(e) =>
                updateForm('liabilities.accountsPayable', Number(e.target.value) || undefined)
              }
            />
          </FormField>

          <FormField
            label="Credit Cards"
            help="Outstanding balances on business credit cards."
          >
            <Input
              type="number"
              step="0.01"
              value={form.liabilities.creditCards || ''}
              onChange={(e) =>
                updateForm('liabilities.creditCards', Number(e.target.value) || undefined)
              }
            />
          </FormField>

          <FormField
            label="Short-Term Loans"
            help="Loans due within 12 months (lines of credit, etc.)."
          >
            <Input
              type="number"
              step="0.01"
              value={form.liabilities.shortTermLoans || ''}
              onChange={(e) =>
                updateForm('liabilities.shortTermLoans', Number(e.target.value) || undefined)
              }
            />
          </FormField>

          <FormField
            label="Long-Term Debt"
            help="Loans due beyond 12 months."
          >
            <Input
              type="number"
              step="0.01"
              value={form.liabilities.longTermDebt || ''}
              onChange={(e) =>
                updateForm('liabilities.longTermDebt', Number(e.target.value) || undefined)
              }
            />
          </FormField>

          <FormField
            label="Other Liabilities"
            help="Any other amounts owed not listed above."
          >
            <Input
              type="number"
              step="0.01"
              value={form.liabilities.otherLiabilities || ''}
              onChange={(e) =>
                updateForm('liabilities.otherLiabilities', Number(e.target.value) || undefined)
              }
            />
          </FormField>
        </FormSection>

        <FormSection title="Equity" description="Owner value after liabilities are subtracted from assets.">
          <FormField
            label="Owner's Equity"
            help="Initial investment plus additional contributions."
          >
            <Input
              type="number"
              step="0.01"
              value={form.equity.ownersEquity || ''}
              onChange={(e) =>
                updateForm('equity.ownersEquity', Number(e.target.value) || undefined)
              }
            />
          </FormField>

          <FormField
            label="Retained Earnings"
            help="Cumulative profits kept in the business."
          >
            <Input
              type="number"
              step="0.01"
              value={form.equity.retainedEarnings || ''}
              onChange={(e) =>
                updateForm('equity.retainedEarnings', Number(e.target.value) || undefined)
              }
            />
          </FormField>
        </FormSection>

        <div className="space-y-4">
          <FormField
            label="Notes"
            help="Optional: add any context, assumptions, or clarifications."
          >
            <Textarea
              rows={3}
              placeholder="Add any additional notes or explanations..."
              value={form.notes || ''}
              onChange={(e) => updateForm('notes', e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <button 
          onClick={saveDraft} 
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
        </button>
        
        <div className="flex items-center space-x-4">
          {pdfUrl && (
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Open PDF
            </a>
          )}
          <button 
            onClick={onGenerate} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
