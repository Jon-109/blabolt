import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(components)/ui/card'; // Assuming UI Card path
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/(components)/ui/tooltip'; // Assuming UI Tooltip path
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils path

interface DSCRCardProps {
  value: number;
}

// Updated status details interface
interface DSCRStatus {
  color: string;
  icon: string;
  lenderOutlook: string;
  explanation: string;
  nextSteps: string;
}

const getDSCRStatus = (dscr: number): DSCRStatus => {
  if (dscr >= 1.25) {
    return {
      color: 'text-green-600 border-green-500 bg-green-50',
      icon: '✅',
      lenderOutlook: 'Highly Likely.',
      explanation: 'Your cash flow comfortably covers debt payments, exceeding the typical 1.25 lender benchmark. Banks view this positively.',
      nextSteps: "You're in a strong position. Our Loan Brokering service can help find the best terms from interested lenders.",
    };
  } else if (dscr >= 1.0) {
    return {
      color: 'text-yellow-600 border-yellow-500 bg-yellow-50',
      icon: '⚠️',
      lenderOutlook: 'Possibly, but needs strengthening.',
      explanation: 'Your cash flow meets debt payments but is below the ideal 1.25 benchmark. Some lenders may require mitigating factors or a lower loan amount.',
      nextSteps: 'Our Loan Packaging service can highlight strengths to offset this. Brokering can find lenders more flexible with this ratio.',
    };
  } else {
    return {
      color: 'text-red-600 border-red-500 bg-red-50',
      icon: '❌',
      lenderOutlook: 'Unlikely without significant changes.',
      explanation: "Your cash flow doesn't fully cover debt payments and is well below the 1.25 benchmark. Most lenders will see this as high risk.",
      nextSteps: 'Focus on improving cash flow or reducing debt. Our Loan Packaging can help prepare your application for when your DSCR is stronger.',
    };
  }
};

const DSCRCard: React.FC<DSCRCardProps> = ({ value }) => {
  // Destructure new fields
  const { color, icon, lenderOutlook, explanation, nextSteps } = getDSCRStatus(value);
  const formattedDSCR = value.toFixed(2);
  const textColor = color.split(' ')[0]; // Extract text color class

  return (
    <Card className={cn('w-full max-w-md rounded-2xl shadow-md border-2', color)}>
      <CardHeader className="pb-2 text-center relative">
        <CardTitle className="text-lg font-semibold text-gray-700 inline-block">
          Quick Snapshot: DSCR
        </CardTitle>
        <div className="absolute top-0 right-0 pt-3 pr-4">
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <button aria-label="What is DSCR?" className="text-gray-400 hover:text-gray-600">
                  <Info size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm bg-gray-800 text-white p-2 rounded">
                <p><strong>Debt Service Coverage Ratio (DSCR)</strong> measures your cash flow available to pay current debt obligations. Lenders use it to assess loan repayment risk.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      {/* Updated Card Content Structure */}
      <CardContent className="text-center px-4 sm:px-6">
        <div className={cn('text-5xl font-bold mb-1', textColor)}>
          {formattedDSCR} <span className="text-4xl">{icon}</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">Typical Lender Benchmark: 1.25</p>

        {/* Lender Outlook */}
        <div className="text-left mb-4 p-3 rounded-lg border bg-white">
          <p className={cn('font-semibold text-base mb-1', textColor)}>Lender Outlook: {lenderOutlook}</p>
          <p className="text-sm text-gray-700">{explanation}</p>
        </div>

        {/* Next Steps */}
        <div className="text-left p-3 rounded-lg border bg-white">
          <p className="font-semibold text-base mb-1 text-gray-800">Next Steps:</p>
          <p className="text-sm text-gray-700">{nextSteps}</p>
        </div>

        {/* PDF Note */}
        <p className="text-xs text-gray-500 mt-4">
          Dive deeper into the analysis and find personalized recommendations in the full PDF report sent to your email.
        </p>
      </CardContent>
    </Card>
  );
};

export default DSCRCard;
