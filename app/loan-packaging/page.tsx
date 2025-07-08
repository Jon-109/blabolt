'use client'

import { useState, useEffect } from 'react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/app/(components)/ui/tooltip'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/app/(components)/ui/accordion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/helpers/client'
import { loanPurposes } from '@/lib/loanPurposes'
import Image from 'next/image'
import Testimonials from '@/app/(components)/shared/Testimonials'

// Define types for the Loan Packaging process
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

// Default documents to initialize in the dashboard
const DEFAULT_DOCUMENTS: Document[] = [
  { id: 'personal-financial-statement', name: 'Personal Financial Statement', description: 'A summary of your personal assets, liabilities, and net worth.', status: 'not_started', required: true, template_url: '/templates/personal_financial_statement_template.xlsx' },
  { id: 'personal-debt-summary', name: 'Personal Debt Summary', description: 'A list of your personal debts and obligations.', status: 'not_started', required: true, template_url: '/templates/personal_debt_summary_template.xlsx' },
  { id: 'business-debt-summary', name: 'Business Debt Summary', description: 'A summary of all business debts and liabilities.', status: 'not_started', required: true, template_url: '/templates/business_debt_summary_template.xlsx' },
  { id: 'balance-sheet', name: 'Balance Sheet', description: 'A statement of your company’s assets, liabilities, and equity.', status: 'not_started', required: true, template_url: '/templates/balance_sheet_template.xlsx' },
  { id: 'profit-loss-statement', name: 'Profit & Loss Statement', description: 'A report of your company’s revenues, costs, and expenses.', status: 'not_started', required: true, template_url: '/templates/profit_loss_statement_template.xlsx' },
];

