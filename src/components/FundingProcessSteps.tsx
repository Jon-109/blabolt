import React from 'react';
import { ChevronRight, FileCheck, DollarSign, CheckCircle } from 'lucide-react';

const FundingProcessSteps = () => {
  const steps = [
    {
      title: 'Assess Your Cash Flow',
      description: 'Begin with a free, high-level cash flow assessment to understand your financial standing. For a bank-level evaluation that strengthens your application, upgrade to our Comprehensive Cash Flow Analysis.',
      icon: FileCheck,
      ctaText: 'Start Free Assessment',
      stepNumber: 1
    },
    {
      title: 'Prepare Your Loan Package',
      description: 'We craft a complete, lender-ready application tailored to showcase your strengths—including a compelling cover letter. A strong cover letter sets you apart and boosts your chances of approval.',
      icon: DollarSign,
      ctaText: 'Learn More',
      stepNumber: 2
    },
    {
      title: 'Find and Secure the Right Loan',
      description: 'With our loan brokering service, we connect you with the best lenders for your needs. From application submission to securing funding, we\'re with you every step of the way.',
      icon: CheckCircle,
      ctaText: 'Learn More',
      stepNumber: 3
    }
  ];

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">How It Works: A Simple 3-Step Process to Secure Funding</h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.title} 
              className="flex-1 bg-white p-6 rounded-xl shadow-lg relative border-2 border-transparent hover:border-blue-500 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 -ml-2 -mt-2 text-8xl font-extrabold text-blue-50 opacity-50 z-0">
                {step.stepNumber}
              </div>
              
              <div className="relative z-10 flex items-center mb-4">
                {React.createElement(step.icon, { className: "w-10 h-10 text-blue-600 mr-4" })}
                <h3 className="text-xl font-semibold text-gray-800">{step.title}</h3>
              </div>
              
              <div className="relative z-10">
                <p className="text-gray-600 mb-4 min-h-[120px]">{step.description}</p>
                
                {step.ctaText && (
                  <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                    {step.ctaText}
                  </button>
                )}
              </div>
              
              {index < steps.length - 1 && (
                <>
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-blue-200" />
                  </div>
                  <div className="block md:hidden absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-blue-200 rotate-90" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FundingProcessSteps;