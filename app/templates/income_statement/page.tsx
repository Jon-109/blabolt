 'use client';

 import { useEffect, useRef, useState } from 'react';
 import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
 import { useRouter, usePathname } from 'next/navigation';
import type { IncomeStatementData } from '@/lib/templates/types';
import { IncomeStatementSchema } from '@/lib/templates/validate';
import { checkUserTemplateAccess } from '@/lib/templates/access';
import { Input } from '@/app/(components)/ui/input';
import { Textarea } from '@/app/(components)/ui/textarea';
import { FormField } from '@/app/(components)/templates/shared/FormField';

export default function IncomeStatementFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [form, setForm] = useState<IncomeStatementData>({
    periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0] as string,
    periodEnd: new Date().toISOString().split('T')[0] as string,
    revenue: { grossSales: undefined, serviceRevenue: undefined, otherRevenue: undefined },
    expenses: {
      costOfGoodsSold: undefined, salariesWages: undefined, rent: undefined,
      utilities: undefined, marketing: undefined, insurance: undefined,
      depreciation: undefined, interestExpense: undefined, otherExpenses: undefined
    },
    notes: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`); return; }
      const access = await checkUserTemplateAccess(user.id, 'income_statement');
      if (!access.allowed) { if (access.redirectUrl) router.push(access.redirectUrl); return; }
      setUser(user);
    };
    checkAuth();
  }, [router, supabase.auth]);

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
        const { data, error } = await supabase.from('template_submissions').insert({
          user_id: user.id, template_type: 'income_statement', form_data: form
        }).select('id,pdf_url').single();
        if (error) throw error;
        if (data) { setSubmissionId(data.id); setPdfUrl(data.pdf_url); }
      } else {
        const { error } = await supabase.from('template_submissions').update({ form_data: form }).eq('id', submissionId);
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
      IncomeStatementSchema.parse(form);
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
    if (!validateForm()) { alert('Please fix the validation errors before generating PDF.'); return; }
    setLoading(true);
    try {
      if (!submissionId) await saveDraft();
      if (!submissionId) throw new Error('Failed to save submission');
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId: submissionId, templateType: 'income_statement' })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }
      const json = await res.json();
      setPdfUrl(json.pdfUrl);
      if (json.pdfUrl) {
        await supabase.from('template_submissions').update({ pdf_url: json.pdfUrl }).eq('id', submissionId);
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
        if (key) { current[key] = { ...current[key] }; current = current[key]; }
      }
      const lastKey = keys[keys.length - 1];
      if (lastKey) current[lastKey] = value === '' ? undefined : value;
      return updated;
    });
    queueSave();
  };

  const totalRevenue = (form.revenue.grossSales || 0) + (form.revenue.serviceRevenue || 0) + (form.revenue.otherRevenue || 0);
  const totalExpenses = Object.values(form.expenses).reduce((sum, val) => sum + (val || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  if (!user) return <div className="max-w-4xl mx-auto p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl mr-4">💰</div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Income Statement</h1>
                    <p className="text-gray-600">Also known as Profit & Loss Statement</p>
                  </div>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Show lenders your business profitability by documenting all revenue and expenses. 
                  This statement proves your ability to generate profit and manage costs effectively.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">${Math.abs(netIncome).toLocaleString()}</div>
                  <div className={`text-sm font-medium ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netIncome >= 0 ? 'Net Profit' : 'Net Loss'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
                  saveStatus === 'saved' ? 'bg-green-500' :
                  saveStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {saveStatus === 'saving' ? 'Saving...' :
                   saveStatus === 'saved' ? 'All changes saved' :
                   saveStatus === 'error' ? 'Save failed' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">📅</div>
            Statement Period
          </h2>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Most lenders prefer to see a full year of data, but you can also create quarterly or monthly statements.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="Period Start Date"
              required
              help="The first day of the reporting period (e.g., 2025-01-01)."
              error={errors['periodStart']}
            >
              <Input
                type="date"
                value={form.periodStart}
                onChange={(e) => updateForm('periodStart', e.target.value)}
              />
            </FormField>

            <FormField
              label="Period End Date"
              required
              help="The last day of the reporting period (e.g., 2025-12-31)."
              error={errors['periodEnd']}
            >
              <Input
                type="date"
                value={form.periodEnd}
                onChange={(e) => updateForm('periodEnd', e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Revenue Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">💰</div>
            Revenue (Money Coming In)
            <div className="ml-auto bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-700 font-semibold text-sm">${totalRevenue.toLocaleString()}</span>
            </div>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="Product Sales Revenue"
              help="Revenue from selling products or goods."
              error={errors['revenue.grossSales']}
            >
              <Input
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={form.revenue.grossSales || ''}
                onChange={(e) => updateForm('revenue.grossSales', Number(e.target.value) || undefined)}
              />
            </FormField>

            <FormField
              label="Service Revenue"
              help="Revenue from providing services."
              error={errors['revenue.serviceRevenue']}
            >
              <Input
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={form.revenue.serviceRevenue || ''}
                onChange={(e) => updateForm('revenue.serviceRevenue', Number(e.target.value) || undefined)}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="Other Revenue"
                help="Interest income, rental income, or other sources."
                error={errors['revenue.otherRevenue']}
              >
                <Input
                  type="number"
                  step="0.01"
                  placeholder="$0.00"
                  value={form.revenue.otherRevenue || ''}
                  onChange={(e) => updateForm('revenue.otherRevenue', Number(e.target.value) || undefined)}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">💸</div>
            Expenses (Money Going Out)
            <div className="ml-auto bg-red-50 px-3 py-1 rounded-full">
              <span className="text-red-700 font-semibold text-sm">${totalExpenses.toLocaleString()}</span>
            </div>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { key: 'costOfGoodsSold', label: 'Cost of Goods Sold (COGS)', help: 'Direct costs to produce your products.' },
              { key: 'salariesWages', label: 'Salaries & Wages', help: 'Employee compensation and benefits.' },
              { key: 'rent', label: 'Rent', help: 'Office or facility rent payments.' },
              { key: 'utilities', label: 'Utilities', help: 'Electricity, gas, water, phone, internet.' },
              { key: 'marketing', label: 'Marketing & Advertising', help: 'Ads, promotions, website costs.' },
              { key: 'insurance', label: 'Insurance', help: 'Business insurance premiums.' },
              { key: 'depreciation', label: 'Depreciation', help: 'Equipment and asset depreciation.' },
              { key: 'interestExpense', label: 'Interest Expense', help: 'Interest on loans and credit.' }
            ].map(({ key, label, help }) => (
              <FormField
                key={key}
                label={label}
                help={help}
                error={errors[`expenses.${key}` as keyof typeof errors] as any}
              >
                <Input
                  type="number"
                  step="0.01"
                  placeholder="$0.00"
                  value={(form.expenses as any)[key] || ''}
                  onChange={(e) => updateForm(`expenses.${key}`, Number(e.target.value) || undefined)}
                />
              </FormField>
            ))}

            <div className="md:col-span-2">
              <FormField
                label="Other Expenses"
                help="Any other business expenses not listed above."
                error={errors['expenses.otherExpenses']}
              >
                <Input
                  type="number"
                  step="0.01"
                  placeholder="$0.00"
                  value={form.expenses.otherExpenses || ''}
                  onChange={(e) => updateForm('expenses.otherExpenses', Number(e.target.value) || undefined)}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">📝</div>
            Additional Notes (Optional)
          </h2>
          <FormField
            label="Notes"
            help="Optional: add any context, assumptions, or clarifications."
            error={errors['notes']}
          >
            <Textarea
              rows={4}
              placeholder="Add any additional context, explanations, or important details about your income statement..."
              value={form.notes || ''}
              onChange={(e) => updateForm('notes', e.target.value)}
            />
          </FormField>
        </div>

        {/* Summary & Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Summary</h2>
            <div className="text-right">
              <div className="text-sm text-gray-600">Net Income</div>
              <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(netIncome).toLocaleString()} {netIncome < 0 && '(Loss)'}
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-green-600 font-semibold">Total Revenue</div>
              <div className="text-xl font-bold text-green-700">${totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-red-600 font-semibold">Total Expenses</div>
              <div className="text-xl font-bold text-red-700">${totalExpenses.toLocaleString()}</div>
            </div>
            <div className={`rounded-xl p-4 text-center ${netIncome >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <div className={`font-semibold ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {netIncome >= 0 ? 'Profit Margin' : 'Loss Margin'}
              </div>
              <div className={`text-xl font-bold ${netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {totalRevenue > 0 ? Math.abs((netIncome / totalRevenue) * 100).toFixed(1) : '0'}%
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-6 border-t">
            <button onClick={saveDraft} className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium" disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
            </button>
            <div className="flex items-center space-x-4">
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">
                  Open PDF
                </a>
              )}
              <button onClick={onGenerate} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg font-semibold" disabled={loading}>
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
