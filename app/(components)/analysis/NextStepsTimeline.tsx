import React from 'react';
import { FileText, Briefcase, Handshake } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Review Your Analysis',
    description: 'Check your email for the detailed PDF reports.',
  },
  {
    icon: Briefcase,
    title: 'Choose Your Service',
    description: 'Decide if Loan Packaging or Brokering fits your needs.',
  },
  {
    icon: Handshake,
    title: 'Secure Funding',
    description: 'Let us help you prepare your application or find the best loan offer.',
  },
];

const NextStepsTimeline: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 md:mb-8 text-gray-800">Your Path Forward</h2>
      {/* Desktop Timeline (Hidden on small screens) */}
      <div className="hidden md:flex justify-center items-start space-x-4 lg:space-x-8 relative">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center text-center w-1/3 max-w-xs">
              <div className="bg-blue-500 text-white rounded-full h-12 w-12 flex items-center justify-center mb-2 shadow-md">
                <step.icon size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-1 text-gray-700">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-blue-200 self-center mt-[-2.5rem] relative top-[-1rem]">
                <div className="h-1 bg-blue-500 w-full"></div> {/* Simple line connector */}
             </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile Timeline (Visible on small screens) */}
      <div className="md:hidden flex flex-col space-y-6 items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start w-full max-w-sm">
            <div className="bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center mr-4 flex-shrink-0 shadow">
               <span className="font-bold">{index + 1}</span>
            </div>
            <div>
              <h3 className="font-semibold text-md mb-0.5 text-gray-700">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextStepsTimeline;
