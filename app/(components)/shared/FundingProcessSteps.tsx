import React from 'react';
import { ClipboardCheck, FileSearch, HandshakeIcon, LineChart, ArrowRight } from 'lucide-react';
import MobileFundingProcessCarousel from './MobileFundingProcessCarousel';

const steps = [
  {
    icon: FileSearch,
    title: "Identify Your Business Need",
    description: "Your business needs funding—whether for growth, expansion, or new opportunities."
  },
  {
    icon: LineChart,
    title: "Cash Flow Analysis",
    description: "We run the math to show what you can comfortably afford the loan you want."
  },
  {
    icon: ClipboardCheck,
    title: "Application Preparation",
    description: "We build the documents underwriters look for—no paperwork stress."
  },
  {
    icon: HandshakeIcon,
    title: "Lender Matching",
    description: "We connect you with lenders who best match your business needs and financial profile."
  }
];

const FundingProcessSteps = () => {
  return (
    <section className="py-6 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Our Simple Process
          </h2>
          <p className="mt-2 text-base text-gray-600">
            We make securing business funding straightforward and efficient
          </p>
        </div>
        {/* Steps row: each step is icon + text, with arrows between */}
        <div className="hidden lg:flex max-w-6xl mx-auto items-start justify-between relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center flex-1 min-w-0 text-center px-2">
                  <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center border-4 border-white shadow-xl mb-2">
                    <Icon className="w-8 h-8 text-primary-blue" />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight size={36} className="mx-6 text-blue-600 flex-shrink-0 self-center" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {/* Mobile carousel for max-w-md screens */}
        <div className="block md:hidden w-full">
          <MobileFundingProcessCarousel steps={steps} />
        </div>
        {/* Fallback grid for tablets (md) only */}
        <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-primary-blue/10 rounded-full flex items-center justify-center mb-2 border-2 border-white shadow">
                  <Icon className="w-7 h-7 text-primary-blue" />
                </div>
                <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                <p className="text-gray-600 text-xs">{step.description}</p>
              </div>
            );
          })}
        </div>
        <div className="lg:hidden grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto hidden">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%_-_1rem)] w-full h-0.5 bg-gray-200" />
                )}
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-blue" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FundingProcessSteps;
