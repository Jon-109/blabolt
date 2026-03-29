import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(components)/ui/card'; // Assuming UI Card path
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/(components)/ui/tooltip'; // Assuming UI Tooltip path
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils path
import { DSCR_BENCHMARK, getDscrBand } from '@/lib/financial/dscr';

interface DSCRCardProps {
  value: number;
}

const DSCRCard: React.FC<DSCRCardProps> = ({ value }) => {
  const band = getDscrBand(value);
  const { label, badgeClassName, valueClassName } = band.quickStatus;
  const { lenderOutlook, explanation, nextSteps } = band.card;
  const formattedDSCR = value.toFixed(2);

  return (
    <Card className={cn('w-full max-w-md rounded-2xl border-2 shadow-md', band.quickStatus.borderClassName, band.quickStatus.panelClassName)}>
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
        <div className={cn('mb-1 text-5xl font-bold', valueClassName)}>
          {formattedDSCR}
        </div>
        <div className={cn('mx-auto mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold', badgeClassName)}>
          {label}
        </div>
        <p className="text-sm text-gray-500 mb-4">Typical Lender Benchmark: {DSCR_BENCHMARK.toFixed(2)}x</p>

        {/* Lender Outlook */}
        <div className="text-left mb-4 p-3 rounded-lg border bg-white">
          <p className={cn('font-semibold text-base mb-1', valueClassName)}>Lender Outlook: {lenderOutlook}</p>
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
