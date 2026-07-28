"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Clock3, Loader2, Mail, Phone, Send, ShieldCheck } from 'lucide-react';
import { track, trackLeadConversion, getLeadSource } from '@/lib/analytics';

type LeadInterestFormProps = {
  variant?: 'embedded' | 'modal';
  source?: string;
  headline?: string;
  subheadline?: string;
  onSuccess?: () => void;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  services: string[];
  loanPurpose: string;
  otherLoanPurpose: string;
  fundingAmount: string;
  concerns: string[];
  message: string;
  prefersPhoneCall: boolean;
  source: string;
};

const SERVICE_INTERESTS = [
  'Can I afford this loan? / cash flow clarity',
  'Put together a complete loan package',
  'Find lenders interested in my loan request',
  'Not sure yet — help me choose',
];

const LOAN_PURPOSES = [
  'Cover everyday business expenses',
  'Buy equipment or vehicles',
  'Buy another business',
  'Buy or refinance a building',
  'Lower or combine existing debt',
  'Buy inventory or supplies',
  'Get a flexible line of credit',
  'Start or expand a business location',
  'Not sure yet',
  'Other',
];

const FUNDING_AMOUNTS = [
  'Under $50k',
  '$50k - $100k',
  '$100k - $250k',
  '$250k - $500k',
  '$500k - $1M',
  '$1M+',
  'Not sure yet',
];

