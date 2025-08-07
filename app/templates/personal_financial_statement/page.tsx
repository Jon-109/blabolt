'use client';

import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { PersonalFinancialStatementData } from '@/lib/templates/types';
import { PersonalFinancialStatementSchema } from '@/lib/templates/validate';
import { checkUserTemplateAccess } from '@/lib/templates/access';

export default function PersonalFinancialStatementFormPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [form, setForm] = useState<PersonalFinancialStatementData>({
    asOfDate: new Date().toISOString().split('T')[0] as string,
    personalInfo: { name: '', address: '', phone: '', email: '' },
    assets: {
      cashChecking: undefined, cashSavings: undefined, stocksBonds: undefined,
      realEstate: undefined, automobiles: undefined, personalProperty: undefined, otherAssets: undefined
    },
    liabilities: {
      creditCards: undefined, mortgages: undefined, autoLoans: undefined,
      studentLoans: undefined, otherDebts: undefined
    },
    notes: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const access = await checkUserTemplateAccess(user.id, 'personal_financial_statement');
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
          user_id: user.id, template_type: 'personal_financial_statement', form_data: form
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
      PersonalFinancialStatementSchema.parse(form);
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
        body: JSON.stringify({ submissionId: submissionId, templateType: 'personal_financial_statement' })
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

  const totalAssets = Object.values(form.assets).reduce((sum, val) => sum + (val || 0), 0);
  const totalLiabilities = Object.values(form.liabilities).reduce((sum, val) => sum + (val || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl mr-4">👤</div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Personal Financial Statement</h1>
                    <p className="text-gray-600">SBA-Required Personal Net Worth Statement</p>
                  </div>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Meet SBA requirements with a complete personal financial statement that shows your net worth. 
                  This document helps lenders assess your personal financial strength and ability to support your business.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">${Math.abs(netWorth).toLocaleString()}</div>
                  <div className={`text-sm font-medium ${netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {netWorth >= 0 ? 'Net Worth' : 'Net Deficit'}
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
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Intermediate</span>
                <span>10-15 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">📋</div>
            Personal Information
          </h2>
          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-purple-800">
              <strong>🔒 Privacy:</strong> Your personal information is securely stored and only used to generate your financial statement.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input type="text" placeholder="Enter your full legal name" className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors['personalInfo.name'] ? 'border-red-500' : 'border-gray-200'
              }`} value={form.personalInfo.name} onChange={(e) => updateForm('personalInfo.name', e.target.value)} />
              {errors['personalInfo.name'] && <p className="text-red-600 text-sm mt-2">{errors['personalInfo.name']}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input type="tel" placeholder="(555) 123-4567" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={form.personalInfo.phone || ''} onChange={(e) => updateForm('personalInfo.phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input type="email" placeholder="your@email.com" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={form.personalInfo.email || ''} onChange={(e) => updateForm('personalInfo.email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">As of Date *</label>
              <input type="date" className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors['asOfDate'] ? 'border-red-500' : 'border-gray-200'
              }`} value={form.asOfDate} onChange={(e) => updateForm('asOfDate', e.target.value)} />
              {errors['asOfDate'] && <p className="text-red-600 text-sm mt-2">{errors['asOfDate']}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Home Address</label>
              <textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" rows={2}
                placeholder="Street address, city, state, zip code" value={form.personalInfo.address || ''} onChange={(e) => updateForm('personalInfo.address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Assets Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">💎</div>
            Assets (What You Own)
            <div className="ml-auto bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-700 font-semibold text-sm">${totalAssets.toLocaleString()}</span>
            </div>
          </h2>
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>💡 What to include:</strong> List the current market value of everything you own - bank accounts, investments, property, vehicles, and other valuable items.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { key: 'cashChecking', label: 'Checking Accounts', desc: 'Current balance in all checking accounts' },
              { key: 'cashSavings', label: 'Savings Accounts', desc: 'Current balance in all savings accounts' },
              { key: 'stocksBonds', label: 'Stocks & Investments', desc: 'Market value of stocks, bonds, mutual funds' },
              { key: 'realEstate', label: 'Real Estate', desc: 'Current market value of your home and other property' },
              { key: 'automobiles', label: 'Vehicles', desc: 'Current value of cars, trucks, motorcycles' },
              { key: 'personalProperty', label: 'Personal Property', desc: 'Jewelry, furniture, electronics, collectibles' }
            ].map(({ key, label, desc }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <input type="number" step="0.01" placeholder="$0.00" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={(form.assets as any)[key] || ''} onChange={(e) => updateForm(`assets.${key}`, Number(e.target.value) || undefined)} />
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Other Assets</label>
              <input type="number" step="0.01" placeholder="$0.00" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                value={form.assets.otherAssets || ''} onChange={(e) => updateForm('assets.otherAssets', Number(e.target.value) || undefined)} />
              <p className="text-xs text-gray-500 mt-1">Any other valuable assets not listed above</p>
            </div>
          </div>
        </div>

        {/* Liabilities Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">💳</div>
            Liabilities (What You Owe)
            <div className="ml-auto bg-red-50 px-3 py-1 rounded-full">
              <span className="text-red-700 font-semibold text-sm">${totalLiabilities.toLocaleString()}</span>
            </div>
          </h2>
          <div className="bg-red-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>💡 What to include:</strong> List the current outstanding balance of all your debts - credit cards, mortgages, loans, and any other money you owe.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { key: 'creditCards', label: 'Credit Card Debt', desc: 'Total outstanding balance on all credit cards' },
              { key: 'mortgages', label: 'Mortgage Loans', desc: 'Remaining balance on home and property mortgages' },
              { key: 'autoLoans', label: 'Auto Loans', desc: 'Remaining balance on car, truck, motorcycle loans' },
              { key: 'studentLoans', label: 'Student Loans', desc: 'Outstanding balance on education loans' }
            ].map(({ key, label, desc }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <input type="number" step="0.01" placeholder="$0.00" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  value={(form.liabilities as any)[key] || ''} onChange={(e) => updateForm(`liabilities.${key}`, Number(e.target.value) || undefined)} />
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Other Debts</label>
              <input type="number" step="0.01" placeholder="$0.00" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                value={form.liabilities.otherDebts || ''} onChange={(e) => updateForm('liabilities.otherDebts', Number(e.target.value) || undefined)} />
              <p className="text-xs text-gray-500 mt-1">Personal loans, family loans, or other debts not listed above</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">📝</div>
            Additional Notes (Optional)
          </h2>
          <textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" rows={4}
            placeholder="Add any additional context about your financial situation, pending transactions, or other relevant information..."
            value={form.notes || ''} onChange={(e) => updateForm('notes', e.target.value)} />
        </div>

        {/* Summary & Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Financial Summary</h2>
            <div className="text-right">
              <div className="text-sm text-gray-600">Net Worth</div>
              <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(netWorth).toLocaleString()} {netWorth < 0 && '(Deficit)'}
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-green-600 font-semibold">Total Assets</div>
              <div className="text-xl font-bold text-green-700">${totalAssets.toLocaleString()}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-red-600 font-semibold">Total Liabilities</div>
              <div className="text-xl font-bold text-red-700">${totalLiabilities.toLocaleString()}</div>
            </div>
            <div className={`rounded-xl p-4 text-center ${netWorth >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <div className={`font-semibold ${netWorth >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {netWorth >= 0 ? 'Financial Strength' : 'Needs Attention'}
              </div>
              <div className={`text-sm font-medium ${netWorth >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {netWorth >= 0 ? 'Strong Position' : 'Work on Debt'}
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