export default function LoanPackagingPage() {
  // Step 1: Loan Details state (must be top-level for progress logic)
  const [loanAmount, setLoanAmount] = useState<number | ''>('');
  const [coverLetterApproved, setCoverLetterApproved] = useState(false); // Step 3 placeholder

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [showIncludedModal, setShowIncludedModal] = useState(false);
  // User authentication state
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  
  // Service selection and flow state
  const [serviceType, setServiceType] = useState<ServiceType>(null)
  const [currentStep, setCurrentStep] = useState<Step>('service_selection')
  const [selectedLoanPurpose, setSelectedLoanPurpose] = useState('')

  // Log currentStep on every render (must come after currentStep is declared)
  useEffect(() => {
    console.log('[LoanPackagingPage] Rendered with currentStep:', currentStep);
  }, [currentStep]);

  // On mount, check for ?purpose= in URL and set dropdown
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const purpose = params.get('purpose')
      if (purpose && Object.keys(loanPurposes).includes(purpose)) {
        setSelectedLoanPurpose(purpose)
      }
    }
  }, [])

  // Skipping payment verification for now – always allow user to proceed manually after selecting a service.
  // Previously this hook checked Stripe `session_id` in the URL and verified payment against the `purchases` table.
  // It has been removed to simplify the flow while payments are disabled.


  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Dashboard state (to be used after payment)
  const [documents, setDocuments] = useState<Document[]>([])
  const [completedDocuments, setCompletedDocuments] = useState(0)
  const [loanPackagingId, setLoanPackagingId] = useState<string | null>(null)
  
  const router = useRouter()

  // Authentication effect
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
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
        
        // Check if user already has an active loan packaging session
        checkExistingLoanPackaging(data.session.user.id);
      }
    };
    
    fetchUser();
    return () => { mounted = false };
  }, [router]);
  
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
        // User has an existing loan packaging session
        setLoanPackagingId(data[0].id);
        setServiceType(data[0].service_type as ServiceType);
        setSelectedLoanPurpose(data[0].loan_purpose || '');
        setCurrentStep('dashboard');
        loadDocuments(data[0].id);
      } else {
        // No session: prompt user to start a new loan package
        setCurrentStep('service_selection');
        setServiceType(null);
        setLoanPackagingId(null);
        setSelectedLoanPurpose('');
      }
    } catch (err) {
      console.error('Error checking existing loan packaging:', err);
    }
  };
  
  // Load documents for an existing loan packaging session
  const loadDocuments = async (packagingId: string) => {
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
      console.error('[handleFileUpload] Exception:', err);
      setError('Failed to upload document. Please try again.');
    }
  };

  // Dashboard view after payment/agreement completion
  if (currentStep === 'dashboard') {
    // Progress logic for 3 steps
    const isStep1Complete = !!loanAmount && !!selectedLoanPurpose;
    const docsUploaded = documents.filter((doc: Document) => doc.status === 'uploaded' || doc.status === 'completed').length;
    const totalDocs = documents.length || 1;
    const step1Pct = 20;
    const step2Pct = Math.round((docsUploaded / totalDocs) * 70); // Step 2 = 70% max
    const isStep2Complete = docsUploaded === totalDocs;
    const isStep3Complete = coverLetterApproved; // Placeholder for Step 3 logic
    let progressPercentage = 0;
    if (isStep1Complete && isStep2Complete && isStep3Complete) {
      progressPercentage = 100;
    } else if (isStep1Complete && isStep2Complete) {
      progressPercentage = 90;
    } else if (isStep1Complete) {
      progressPercentage = step1Pct + step2Pct;
    } else {
      progressPercentage = 0;
    }
    let progressLabel = '';
    if (!isStep1Complete) progressLabel = 'Step 1: Loan Details';
    else if (!isStep2Complete) progressLabel = `Step 2: Upload Documents (${docsUploaded}/${totalDocs})`;
    else if (!isStep3Complete) progressLabel = 'Step 3: Cover Letter';
    else progressLabel = 'All steps complete!';

    // Step 1: Loan Details state is at top-level of component (do not redeclare here)

    // Step 1: Loan Details UI
    // This will be rendered above Step 2

    // Handle document upload
    const handleFileUpload = async (documentId: string, file: File) => {
      if (!loanPackagingId || !userId) return;
      
      try {
        // 1. Upload file to Supabase Storage
        const fileName = `${userId}/${loanPackagingId}/${documentId}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('loan-packaging-documents')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        // 2. Get public URL
        const { data: urlData } = supabase.storage
          .from('loan-packaging-documents')
          .getPublicUrl(fileName);
          
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
          
        if (updateError) throw updateError;
        
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
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:gap-8 gap-4">
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
              <span className="text-base font-semibold text-slate-800">Progress:</span>
              <span className="font-bold text-slate-900">{progressLabel}</span>
              <span className="ml-2 text-sm text-slate-500">({progressPercentage}%)</span>
            </div>
            <div className="flex-1">
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
          </div>
        </section>
        {/* Step 1: Loan Details */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-10">
          <div className="bg-white rounded-xl shadow-md p-6 md:p-10 flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-2xl md:text-3xl font-bold mb-0 flex items-center gap-2 ${isStep1Complete ? 'text-green-700' : 'text-slate-900'}`}>Step 1: Loan Details
                {isStep1Complete && (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 border-2 border-green-500 ml-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                )}
              </h2>
            </div>
            <p className="text-slate-600 text-base mb-4">Enter your loan details to begin packaging your application.</p>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label htmlFor="loanAmount" className="block font-medium text-slate-800 mb-1">Loan Amount <span className="text-red-500">*</span></label>
                <input
                  id="loanAmount"
                  type="number"
                  min={0}
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-lg font-semibold bg-slate-50"
                  value={loanAmount}
                  onChange={e => setLoanAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isStep1Complete}
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="loanPurpose" className="block font-medium text-slate-800 mb-1">Loan Purpose <span className="text-red-500">*</span></label>
                <select
                  id="loanPurpose"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-lg bg-slate-50"
                  value={selectedLoanPurpose}
                  onChange={e => setSelectedLoanPurpose(e.target.value)}
                  disabled={isStep1Complete}
                  required
                >
                  <option value="">Select loan purpose...</option>
                  {Object.entries(loanPurposes).map(([key, val]) => (
                    <option key={key} value={key}>{val.title}</option>
                  ))}
                </select>
              </div>
            </div>
            {!isStep1Complete && (
              <div className="text-sm text-slate-500 mt-2">Both fields are required to continue.</div>
            )}
          </div>
        </section>

        {/* Main Content - Step 2: Upload Required Documents */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-10">
          <div className={`bg-white rounded-xl shadow-md p-6 md:p-10 flex flex-col gap-6 transition-opacity ${!isStep1Complete ? 'opacity-50 pointer-events-none select-none' : ''}`}> 
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Step 2: Upload Required Documents</h2>
              <p className="text-slate-600 text-base">Upload each document below to complete your loan package.</p>
            </div>
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6">
                {error}
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documents.length > 0 ? (
                documents.map((doc: Document) => (
                  <div
                    key={doc.id}
                    className={`flex flex-col rounded-2xl border bg-white shadow-md p-6 transition hover:shadow-lg hover:border-blue-200 ${doc.status === 'completed' || doc.status === 'generated' || doc.status === 'uploaded' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
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
                      {doc.status === 'generated' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Generated</span>
                      )}
                      {doc.status === 'completed' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Completed</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Upload button */}
                      {doc.status !== 'completed' && !doc.aiGenerated && (
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
                      {/* Generate button for AI documents */}
                      {doc.status !== 'completed' && doc.aiGenerated && (
                        <button
                          className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                          onClick={() => generateCoverLetter({})}
                        >
                          {doc.status === 'not_started' ? 'Generate' : 'Edit'}
                        </button>
                      )}
                      {/* Mark as completed button */}
                      {(doc.status === 'uploaded' || doc.status === 'generated') && (
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
          </div>
        </section>
      </main>
    );
}

// Show service selection UI if currentStep is 'service_selection'
if (currentStep === 'service_selection') {
    console.log('[LoanPackagingPage] Rendering service selection UI');
    // Render the ACTUAL service selection UI instead of a placeholder
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Start Your Loan Package</h1>
          <p className="text-gray-600 mb-6">Select a service type and loan purpose to begin.</p>
          {/* Service type buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              className={`py-2 px-4 rounded-lg font-semibold ${serviceType === 'loan_packaging' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setServiceType('loan_packaging')}
            >
              Loan Packaging
            </button>
            <button
              className={`py-2 px-4 rounded-lg font-semibold ${serviceType === 'loan_brokering' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setServiceType('loan_brokering')}
            >
              Loan Brokering
            </button>
          </div>
          {/* Loan purpose dropdown */}
          <select
            className="w-full p-2 border rounded-lg mb-4"
            value={selectedLoanPurpose}
            onChange={e => setSelectedLoanPurpose(e.target.value)}
          >
            <option value="">Select Loan Purpose</option>
            {Object.entries(loanPurposes).map(([key, val]) => (
              <option key={key} value={key}>{val.title}</option>
            ))}
          </select>
          {/* Error message */}
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {/* Continue button */}
          <button
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
            onClick={() => handleServiceSelection(serviceType)}
            disabled={isSubmitting}
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  // Fallback view if no step is active (should not happen)
  const validSteps: Step[] = ['dashboard', 'service_selection', 'payment'];
  if (!validSteps.includes(currentStep)) {
    console.warn('[LoanPackagingPage] Fallback "Something went wrong" screen rendered with currentStep:', currentStep);
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      </div>
    );
  }
}
