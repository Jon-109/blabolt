'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/helpers/client'
import { loanPurposes } from '@/lib/loanPurposes'
import Image from 'next/image'

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
  templateUrl?: string;
  aiGenerated?: boolean;
}

export default function LoanPackagingPage() {
  // User authentication state
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  
  // Service selection and flow state
  const [serviceType, setServiceType] = useState<ServiceType>(null)
  const [currentStep, setCurrentStep] = useState<Step>('service_selection')
  const [selectedLoanPurpose, setSelectedLoanPurpose] = useState('')
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
  
  // Handle service type selection
  const handleServiceSelection = async (type: ServiceType) => {
    setServiceType(type);
    
    if (!selectedLoanPurpose) {
      setError('Please select a loan purpose');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    if (type === 'loan_packaging') {
      // Create a Stripe checkout session
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            productType: 'loan_packaging',
            loanPurpose: selectedLoanPurpose
          })
        });
        
        const data = await response.json();
        
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          throw new Error('Failed to create checkout session');
        }
      } catch (err) {
        console.error('Error creating checkout session:', err);
        setError('Failed to process payment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (type === 'loan_brokering') {
      // Redirect to JotForm for loan brokering agreement
      // Note: Replace with actual JotForm URL
      window.location.href = 'https://form.jotform.com/loan-brokering-agreement';
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg text-gray-600">Checking authentication...</span>
      </div>
    )
  }

  if (!userEmail) {
    // Don't render anything while redirecting
    return null;
  }
  
  // Service Selection Step
  if (currentStep === 'service_selection') {
    return (
      <main className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Business Lending Services</h1>
            
            {/* Loan Purpose Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">What is your loan purpose?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  className="p-3 border border-gray-300 rounded-lg w-full"
                  value={selectedLoanPurpose}
                  onChange={(e) => setSelectedLoanPurpose(e.target.value)}
                >
                  <option value="">Select a loan purpose</option>
                  {Object.entries(loanPurposes).map(([key, purpose]) => (
                    <option key={key} value={key}>{purpose.title}</option>
                  ))}
                </select>
              </div>
              {selectedLoanPurpose && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700">{loanPurposes[selectedLoanPurpose]?.description}</p>
                </div>
              )}
            </div>
            
            {/* Service Type Selection */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose your service type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Loan Packaging Option */}
              <div className="border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Loan Packaging</h3>
                <p className="text-gray-600 mb-4">We'll help you prepare a professional loan package you can download and share with lenders.</p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Document organization & formatting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Professional cover letter</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Secure sharing with lenders</span>
                  </li>
                </ul>
                <div className="text-xl font-bold text-gray-900 mb-4">$499</div>
                <button 
                  onClick={() => handleServiceSelection('loan_packaging')}
                  disabled={isSubmitting || !selectedLoanPurpose}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Select Loan Packaging'}
                </button>
              </div>
              
              {/* Loan Brokering Option */}
              <div className="border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Loan Brokering</h3>
                <p className="text-gray-600 mb-4">We'll match you with the right lenders and manage the application process for you.</p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Everything in Loan Packaging</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Lender matchmaking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Application management</span>
                  </li>
                </ul>
                <div className="text-xl font-bold text-gray-900 mb-4">Commission based</div>
                <button 
                  onClick={() => handleServiceSelection('loan_brokering')}
                  disabled={isSubmitting || !selectedLoanPurpose}
                  className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Select Loan Brokering'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }
  
  // Dashboard view after payment/agreement completion
  if (currentStep === 'dashboard') {
    // Calculate progress percentage
    const totalDocuments = documents.length || 1; // Avoid division by zero
    const progressPercentage = Math.round((completedDocuments / totalDocuments) * 100);
    
    // Define the default document list if none exists
    const defaultDocuments: Document[] = [
      {
        id: 'cover-letter',
        name: 'Cover Letter',
        description: 'A professional letter explaining your loan request',
        status: 'not_started',
        required: true,
        aiGenerated: true
      },
      {
        id: 'business-plan',
        name: 'Business Plan',
        description: 'A detailed plan outlining your business strategy and goals',
        status: 'not_started',
        required: true,
        templateUrl: '/templates/business-plan-template.docx'
      },
      {
        id: 'financial-statements',
        name: 'Financial Statements',
        description: 'Balance sheet, income statement, and cash flow statement',
        status: 'not_started',
        required: true,
        templateUrl: '/templates/financial-statements-template.xlsx'
      },
      {
        id: 'tax-returns',
        name: 'Business Tax Returns',
        description: 'Last 2-3 years of business tax returns',
        status: 'not_started',
        required: true
      },
      {
        id: 'profit-loss',
        name: 'Profit & Loss Statement',
        description: 'Detailed profit and loss statement for the past 12 months',
        status: 'not_started',
        required: true,
        templateUrl: '/templates/profit-loss-template.xlsx'
      },
      {
        id: 'bank-statements',
        name: 'Bank Statements',
        description: 'Last 3-6 months of business bank statements',
        status: 'not_started',
        required: true
      },
      {
        id: 'personal-financial-statement',
        name: 'Personal Financial Statement',
        description: 'Statement of personal assets, liabilities, and net worth',
        status: 'not_started',
        required: true,
        templateUrl: '/templates/personal-financial-statement.pdf'
      },
      {
        id: 'business-licenses',
        name: 'Business Licenses & Permits',
        description: 'Copies of all relevant business licenses and permits',
        status: 'not_started',
        required: true
      },
      {
        id: 'collateral-documentation',
        name: 'Collateral Documentation',
        description: 'Documentation for any assets offered as collateral',
        status: 'not_started',
        required: false
      }
    ];
    
    // If no documents are loaded yet, use the default list
    useEffect(() => {
      if (documents.length === 0 && loanPackagingId) {
        // Initialize documents in the database if they don't exist
        const initializeDocuments = async () => {
          try {
            // Check if documents already exist
            const { data, error } = await supabase
              .from('loan_packaging_documents')
              .select('id')
              .eq('loan_packaging_id', loanPackagingId);
              
            if (error) throw error;
            
            if (!data || data.length === 0) {
              // No documents exist, create them
              const documentsWithPackagingId = defaultDocuments.map((doc: Document) => ({
                ...doc,
                loan_packaging_id: loanPackagingId
              }));
              
              const { error: insertError } = await supabase
                .from('loan_packaging_documents')
                .insert(documentsWithPackagingId);
                
              if (insertError) throw insertError;
              
              // Reload documents
              loadDocuments(loanPackagingId);
            }
          } catch (err) {
            console.error('Error initializing documents:', err);
          }
        };
        
        initializeDocuments();
      }
    }, [loanPackagingId, documents.length]);
    
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
      <main className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar with Progress Tracker */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {serviceType === 'loan_packaging' ? 'Loan Package' : 'Loan Brokering'}
                </h2>
                
                {/* Progress Circle */}
                <div className="flex justify-center mb-6">
                  <div className="relative h-32 w-32">
                    {/* Background circle */}
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                      />
                      {/* Progress circle */}
                      <circle
                        className="text-blue-600"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{progressPercentage}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress text */}
                <p className="text-center text-gray-700 mb-6">
                  You've completed {completedDocuments} of {totalDocuments} documents
                </p>
                
                {/* Next action recommendation */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2">Next Step:</h3>
                  <p className="text-gray-700">
                    {completedDocuments === 0 ? 
                      "Start by uploading your business plan or generating a cover letter." :
                      completedDocuments === totalDocuments ? 
                      "All documents are complete! You can now finalize your loan package." :
                      `Continue uploading the remaining documents (${totalDocuments - completedDocuments} left).`
                    }
                  </p>
                </div>
                
                {/* Finalize button - only show when all documents are complete */}
                {completedDocuments === totalDocuments && (
                  <button
                    onClick={handleFinalization}
                    className="w-full mt-6 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {serviceType === 'loan_packaging' ? 'Download Package' : 'Submit to Broker'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Main Content - Document Checklist */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {serviceType === 'loan_packaging' ? 'Loan Package Builder' : 'Loan Brokering Submission'}
                </h1>
                <p className="text-gray-600 mb-8">
                  {selectedLoanPurpose && loanPurposes[selectedLoanPurpose] ? 
                    `Purpose: ${loanPurposes[selectedLoanPurpose].title}` : 
                    'Complete all required documents to finalize your loan package'}
                </p>
                
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6">
                    {error}
                  </div>
                )}
                
                {/* Document list */}
                <div className="space-y-6">
                  {documents.length > 0 ? (
                    documents.map((doc: Document) => (
                      <div 
                        key={doc.id} 
                        className={`border rounded-lg p-6 ${doc.status === 'completed' || doc.status === 'generated' || doc.status === 'uploaded' ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                              {doc.name}
                              {doc.required && <span className="ml-2 text-xs text-red-500">*Required</span>}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                            
                            {/* Status indicator */}
                            <div className="mt-2">
                              {doc.status === 'not_started' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Not Started
                                </span>
                              )}
                              {doc.status === 'uploaded' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Uploaded
                                </span>
                              )}
                              {doc.status === 'generated' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Generated
                                </span>
                              )}
                              {doc.status === 'completed' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {/* Template button */}
                            {doc.templateUrl && (
                              <a 
                                href={doc.templateUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                View Template
                              </a>
                            )}
                            
                            {/* Upload button */}
                            {doc.status !== 'completed' && !doc.aiGenerated && (
                              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                                Upload File
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleFileUpload(doc.id, e.target.files[0]);
                                    }
                                  }} 
                                />
                              </label>
                            )}
                            
                            {/* Generate button for AI documents */}
                            {doc.status !== 'completed' && doc.aiGenerated && (
                              <button 
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                onClick={() => {
                                  // Open a modal or form to collect information for generation
                                  // For now, just simulate generating with empty data
                                  generateCoverLetter({});
                                }}
                              >
                                {doc.status === 'not_started' ? 'Generate' : 'Edit'}
                              </button>
                            )}
                            
                            {/* Mark as completed button */}
                            {(doc.status === 'uploaded' || doc.status === 'generated') && (
                              <button 
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                onClick={() => updateDocumentStatus(doc.id, 'completed')}
                              >
                                Mark as Completed
                              </button>
                            )}
                          </div>
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
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  // Fallback view if no step is active (should not happen)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">We couldn't determine your current step in the loan packaging process.</p>
        <button
          onClick={() => setCurrentStep('service_selection')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
