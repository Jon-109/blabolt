'use client'

import { useState, useEffect, useRef } from 'react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/app/(components)/ui/tooltip'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/app/(components)/ui/accordion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/helpers/client'
import { loanPurposes } from '@/lib/loanPurposes'
import Image from 'next/image'
import Testimonials from '@/app/(components)/shared/Testimonials'
import LoanPurposeSelector from '@/app/(components)/LoanPurposeSelector'

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
  // State variables for the component
  const [loanAmount, setLoanAmount] = useState<number | ''>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loanPackagingId, setLoanPackagingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('service_selection');
  const [selectedLoanPurpose, setSelectedLoanPurpose] = useState('');
  const [coverLetterApproved, setCoverLetterApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStep1Edit, setShowStep1Edit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showIncludedModal, setShowIncludedModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedDocuments, setCompletedDocuments] = useState(0);
  
  // Refs
  const loanAmountInputRef = useRef<HTMLInputElement>(null);
  
  // Router
  const router = useRouter();
  
  // Helper to get the label for a selected loan purpose key
  function getLoanPurposeLabel(key: string): string {
    // Check all level 2 options
    for (const cat of Object.values(loanPurposes)) {
      if (Array.isArray(cat)) {
        const found = cat.find((opt: any) => opt.key === key);
        if (found) return found.label;
      }
    }
    return key;
  }

  // Mount effect
  useEffect(() => { setMounted(true); }, []);

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
      setError('Failed to update document status. Please try again.');
    }
  };
  
  // Define file upload handler
  const handleFileUpload = async (documentId: string, file: File) => {
    if (!loanPackagingId || !userId) return;
    
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
  
  // Dashboard view after payment/agreement completion
  const renderDashboard = () => {
    if (currentStep === 'dashboard') {
      // Progress logic for 3 steps
      const isLoanAmountEntered = !!loanAmount;
      const isLoanPurposeSelected = !!selectedLoanPurpose;
      const isStep1Complete = isLoanAmountEntered && isLoanPurposeSelected;
      const docsUploaded = documents.filter((doc: Document) => doc.status === 'uploaded' || doc.status === 'completed').length;
      const totalDocs = documents.length || 1;
      const docsPct = Math.round((docsUploaded / totalDocs) * 80); // Step 2 = 80% max
      const isStep2Complete = docsUploaded === totalDocs;
      const isStep3Complete = coverLetterApproved; // Placeholder for Step 3 logic
      let progressPercentage = 0;
      if (isLoanAmountEntered) progressPercentage += 10;
      if (isLoanPurposeSelected) progressPercentage += 10;
      if (isStep2Complete) progressPercentage += 80;
      let progressLabel = '';
      if (!isLoanAmountEntered) progressLabel = 'Step 1: Enter Loan Amount';
      else if (!isLoanPurposeSelected) progressLabel = 'Step 1: Select Loan Purpose';
      else if (!isStep2Complete) progressLabel = `Step 2: Upload Documents (${docsUploaded}/${totalDocs})`;
      else if (!isStep3Complete) progressLabel = 'Step 3: Cover Letter';
      else progressLabel = 'All steps complete!';
      
      return (
        <div>
          {/* TODO: Replace with your dashboard JSX */}
          Loan Packaging Dashboard Placeholder
        </div>
      );
    }
    return null;
  };
  
  return renderDashboard();
}