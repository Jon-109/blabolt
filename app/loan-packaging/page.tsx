'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/app/(components)/ui/tooltip'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/app/(components)/ui/accordion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/helpers/client'
import { loanPurposes } from '@/lib/loanPurposes'
import Image from 'next/image'
import Testimonials from '@/app/(components)/shared/Testimonials'
import LoanPurposeSelector, { LEVEL2_OPTIONS } from '@/app/(components)/LoanPurposeSelector'
import CoverLetterInlineForm from '@/app/(components)/CoverLetterInlineForm'

type ServiceType = 'loan_packaging' | 'loan_brokering' | null;
type Step = 'service_selection' | 'payment' | 'dashboard';
type DocumentStatus = 'not_started' | 'uploaded' | 'generated' | 'completed';

interface Document {
  id: string;
  name: string;
  description: string;
  status: DocumentStatus;
  required: boolean;
  template_url?: string;
  aiGenerated?: boolean;
}

const isValidLevel2Purpose = (value: string): boolean => 
  Object.values(LEVEL2_OPTIONS).some(arr => arr.some(opt => opt.key === value));

const DEFAULT_DOCUMENTS: Document[] = [
  { id: 'personal-financial-statement', name: 'Personal Financial Statement', description: 'A summary of your personal assets, liabilities, and net worth.', status: 'not_started', required: true, template_url: '/templates/personal_financial_statement_template.xlsx' },
  { id: 'personal-debt-summary', name: 'Personal Debt Summary', description: 'A list of your personal debts and obligations.', status: 'not_started', required: true, template_url: '/templates/personal_debt_summary_template.xlsx' },
  { id: 'business-debt-summary', name: 'Business Debt Summary', description: 'A summary of all business debts and liabilities.', status: 'not_started', required: true, template_url: '/templates/business_debt_summary_template.xlsx' },
  { id: 'balance-sheet', name: 'Balance Sheet', description: 'A statement of your company\'s assets, liabilities, and equity.', status: 'not_started', required: true, template_url: '/templates/balance_sheet_template.xlsx' },
  { id: 'profit-loss-statement', name: 'Profit & Loss Statement', description: 'A report of your company\'s revenues, costs, and expenses.', status: 'not_started', required: true, template_url: '/templates/profit_loss_statement_template.xlsx' },
];

