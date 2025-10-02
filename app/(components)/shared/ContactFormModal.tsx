"use client";

import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { track, getLeadSource } from '@/lib/analytics';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOAN_CONCERNS = [
  "Can I qualify for a loan?",
  "Don't know what documents are required",
  "Complicated application process",
  "Unclear loan terms and rates",
  "Don't know how much I can borrow",
  "Worried about credit score requirements",
  "Need help with financial statements",
  "Unsure about collateral requirements",
  "Timeline concerns - need funding quickly",
  "Previous loan application was denied"
];

export default function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    concerns: [] as string[],
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formStarted, setFormStarted] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsSuccess(false);
        setError('');
        setFormStarted(false);
        setFormData({
          businessName: '',
          firstName: '',
          lastName: '',
          concerns: [],
          message: ''
        });
      }, 300);
    }
  }, [isOpen]);

  // Track form start on first interaction
  const handleFormStart = () => {
    if (!formStarted) {
      setFormStarted(true);
      track('select_content', {
        content_type: 'form_start',
        link_text: 'loan_interest',
      } as any);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleConcernToggle = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter(c => c !== concern)
        : [...prev.concerns, concern]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.businessName || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      
      // Track validation error
      track('lead_submission_error', {
        form_id: 'loan_interest',
        error_stage: 'validation',
        message: 'Missing required fields',
      });
      return;
    }
    
    if (formData.concerns.length === 0) {
      setError('Please select at least one concern');
      
      // Track validation error
      track('lead_submission_error', {
        form_id: 'loan_interest',
        error_stage: 'validation',
        message: 'No concerns selected',
      });
      return;
    }
    
    if (!formData.message.trim()) {
      setError('Please provide details about your loan needs');
      
      // Track validation error
      track('lead_submission_error', {
        form_id: 'loan_interest',
        error_stage: 'validation',
        message: 'Missing message',
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
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Track successful lead generation
      track('generate_lead', {
        form_id: 'loan_interest',
        submission_method: 'resend',
        lead_source: getLeadSource(),
        status: 'success',
      });

      setIsSuccess(true);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error submitting form:', err);
      
      // Track submission error
      track('lead_submission_error', {
        form_id: 'loan_interest',
        error_stage: 'network',
        message: 'Network or server error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors group"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            </button>

            <div className="overflow-y-auto max-h-[90vh] custom-scrollbar">
              {!isSuccess ? (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-br from-[#002c55] to-[#004080] text-white px-6 py-8 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">Get Started Today</h2>
                    <p className="text-blue-100 text-sm sm:text-base">
                      Tell us about your business and loan needs. We'll respond within 24 hours.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8 sm:py-8 space-y-5">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Business Name */}
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        onFocus={handleFormStart}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c55] focus:border-transparent transition-shadow text-gray-900"
                        placeholder="Your Business Name"
                        required
                      />
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c55] focus:border-transparent transition-shadow text-gray-900"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c55] focus:border-transparent transition-shadow text-gray-900"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    {/* Concerns */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        What are your top concerns? <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {LOAN_CONCERNS.map((concern) => (
                          <label
                            key={concern}
                            className="flex items-start gap-3 p-2.5 rounded-md hover:bg-white cursor-pointer transition-colors group"
                          >
                            <input
                              type="checkbox"
                              checked={formData.concerns.includes(concern)}
                              onChange={() => handleConcernToggle(concern)}
                              className="mt-0.5 w-4 h-4 text-[#002c55] border-gray-300 rounded focus:ring-[#002c55] cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 select-none">
                              {concern}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        {formData.concerns.length} selected
                      </p>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Tell us about your loan needs <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        What type of loan are you looking for? What's the purpose? Any specific requirements?
                      </p>
                      <textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c55] focus:border-transparent transition-shadow resize-none text-gray-900"
                        placeholder="Example: I'm looking for a $100,000 SBA loan to purchase new equipment for my manufacturing business. We've been in operation for 5 years and need the equipment to expand production..."
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-[#002c55] to-[#004080] hover:from-[#001a33] hover:to-[#002c55] text-white font-bold py-3.5 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Request
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="px-6 py-12 sm:px-8 sm:py-16 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </motion.div>
                  
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Thank You!
                  </h3>
                  <p className="text-gray-600 mb-2 text-base sm:text-lg">
                    Your request has been submitted successfully.
                  </p>
                  <p className="text-gray-700 font-semibold mb-6 text-sm sm:text-base">
                    We'll respond within 24 hours via email at
                  </p>
                  <a 
                    href="mailto:jonathan@businesslendingadvocate.com"
                    className="inline-block text-[#002c55] font-bold text-base sm:text-lg hover:underline mb-8"
                  >
                    jonathan@businesslendingadvocate.com
                  </a>
                  
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