const LOAN_CONCERNS = [
  'I am not sure if my business can qualify',
  'I do not know if I can afford the payment',
  'My credit score may be an issue',
  'I am not sure what documents lenders need',
  'My sales or profit may look too low',
  'I already have business debt',
  'My financial statements need cleanup',
  'I need funding quickly',
  'I was denied before or worry I might be denied',
  'I do not know which loan option fits best',
];

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  services: [],
  loanPurpose: '',
  otherLoanPurpose: '',
  fundingAmount: '',
  concerns: [],
  message: '',
  prefersPhoneCall: false,
  source: '',
};

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function LeadInterestForm({
  variant = 'embedded',
  source,
  headline = 'Tell us what you are trying to fund. We will help map the next best step.',
  subheadline = '',
  onSuccess,
}: LeadInterestFormProps) {
  const [formData, setFormData] = useState<FormData>(() => ({ ...initialFormData, source: source ?? '' }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formStarted, setFormStarted] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const resolvedSource = useMemo(() => {
    if (source) return source;
    if (typeof window === 'undefined') return '';
    return window.location.pathname;
  }, [source]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, source: resolvedSource }));
  }, [resolvedSource]);

  const isModal = variant === 'modal';

  const handleFormStart = () => {
    if (formStarted) return;
    setFormStarted(true);
    track('select_content', {
      content_type: 'engagement',
      link_text: 'loan_interest_form_start',
    });
  };

  const updateField = (field: keyof FormData, value: string | string[] | boolean) => {
    handleFormStart();
    if (field === 'phone' || field === 'prefersPhoneCall') {
      setPhoneError('');
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getPhoneDigits = () => formData.phone.replace(/\D/g, '');

  const focusPhoneInput = () => {
    phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => phoneInputRef.current?.focus(), 250);
  };

  const focusValidationError = () => {
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const validate = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      return 'Please enter your name and email.';
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (formData.prefersPhoneCall && getPhoneDigits().length < 10) {
      return 'For us to call you, please enter a valid phone number.';
    }

    if (formData.services.length === 0) {
      return 'Please select at least one area you are interested in.';
    }

    if (!formData.loanPurpose) {
      return 'Please select a loan purpose.';
    }

    if (formData.loanPurpose === 'Other' && !formData.otherLoanPurpose.trim()) {
      return 'Please enter your loan purpose.';
    }

    if (!formData.fundingAmount) {
      return 'Please select a funding amount range.';
    }

    if (formData.concerns.length === 0) {
      return 'Please select at least one concern.';
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      if (validationError.includes('phone number')) {
        setPhoneError('For us to call you, we need a valid phone number with area code.');
        focusPhoneInput();
      } else {
        window.setTimeout(focusValidationError, 0);
      }
      setError(validationError);
      track('lead_submission_error', {
        form_id: 'loan_interest',
        error_stage: 'validation',
        message: validationError,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/send-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          loanPurpose: formData.loanPurpose === 'Other' ? formData.otherLoanPurpose.trim() : formData.loanPurpose,
          source: resolvedSource,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      trackLeadConversion({
        form_id: 'loan_interest',
        submission_method: 'resend',
        lead_source: getLeadSource(),
        loan_purpose: formData.loanPurpose === 'Other' ? formData.otherLoanPurpose.trim() : formData.loanPurpose,
        funding_amount_range: formData.fundingAmount,
        service_interest: formData.services.join(', '),
        status: 'success',
        value: 1,
        currency: 'USD',
      });

      setIsSuccess(true);
      setFormData({ ...initialFormData, source: resolvedSource });
      onSuccess?.();
    } catch (err) {
      setError('Something went wrong sending your request. Please try again or email us directly.');
      console.error('Error submitting lead form:', err);
      track('lead_submission_error', {
        form_id: 'loan_interest',
        error_stage: 'network',
        message: 'Network or server error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`${isModal ? 'p-6 sm:p-8' : 'rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.28)] sm:p-8'} text-center`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">Request received.</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          Thanks for sharing the details. We usually respond within 24 hours with the best next step based on your loan goal, funding amount, and concerns.
        </p>
        <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4 text-left">
          <p className="text-sm font-black text-slate-950">Want to keep moving while you wait?</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Run the free DSCR check to see whether your business cash flow may comfortably cover the loan payment before a lender reviews the request.
          </p>
          <a href="/cash-flow-analysis#dscr-calculator" className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto">
            Start Free DSCR Check
          </a>
        </div>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 text-sm font-semibold text-slate-700 sm:flex-row sm:gap-4">
          <a href="mailto:jonathan@businesslendingadvocate.com" className="inline-flex items-center gap-2 text-cyan-800 hover:text-cyan-600">
            <Mail className="h-4 w-4" />
            jonathan@businesslendingadvocate.com
          </a>
          <a href="tel:210-370-7402" className="inline-flex items-center gap-2 text-cyan-800 hover:text-cyan-600">
            <Phone className="h-4 w-4" />
            210-370-7402
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={isModal ? 'bg-white' : 'overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.35)]'}>
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#155e75_0%,#0b2640_42%,#020617_100%)] px-5 py-6 text-white sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
            <ClipboardCheck className="h-4 w-4" />
            Funding Interest Form
          </div>
          <h2 className="mt-4 max-w-none text-[1.65rem] font-black leading-tight tracking-[-0.04em] sm:text-[1.75rem] lg:whitespace-nowrap lg:text-[1.72rem] xl:text-[1.82rem]">
            {headline}
          </h2>
          {subheadline ? (
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
              {subheadline}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-100 sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
              <Clock3 className="h-4 w-4 text-cyan-200" />
              Usually takes 2 minutes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-200" />
              No credit pull
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-6 sm:px-7 sm:py-7">
        {error && (
          <div ref={errorRef} tabIndex={-1} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 outline-none">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${variant}-firstName`} className="block text-sm font-bold text-slate-800">First name <span className="text-red-500">*</span></label>
            <input id={`${variant}-firstName`} type="text" value={formData.firstName} onChange={(event) => updateField('firstName', event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" placeholder="First name" autoComplete="given-name" />
          </div>
          <div>
            <label htmlFor={`${variant}-lastName`} className="block text-sm font-bold text-slate-800">Last name <span className="text-red-500">*</span></label>
            <input id={`${variant}-lastName`} type="text" value={formData.lastName} onChange={(event) => updateField('lastName', event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" placeholder="Last name" autoComplete="family-name" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${variant}-email`} className="block text-sm font-bold text-slate-800">Email <span className="text-red-500">*</span></label>
            <input id={`${variant}-email`} type="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" placeholder="you@business.com" autoComplete="email" />
          </div>
          <div>
            <label htmlFor={`${variant}-phone`} className="block text-sm font-bold text-slate-800">Phone <span className="text-slate-400">optional</span></label>
            <input ref={phoneInputRef} id={`${variant}-phone`} type="tel" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} className={`mt-1.5 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 ${phoneError ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'}`} placeholder="Best callback number" autoComplete="tel" aria-invalid={phoneError ? 'true' : 'false'} aria-describedby={phoneError ? `${variant}-phone-error` : undefined} />
            {phoneError && (
              <p id={`${variant}-phone-error`} className="mt-1.5 text-xs font-semibold text-red-600">
                {phoneError}
              </p>
            )}
          </div>
        </div>


        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800">What are you interested in? <span className="text-red-500">*</span></p>
              <p className="mt-1 text-xs text-slate-500">Select all that apply.</p>
            </div>
            <p className="text-xs font-semibold text-cyan-800">{formData.services.length} selected</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SERVICE_INTERESTS.map((service) => {
              const checked = formData.services.includes(service);
              return (
                <label key={service} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${checked ? 'border-cyan-300 bg-cyan-50 text-cyan-950 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'}`}>
                  <input type="checkbox" checked={checked} onChange={() => updateField('services', toggleValue(formData.services, service))} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600" />
                  {service}
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${variant}-loanPurpose`} className="block text-sm font-bold text-slate-800">What is the money for? <span className="text-red-500">*</span></label>
            <select id={`${variant}-loanPurpose`} value={formData.loanPurpose} onChange={(event) => updateField('loanPurpose', event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100">
              <option value="">Select one</option>
              {LOAN_PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${variant}-fundingAmount`} className="block text-sm font-bold text-slate-800">How much funding do you need? <span className="text-red-500">*</span></label>
            <select id={`${variant}-fundingAmount`} value={formData.fundingAmount} onChange={(event) => updateField('fundingAmount', event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100">
              <option value="">Select range</option>
              {FUNDING_AMOUNTS.map((amount) => <option key={amount} value={amount}>{amount}</option>)}
            </select>
          </div>
        </div>

        {formData.loanPurpose === 'Other' && (
          <div>
            <label htmlFor={`${variant}-otherLoanPurpose`} className="block text-sm font-bold text-slate-800">Tell us what the money is for <span className="text-red-500">*</span></label>
            <input id={`${variant}-otherLoanPurpose`} type="text" value={formData.otherLoanPurpose} onChange={(event) => updateField('otherLoanPurpose', event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" placeholder="Example: remodel the space, hire staff, open a second location" />
          </div>
        )}

        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800">What are your biggest concerns? <span className="text-red-500">*</span></p>
              <p className="mt-1 text-xs text-slate-500">This helps us understand what may slow the deal down.</p>
            </div>
            <p className="text-xs font-semibold text-cyan-800">{formData.concerns.length} selected</p>
          </div>
          <div className="mt-2 grid gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2 lg:grid-cols-2">
            {LOAN_CONCERNS.map((concern) => {
              const checked = formData.concerns.includes(concern);
              return (
                <label key={concern} className={`flex cursor-pointer items-start gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold leading-5 transition sm:text-sm ${checked ? 'bg-white text-cyan-950 shadow-sm ring-1 ring-cyan-200' : 'text-slate-700 hover:bg-white'}`}>
                  <input type="checkbox" checked={checked} onChange={() => updateField('concerns', toggleValue(formData.concerns, concern))} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600" />
                  {concern}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor={`${variant}-message`} className="block text-sm font-bold text-slate-800">Anything else we should know?</label>
          <p className="mt-1 text-xs text-slate-500">Example: what the funds are for, how long you have been in business, revenue range, or what happened with a prior lender.</p>
          <textarea id={`${variant}-message`} value={formData.message} onChange={(event) => updateField('message', event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" placeholder="Tell us a little about the loan, the business, and what you are trying to figure out." />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={formData.prefersPhoneCall} onChange={(event) => updateField('prefersPhoneCall', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600" />
          <span>I prefer a quick phone call to talk through this.</span>
        </label>

        <button type="submit" disabled={isSubmitting} className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-[0_20px_55px_-34px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base">
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending request...
            </>
          ) : (
            <>
              Submit Funding Interest Form
              <Send className="h-4 w-4 transition group-hover:translate-x-1" />
            </>
          )}
        </button>

        <p className="text-center text-xs leading-5 text-slate-500">
          We usually respond within 24 hours. Prefer direct contact? Email <a href="mailto:jonathan@businesslendingadvocate.com" className="font-semibold text-cyan-800 hover:text-cyan-600">jonathan@businesslendingadvocate.com</a> or call <a href="tel:210-370-7402" className="font-semibold text-cyan-800 hover:text-cyan-600">210-370-7402</a>.
        </p>
      </form>
    </div>
  );
}