export default function LoanPackagingPage() {
  const router = useRouter();
  
  // Core state
  const [loanAmount, setLoanAmount] = useState<number | ''>('');
  const [selectedLoanPurpose, setSelectedLoanPurpose] = useState('');
  
  // Debug logging for selectedLoanPurpose changes
  useEffect(() => {
    console.log('[DEBUG] selectedLoanPurpose changed to:', selectedLoanPurpose, 'at', new Date().toISOString());
  }, [selectedLoanPurpose]);
  const [isCondensed, setIsCondensed] = useState(false);
  const [isLoanAmountBlurred, setIsLoanAmountBlurred] = useState(false);
  const [isLoanAmountMax, setIsLoanAmountMax] = useState(false);
  const [userWantsToEdit, setUserWantsToEdit] = useState(false);
  
  // UI state
  const [showIncludedModal, setShowIncludedModal] = useState(false);
  const [showStep1Details, setShowStep1Details] = useState(true);
  const [coverLetterApproved, setCoverLetterApproved] = useState(false);
  const [showCoverLetterForm, setShowCoverLetterForm] = useState(false);
  
  // Auth state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  
  // Flow state
  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const [currentStep, setCurrentStep] = useState<Step>('service_selection');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Dashboard state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [completedDocuments, setCompletedDocuments] = useState(0);
  const [loanPackagingId, setLoanPackagingId] = useState<string | null>(null);
  const [coverLetterCompleted, setCoverLetterCompleted] = useState(false);

  const getLoanPurposeLabel = useCallback((key: string): string => {
    for (const optionsArray of Object.values(LEVEL2_OPTIONS)) {
      const option = optionsArray.find(opt => opt.key === key);
      if (option) return option.label;
    }
    return key;
  }, []);

  // Auto-condense when both fields are filled (but not if user wants to edit)
  useEffect(() => {
    if (!isCondensed && !userWantsToEdit && loanAmount !== '' && selectedLoanPurpose) {
      // Condense if both fields have values and user hasn't explicitly chosen to edit
      console.log('[DEBUG] Auto-condensing Step 1 - loanAmount:', loanAmount, 'selectedLoanPurpose:', selectedLoanPurpose);
      setIsCondensed(true);
    } else if (isCondensed && (!selectedLoanPurpose || loanAmount === '')) {
      // Expand if either field is cleared (e.g., when user clicks "Change")
      console.log('[DEBUG] Auto-expanding Step 1 - missing field(s)');
      setIsCondensed(false);
      setUserWantsToEdit(false); // Reset edit flag when fields are cleared
    }
  }, [isCondensed, userWantsToEdit, loanAmount, selectedLoanPurpose]);

  // Auto-save refs and state
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedValuesRef = useRef<{purpose: string, amount: number | ''}>({purpose: '', amount: ''});

  // Authentication and data loading
  useEffect(() => {
    let mounted = true;
    
    const initializeUser = async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data?.session?.user) {
        if (mounted) {
          setUserEmail(null);
          setUserId(null);
          setLoadingUser(false);
          router.replace('/login');
        }
        return;
      }
      
      if (mounted) {
        setUserEmail(data.session.user.email);
        setUserId(data.session.user.id);
        setLoadingUser(false);
        checkExistingLoanPackaging(data.session.user.id);
      }
    };
    
    initializeUser();
    return () => { mounted = false };
  }, [router]);

  // Debounced auto-save function
  const debouncedSave = useCallback(async (purpose: string, amount: number | '') => {
    if (!userId || isInitialLoadRef.current || isSaving) return;
    
    // Prevent unnecessary saves if values haven't actually changed
    const lastSaved = lastSavedValuesRef.current;
    if (lastSaved.purpose === purpose && lastSaved.amount === amount) {
      return;
    }
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        
        // Update the last saved values to prevent duplicate saves
        lastSavedValuesRef.current = {purpose, amount};
        
        const { data: existingData, error: selectError } = await supabase
          .from('loan_packaging')
          .select('id')
          .eq('user_id', userId)
          .in('status', ['active', 'pending'])
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (selectError) throw selectError;
        
        const updateData = {
          loan_purpose: purpose || null,
          loan_amount: amount === '' ? null : Number(amount),
          updated_at: new Date().toISOString()
        };
        
        if (existingData?.length > 0) {
          const { error: updateError } = await supabase
            .from('loan_packaging')
            .update(updateData)
            .eq('id', existingData[0].id);
          
          if (updateError) throw updateError;
          if (!loanPackagingId) {
            setLoanPackagingId(existingData[0].id);
          }
        } else if (purpose || amount !== '') {
          const { data: insertData, error: insertError } = await supabase
            .from('loan_packaging')
            .insert({
              user_id: userId,
              service_type: 'loan_packaging',
              ...updateData,
              status: 'active'
            })
            .select('id')
            .single();
          
          if (insertError) throw insertError;
          if (insertData && !loanPackagingId) {
            setLoanPackagingId(insertData.id);
          }
        }
      } catch (err) {
        console.error('[Auto-save] Error:', err);
        // Reset last saved values on error so retry can happen
        lastSavedValuesRef.current = {purpose: '', amount: ''};
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  }, [userId, loanPackagingId, isSaving]);

  // Auto-save triggers and cleanup
  useEffect(() => {
    if (userId && (selectedLoanPurpose || loanAmount !== '')) {
      console.log('[DEBUG] Auto-save triggered with purpose:', selectedLoanPurpose, 'amount:', loanAmount);
      debouncedSave(selectedLoanPurpose, loanAmount);
    }
  }, [selectedLoanPurpose, loanAmount, debouncedSave, userId]);

  useEffect(() => {
    if (userId && isInitialLoadRef.current) {
      const timer = setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // Check if user has an existing loan packaging session
  const checkExistingLoanPackaging = async (userId: string) => {
    try {

      const { data, error } = await supabase
        .from('loan_packaging')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'pending', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // User has an existing loan packaging session - load saved data
        setLoanPackagingId(data[0].id);
        setServiceType(data[0].service_type as ServiceType);
        
        // Update last saved values to match loaded data to prevent auto-save conflicts
        const loadedPurpose = data[0].loan_purpose || '';
        const loadedAmount = data[0].loan_amount || '';
        lastSavedValuesRef.current = {purpose: loadedPurpose, amount: loadedAmount};
        
        console.log('[DEBUG] Setting selectedLoanPurpose from database to:', loadedPurpose);
        setSelectedLoanPurpose(loadedPurpose);
        
        // Load saved loan amount if it exists
        if (data[0].loan_amount) {
          setLoanAmount(data[0].loan_amount);
        }
        
        setCurrentStep('dashboard');
        loadDocuments(data[0].id);
      } else {
        // No session: prompt user to start a new loan package
        setCurrentStep('service_selection');
        setServiceType(null);
        setLoanPackagingId(null);
        setSelectedLoanPurpose('');
        setLoanAmount('');
      }
    } catch (err) {
      console.error('Error checking existing loan packaging:', err);
    } finally {

    }
  };
  
  // Load documents for the current loan packaging session
  const loadDocuments = async (loanPackagingId: string) => {
    try {
      console.log('[loadDocuments] Loading documents for loanPackagingId:', loanPackagingId);
      const { data, error } = await supabase
        .from('loan_packaging_documents')
        .select('*')
        .eq('loan_packaging_id', loanPackagingId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('[loadDocuments] Error loading documents:', error);
        throw error;
      }
      console.log('[loadDocuments] Loaded documents:', data);
      setDocuments(data || []);
      const completed = data?.filter((doc: Document) => doc.status === 'completed').length || 0;
      setCompletedDocuments(completed);
      console.log('[loadDocuments] Set completedDocuments to:', completed);
      
      // Also load cover letter completion status
      await loadCoverLetterStatus(loanPackagingId);
    } catch (err) {
      console.error('[loadDocuments] Exception:', err);
      setError('Failed to load documents');
    }
  };

  // Load cover letter completion status
  const loadCoverLetterStatus = async (loanPackagingId: string) => {
    try {
      console.log('[loadCoverLetterStatus] Loading cover letter status for loanPackagingId:', loanPackagingId);
      const { data, error } = await supabase
        .from('loan_packaging')
        .select('cover_letter_completed')
        .eq('id', loanPackagingId)
        .single();
      if (error) {
        console.error('[loadCoverLetterStatus] Error loading cover letter status:', error);
        throw error;
      }
      console.log('[loadCoverLetterStatus] Loaded cover letter status:', data);
      setCoverLetterCompleted(data?.cover_letter_completed || false);
    } catch (err) {
      console.error('[loadCoverLetterStatus] Exception:', err);
      // Don't set error here as it's not critical
    }
  };

  // Load documents for an existing loan packaging session
  const loadDocumentsOld = async (packagingId: string) => {
    try {
      const { data, error } = await supabase
        .from('loan_packaging_documents')
        .select('*')
        .eq('loan_packaging_id', packagingId);
      
      if (error) throw error;
      
      if (data) {
        setDocuments(data as Document[]);
        setCompletedDocuments(data.filter((doc: Document) => doc.status === 'completed').length);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  // Initialize default dashboard documents when first entering dashboard (top-level)
  useEffect(() => {
    if (currentStep === 'dashboard' && loanPackagingId && documents.length === 0) {
      const initializeDocuments = async () => {
        try {
          const { data, error } = await supabase
            .from('loan_packaging_documents')
            .select('id')
            .eq('loan_packaging_id', loanPackagingId);
          if (error) throw error;
          if (!data || data.length === 0) {
            const docsWithId = DEFAULT_DOCUMENTS.map((d) => ({ ...d, loan_packaging_id: loanPackagingId }));
            const { error: insertErr } = await supabase
              .from('loan_packaging_documents')
              .insert(docsWithId);
            if (insertErr) throw insertErr;
            loadDocuments(loanPackagingId);
          }
        } catch (err) {
          console.error('Error initializing documents:', err);
        }
      };
      initializeDocuments();
    }
  }, [currentStep, loanPackagingId, documents.length]);

  // Handle service type selection
  const handleServiceSelection = async (type: ServiceType) => {
    setServiceType(type);
    console.log('[handleServiceSelection] Called with type:', type, 'selectedLoanPurpose:', selectedLoanPurpose, 'loanPackagingId:', loanPackagingId, 'userId:', userId);
    if (!selectedLoanPurpose) {
      setError('Please select a loan purpose');
      console.warn('[handleServiceSelection] No loan purpose selected');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      // Insert a new loan packaging session if one does not exist
      if (!loanPackagingId && userId) {
        console.log('[handleServiceSelection] Inserting new loan_packaging row');
        const { data, error } = await supabase
          .from('loan_packaging')
          .insert({
            user_id: userId,
            service_type: type,
            loan_purpose: selectedLoanPurpose,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (error) {
          console.error('[handleServiceSelection] Error inserting loan_packaging:', error);
          throw error;
        }
        setLoanPackagingId(data.id);
        console.log('[handleServiceSelection] Inserted loan_packaging id:', data.id);
        // Initialize documents for the new session
        const docsWithId = DEFAULT_DOCUMENTS.map((d) => ({ ...d, loan_packaging_id: data.id }));
        const { error: insertErr } = await supabase
          .from('loan_packaging_documents')
          .insert(docsWithId);
        if (insertErr) {
          console.error('[handleServiceSelection] Error inserting loan_packaging_documents:', insertErr);
          throw insertErr;
        }
        console.log('[handleServiceSelection] Inserted default documents for loan_packaging_id:', data.id);
        loadDocuments(data.id);
      }
      setCurrentStep('dashboard');
      console.log('[handleServiceSelection] Set currentStep to dashboard');
    } catch (err) {
      setError('Failed to start a new loan packaging session. Please try again.');
      console.error('[handleServiceSelection] Exception:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Start Over button
  const handleStartOver = async () => {
    setError('');
    setIsSubmitting(true);
    console.log('[handleStartOver] Called with userId:', userId, 'serviceType:', serviceType, 'selectedLoanPurpose:', selectedLoanPurpose);
    try {
      if (userId && serviceType && selectedLoanPurpose) {
        // Insert a new loan packaging session
        console.log('[handleStartOver] Inserting new loan_packaging row');
        const { data, error } = await supabase
          .from('loan_packaging')
          .insert({
            user_id: userId,
            service_type: serviceType,
            loan_purpose: selectedLoanPurpose,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (error) {
          console.error('[handleStartOver] Error inserting loan_packaging:', error);
          throw error;
        }
        setLoanPackagingId(data.id);
        setCurrentStep('dashboard');
        console.log('[handleStartOver] Inserted loan_packaging id:', data.id, 'Set currentStep to dashboard');
        // Initialize documents for the new session
        const docsWithId = DEFAULT_DOCUMENTS.map((d) => ({ ...d, loan_packaging_id: data.id }));
        const { error: insertErr } = await supabase
          .from('loan_packaging_documents')
          .insert(docsWithId);
        if (insertErr) {
          console.error('[handleStartOver] Error inserting loan_packaging_documents:', insertErr);
          throw insertErr;
        }
        console.log('[handleStartOver] Inserted default documents for loan_packaging_id:', data.id);
        loadDocuments(data.id);
      } else {
        // If not enough info, send user to service selection
        setServiceType(null);
        setLoanPackagingId(null);
        setSelectedLoanPurpose('');
        setCurrentStep('service_selection');
        console.warn('[handleStartOver] Not enough info to start new session, resetting to service_selection');
      }
    } catch (err) {
      setError('Failed to start over. Please try again.');
      console.error('[handleStartOver] Exception:', err);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Handle document upload
  const handleFileUpload = async (documentId: string, file: File) => {
    if (!loanPackagingId || !userId) {
      console.warn('[handleFileUpload] Missing loanPackagingId or userId', { loanPackagingId, userId });
      return;
    }
    
    try {
      console.log('[handleFileUpload] Uploading file', file.name, 'for documentId:', documentId, 'loanPackagingId:', loanPackagingId, 'userId:', userId);
      // 1. Upload file to Supabase Storage
      const fileName = `${userId}/${loanPackagingId}/${documentId}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('loan-packaging-documents')
        .upload(fileName, file);
      if (uploadError) {
        console.error('[handleFileUpload] Error uploading file to storage:', uploadError);
        throw uploadError;
      }
      console.log('[handleFileUpload] File uploaded to storage:', fileName);
      // 2. Get public URL
      const { data: urlData } = await supabase.storage
        .from('loan-packaging-documents')
        .getPublicUrl(fileName);
      console.log('[handleFileUpload] Got public URL:', urlData?.publicUrl);
      // 3. Update document status in database
      const { error: updateError } = await supabase
        .from('loan_packaging_documents')
        .update({ 
          status: 'uploaded', 
          file_url: urlData.publicUrl,
          file_name: file.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('loan_packaging_id', loanPackagingId);
      if (updateError) {
        console.error('[handleFileUpload] Error updating document row:', updateError);
        throw updateError;
      }
      console.log('[handleFileUpload] Updated document row for documentId:', documentId);
      // 4. Reload documents to update UI
      loadDocuments(loanPackagingId);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document. Please try again.');
    }
  };
  
  // Handle document status update
  const updateDocumentStatus = async (documentId: string, status: DocumentStatus) => {
    if (!loanPackagingId) return;
    
    try {
      const { error } = await supabase
        .from('loan_packaging_documents')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', documentId)
        .eq('loan_packaging_id', loanPackagingId);
        
      if (error) throw error;
      
      // Reload documents
      loadDocuments(loanPackagingId);
    } catch (err) {
      console.error('Error updating document status:', err);
    }
  };
  
  // Generate cover letter
  const generateCoverLetter = async (formData: any) => {
    if (!loanPackagingId || !userId) return;
    
    try {
      // This would typically call an API endpoint that uses AI to generate the letter
      // For now, we'll just simulate success and update the status
      
      // Update document status
      const { error } = await supabase
        .from('loan_packaging_documents')
        .update({ 
          status: 'generated', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', 'cover-letter')
        .eq('loan_packaging_id', loanPackagingId);
        
      if (error) throw error;
      
      // Reload documents
      loadDocuments(loanPackagingId);
    } catch (err) {
      console.error('Error generating cover letter:', err);
      setError('Failed to generate cover letter. Please try again.');
    }
  };
  
  // Handle final submission/download
  const handleFinalization = async () => {
    if (!loanPackagingId || !userId || !serviceType) return;
    
    try {
      if (serviceType === 'loan_packaging') {
        // Generate a ZIP file of all documents for download
        // This would typically call an API endpoint that packages all files
        alert('Download functionality will be implemented in the next version');
      } else if (serviceType === 'loan_brokering') {
        // Mark the loan packaging as submitted for broker review
        const { error } = await supabase
          .from('loan_packaging')
          .update({ 
            status: 'submitted', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', loanPackagingId);
          
        if (error) throw error;
        
        alert('Your loan package has been submitted to our team for review.');
      }
    } catch (err) {
      console.error('Error finalizing loan package:', err);
      setError('Failed to finalize loan package. Please try again.');
    }
  };

  // Progress and step-completion logic for dashboard UI
  const isLoanAmountEntered = !!loanAmount;
  const isLoanPurposeSelected = !!selectedLoanPurpose;
  const isStep1Complete = isLoanAmountEntered && isLoanPurposeSelected;
  const docsUploaded = documents.filter((doc: Document) => doc.status === 'uploaded' || doc.status === 'completed').length;
  const totalDocs = documents.length || 1;
  const isStep2Complete = docsUploaded === totalDocs;
  const isStep3Complete = coverLetterApproved; // Placeholder for Step 3 logic
  let progressPercentage = 0;
  if (isLoanAmountEntered) progressPercentage += 10;
  if (isLoanPurposeSelected) progressPercentage += 10;
  if (isStep2Complete) progressPercentage += 80;

  return (
    <main className="min-h-screen bg-slate-50 pt-0 pb-12">
      {/* Top Banner/Header */}
      <header className="w-full bg-[#101928] shadow-lg relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center text-center gap-2">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Loan Packaging Dashboard</h1>
          <p className="text-lg md:text-xl text-white/80 font-medium">Complete all steps to generate your lender-ready loan package.</p>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{boxShadow:'0 8px 32px 0 rgba(16,25,40,0.25), 0 1.5px 0 0 #1a2233'}}></div>
      </header>
      {/* Progress Bar */}
      <section className="w-full bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
          {/* Progress bar - full width */}
          <div className="w-full">
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-4 bg-blue-700 rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${progressPercentage}%` }}
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              ></div>
            </div>
          </div>

          {/* Progress label left, next step centered, right empty */}
          <div className="flex items-center w-full mt-4">
            {/* Left: Progress label and percentage */}
            <div className="flex items-center flex-1">
              <span className="text-base font-semibold text-slate-800 mr-2">Progress:</span>
              <span className="font-bold text-slate-900">{progressPercentage}%</span>
            </div>
            {/* Center: Next step instruction/button */}
            <div className="flex justify-center flex-1">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full shadow-md bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 min-h-[36px]">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-lg font-bold shadow-sm">
                  {/* Right arrow icon for clarity */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </span>
                <span className="text-sm md:text-base font-semibold text-blue-900 tracking-tight">
                  {(() => {
                    if (!isStep1Complete) return 'Next Step: Complete Loan Details';
                    if (!isStep2Complete) return 'Next Step: Upload Required Documents';
                    if (!isStep3Complete) return 'Next Step: Generate Cover Letter';
                    return 'All steps complete! You may finalize your package.';
                  })()}
                </span>
              </div>
            </div>
            {/* Right: empty for spacing */}
            <div className="flex-1"></div>
          </div>
        </div>
      </section>
      
      {/* Step 1: Loan Details UI */}
    {showStep1Details ? (
      <section className={`max-w-7xl mx-auto px-4 md:px-6 ${isCondensed ? 'pt-0' : 'pt-4'}`}>
        <div className={`bg-white border border-gray-200 rounded-xl border-l-4 border-green-600 ${isCondensed ? 'shadow-sm py-3 px-3 space-y-2' : 'shadow-md py-4 px-4 space-y-4'}`}>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-3">Step 1: Loan Details</h2>
          </div>
          {isCondensed ? (
            <div className="flex items-center justify-between text-lg font-semibold text-slate-700">
              <span>{getLoanPurposeLabel(selectedLoanPurpose)} - ${typeof loanAmount === 'number' ? loanAmount.toLocaleString() : ''}</span>
              <button 
                onClick={() => {
                  console.log('[DEBUG] Edit button clicked - preventing auto-condense');
                  setUserWantsToEdit(true);
                  setIsCondensed(false);
                }} 
                className="text-blue-600 hover:underline font-medium text-sm ml-4">
                Edit
              </button>
            </div>
          ) : (
            <div>
              <p className="text-slate-600 text-base mb-4">Enter your loan details to begin packaging your application.</p>
              {/* Loan Purpose Selector first */}
              <div className="mb-4">
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  Loan Purpose <span className="text-red-500">*</span>
                </label>
                <LoanPurposeSelector
                  value={selectedLoanPurpose}
                  onChange={setSelectedLoanPurpose}
                  disabled={loadingUser}
                />
              </div>
              {/* Show Loan Amount input only after L2 is selected (first fill), or always in edit mode */}
              {(!isCondensed || isValidLevel2Purpose(selectedLoanPurpose)) && (
                <div className="mb-4">
                  <label htmlFor="loan-amount" className="block text-lg font-semibold text-gray-900 mb-2">
                    Loan Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                    <input
                      id="loan-amount"
                      type="text"
                      value={loanAmount === '' ? '' : loanAmount.toLocaleString()}
                      onBlur={() => {
                        setIsLoanAmountBlurred(true);
                        setUserWantsToEdit(false); // Allow auto-condense after user finishes editing
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        const numValue = value ? parseInt(value, 10) : '';
                        if (numValue === '' || numValue <= 10000000) {
                          setLoanAmount(numValue);
                          setIsLoanAmountMax(false);
                        } else {
                          setIsLoanAmountMax(true);
                        }
                      }}
                      placeholder="50,000"
                      className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 max-w-xs"
                      aria-describedby="loan-amount-max"
                    />
                  </div>
                  {isLoanAmountMax && (
                    <p className="text-red-500 text-sm mt-1">$10,000,000 is the maximum allowed loan amount.</p>
                  )}
                </div>
              )}
              {/* Show error below Loan Amount */}
              {error && (
                <p className="text-red-600 mb-2">{error}</p>
              )}
            </div>
          )}
        </div>
      </section>
    ) : null}


    {/* Step 2: Upload Required Documents - OUTSIDE Step 1 */}
    {isStep1Complete && (
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
        <div className="bg-white rounded-xl shadow-md p-6 md:p-10 flex flex-col gap-6 border-l-4 border-blue-600">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Step 2: Upload Required Documents</h2>
          <p className="text-slate-600 text-base">Upload each document below to complete your loan package.</p>
          {documents.length > 0 ? (
            documents
              .filter((doc: Document) => [
                'balance-sheet',
                'profit-loss-statement',
                'tax-returns'
              ].includes(doc.id))
              .map((doc: Document) => (
                <div
                  key={doc.id}
                  className={`flex flex-col rounded-2xl border bg-white shadow-md p-6 transition hover:shadow-lg hover:border-blue-200 ${doc.status === 'completed' || doc.status === 'uploaded' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  tabIndex={0}
                  aria-label={doc.name}
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{doc.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{doc.description}</p>
                  <div className="flex-1"></div>
                  <div className="flex items-center gap-2 mb-2">
                    {doc.required && <span className="ml-2 text-xs text-red-500">*Required</span>}
                    {/* Status badge */}
                    {doc.status === 'not_started' && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Not Started</span>
                    )}
                    {doc.status === 'uploaded' && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Uploaded</span>
                    )}
                    {doc.status === 'completed' && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Completed</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Upload button */}
                    {doc.status !== 'completed' && (
                      <label className="w-full">
                        <input
                          type="file"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(doc.id, e.target.files[0]);
                            }
                          }}
                        />
                        <span className="block w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center cursor-pointer">Upload File</span>
                      </label>
                    )}
                    {/* View Template button */}
                    {doc.template_url && (
                      <a
                        href={doc.template_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 border border-blue-600 text-blue-700 bg-white rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center text-sm"
                      >
                        View Template
                      </a>
                    )}
                    {/* Mark as completed button */}
                    {doc.status === 'uploaded' && (
                      <button
                        className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        onClick={() => updateDocumentStatus(doc.id, 'completed')}
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading documents...</p>
            </div>
          )}
        </div>
      </section>
    )}

    {/* Step 3: Cover Letter Generator (Dashboard Box) */}
    {isStep1Complete && (
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
        <div className="bg-white rounded-xl shadow-md p-6 md:p-10 flex flex-col gap-6 border-l-4 border-blue-600">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-1">Step 3: Generate Your Cover Letter</h2>
          
          {!showCoverLetterForm ? (
            <>
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Create Your Professional Cover Letter</h3>
                    <p className="text-sm text-gray-600">Complete a 4-step guided form to generate a compelling loan application narrative</p>
                  </div>
                  {coverLetterCompleted && (
                    <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">Completed</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Why a Cover Letter Matters</h4>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        A strong cover letter is your opportunity to make a compelling case to lenders. It summarizes your loan request, business purpose, and qualifications in a professional narrative that helps your package stand out.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-600">Business Overview</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-600">Loan Purpose & Impact</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-600">Financial Details</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  onClick={() => setShowCoverLetterForm(true)}
                  disabled={!loanPackagingId || typeof loanAmount !== 'number'}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {coverLetterCompleted ? 'Edit Cover Letter' : 'Start Cover Letter'}
                </button>
                
                <div className="mt-3 text-sm text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Takes 5-10 minutes</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {coverLetterCompleted && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">Completed</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowCoverLetterForm(false);
                    // Reload cover letter status when form closes
                    if (loanPackagingId) {
                      loadCoverLetterStatus(loanPackagingId);
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                  title="Close form"
                >
                  ×
                </button>
              </div>
              
              <CoverLetterInlineForm
                loanPackagingId={loanPackagingId}
                loanAmount={typeof loanAmount === 'number' ? loanAmount : 0}
                onComplete={() => {
                  setShowCoverLetterForm(false);
                  // Reload cover letter status when completed
                  if (loanPackagingId) {
                    loadCoverLetterStatus(loanPackagingId);
                  }
                }}
              />
            </>
          )}
        </div>
      </section>
    )}


  </main>
);

// Fallback view if no step is active (should not happen)
// Fallback view if no step is active (should not happen)
const validSteps: Step[] = ['dashboard', 'service_selection', 'payment'];
if (!validSteps.includes(currentStep)) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">We couldn't determine your current step in the loan packaging process.</p>
        <button
          onClick={() => {
            console.log('[LoanPackagingPage] Start Over button clicked on fallback screen');
            handleStartOver();
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Over
        </button>
      </div>
    </main>
  );
}
}