'use client';

import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { BusinessDebtSummaryData } from '@/lib/templates/types';
import { BusinessDebtSummarySchema } from '@/lib/templates/validate';
import { checkUserTemplateAccess } from '@/lib/templates/access';

export default function BusinessDebtSummaryFormPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [form, setForm] = useState<BusinessDebtSummaryData>({
    asOfDate: new Date().toISOString().split('T')[0] as string,
    businessInfo: { name: '' },
    debts: []
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const access = await checkUserTemplateAccess(user.id, 'business_debt_summary');
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
          user_id: user.id, template_type: 'business_debt_summary', form_data: form
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
      BusinessDebtSummarySchema.parse(form);
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
        body: JSON.stringify({ submissionId: submissionId, templateType: 'business_debt_summary' })
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

  const addDebt = () => {
    setForm(prev => ({
      ...prev,
      debts: [...prev.debts, {
        creditor: '',
        accountNumber: '',
        originalAmount: 0,
        currentBalance: 0,
        monthlyPayment: 0,
        interestRate: undefined,
        maturityDate: '',
        collateral: '',
        personalGuarantee: false
      }]
    }));
    queueSave();
  };

  const removeDebt = (index: number) => {
    setForm(prev => ({
      ...prev,
      debts: prev.debts.filter((_, i) => i !== index)
    }));
    queueSave();
  };

  const updateDebt = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      debts: prev.debts.map((debt, i) => 
        i === index ? { ...debt, [field]: value === '' ? undefined : value } : debt
      )
    }));
    queueSave();
  };

  const totalOriginalAmount = form.debts.reduce((sum, debt) => sum + (debt.originalAmount || 0), 0);
  const totalCurrentBalance = form.debts.reduce((sum, debt) => sum + (debt.currentBalance || 0), 0);
  const totalMonthlyPayment = form.debts.reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0);
  const personalGuaranteeCount = form.debts.filter(debt => debt.personalGuarantee).length;

  if (!user) return <div className="max-w-4xl mx-auto p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl mr-4">🏢</div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Business Debt Summary</h1>
                    <p className="text-gray-600">Complete Overview of Business Liabilities</p>
                  </div>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Document all your business debts and obligations in a professional format that clearly shows your company's 
                  debt structure, payment obligations, and personal guarantees to lenders.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">${totalCurrentBalance.toLocaleString()}</div>
                  <div className="text-sm font-medium text-blue-600">Total Business Debt</div>
                  <div className="text-xs text-gray-500 mt-1">{form.debts.length} accounts</div>
                  {personalGuaranteeCount > 0 && (
                    <div className="text-xs text-orange-600 mt-1">{personalGuaranteeCount} personal guarantees</div>
                  )}
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
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Beginner</span>
                <span>6-10 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">🏢</div>
            Business Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
              <input type="text" placeholder="Enter your business legal name" className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors['businessInfo.name'] ? 'border-red-500' : 'border-gray-200'
              }`} value={form.businessInfo.name} onChange={(e) => updateForm('businessInfo.name', e.target.value)} />
              {errors['businessInfo.name'] && <p className="text-red-600 text-sm mt-2">{errors['businessInfo.name']}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">EIN (Optional)</label>
              <input type="text" placeholder="XX-XXXXXXX" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={form.businessInfo.ein || ''} onChange={(e) => updateForm('businessInfo.ein', e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Federal tax identification number</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address</label>
              <input type="text" placeholder="Street address, city, state, zip" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={form.businessInfo.address || ''} onChange={(e) => updateForm('businessInfo.address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">As of Date *</label>
              <input type="date" className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors['asOfDate'] ? 'border-red-500' : 'border-gray-200'
              }`} value={form.asOfDate} onChange={(e) => updateForm('asOfDate', e.target.value)} />
              {errors['asOfDate'] && <p className="text-red-600 text-sm mt-2">{errors['asOfDate']}</p>}
            </div>
          </div>
        </div>

        {/* Business Debts Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">💼</div>
              Business Debts & Obligations
            </h2>
            <button onClick={addDebt} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg font-medium text-sm">
              + Add Debt
            </button>
          </div>

          {form.debts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Debts Added Yet</h3>
              <p className="text-gray-600 mb-4">Click "Add Debt" to start documenting your business liabilities</p>
              <button onClick={addDebt} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg font-medium">
                Add Your First Business Debt
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {form.debts.map((debt, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-xl p-6 relative">
                  <button onClick={() => removeDebt(index)} className="absolute top-4 right-4 w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Debt #{index + 1}</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Creditor Name *</label>
                      <input type="text" placeholder="Bank, Lender, Supplier, etc." className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={debt.creditor} onChange={(e) => updateDebt(index, 'creditor', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                      <input type="text" placeholder="Account or loan number" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={debt.accountNumber || ''} onChange={(e) => updateDebt(index, 'accountNumber', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Original Amount *</label>
                      <input type="number" step="0.01" placeholder="$0.00" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={debt.originalAmount || ''} onChange={(e) => updateDebt(index, 'originalAmount', Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Current Balance *</label>
                      <input type="number" step="0.01" placeholder="$0.00" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={debt.currentBalance || ''} onChange={(e) => updateDebt(index, 'currentBalance', Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Payment *</label>
                      <input type="number" step="0.01" placeholder="$0.00" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={debt.monthlyPayment || ''} onChange={(e) => updateDebt(index, 'monthlyPayment', Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Rate (%)</label>
                      <input type="number" step="0.01" placeholder="5.25" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={debt.interestRate || ''} onChange={(e) => updateDebt(index, 'interestRate', Number(e.target.value) || undefined)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Maturity Date</label>
                      <input type="date" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={debt.maturityDate || ''} onChange={(e) => updateDebt(index, 'maturityDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Collateral</label>
                      <input type="text" placeholder="Equipment, inventory, real estate" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={debt.collateral || ''} onChange={(e) => updateDebt(index, 'collateral', e.target.value)} />
                    </div>
                    <div className="flex items-center space-x-3 pt-6">
                      <input type="checkbox" id={`guarantee-${index}`} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={debt.personalGuarantee || false} onChange={(e) => updateDebt(index, 'personalGuarantee', e.target.checked)} />
                      <label htmlFor={`guarantee-${index}`} className="text-sm font-semibold text-gray-700">Personal Guarantee</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">📝</div>
            Additional Notes (Optional)
          </h2>
          <textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" rows={4}
            placeholder="Add context about debt terms, payment history, refinancing plans, or other relevant business debt information..."
            value={form.notes || ''} onChange={(e) => updateForm('notes', e.target.value)} />
        </div>

        {/* Summary & Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Business Debt Summary</h2>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Monthly Payments</div>
              <div className="text-2xl font-bold text-blue-600">${totalMonthlyPayment.toLocaleString()}</div>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-blue-600 font-semibold">Original Amount</div>
              <div className="text-xl font-bold text-blue-700">${totalOriginalAmount.toLocaleString()}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-red-600 font-semibold">Current Balance</div>
              <div className="text-xl font-bold text-red-700">${totalCurrentBalance.toLocaleString()}</div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-indigo-600 font-semibold">Total Accounts</div>
              <div className="text-xl font-bold text-indigo-700">{form.debts.length}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-orange-600 font-semibold">Personal Guarantees</div>
              <div className="text-xl font-bold text-orange-700">{personalGuaranteeCount}</div>
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
              <button onClick={onGenerate} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg font-semibold" disabled={loading}>
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
