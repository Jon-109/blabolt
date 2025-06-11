'use client'

import React, { useState, useMemo } from 'react'
import { CheckCircle } from 'lucide-react'

// Assuming these imports exist based on project structure/shadcn setup
import { Button } from '@/app/(components)/ui/button'
import { Checkbox } from '@/app/(components)/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/app/(components)/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(components)/ui/card'
import { Label } from '@/app/(components)/ui/label' // Import Label

const checkboxStatements = [
  { id: 'sba-check-1', text: 'My business operates for profit and is actively running.' },
  { id: 'sba-check-2', text: 'Our primary office and employees are located in the United States.' },
  { id: 'sba-check-3', text: 'We meet SBA small-business size standards for our industry.' },
  { id: 'sba-check-4', text: 'Our industry is eligible (we are not passive real estate, lending, or another excluded activity).' },
  { id: 'sba-check-5', text: 'We have been unable to secure similar financing elsewhere on reasonable terms.' },
  { id: 'sba-check-6', text: 'The owners and the business are current on all federal debt and taxes.' },
  { id: 'sba-check-7', text: 'We can demonstrate sufficient cash flow to repay the loan.' },
]

const SBAEligibilityCheck = () => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(Array(checkboxStatements.length).fill(false));
  const [showResult, setShowResult] = useState(false);

  const handleCheckboxChange = (index: number) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = !newCheckedItems[index];
    setCheckedItems(newCheckedItems);
    // Hide result if a checkbox is unchecked after showing result
    if (showResult) {
        setShowResult(false);
    }
  };

  const allChecked = useMemo(() => checkedItems.every(Boolean), [checkedItems]);

  const handleShowResult = () => {
    setShowResult(true);
  };

  return (
    <Card className="relative rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50/80 via-white/90 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-2 sm:p-8 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-center text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-100 mb-2 drop-shadow-sm">
          Quick SBA 7(a) Eligibility Check
        </CardTitle>
        <p className="text-center text-base text-gray-600 dark:text-gray-300 mb-2">
          Instantly see if you meet the key requirements
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-5 mb-8">
          {checkboxStatements.map((item, index) => (
            <li key={item.id} className="flex items-start gap-4 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 px-4 py-3 shadow-sm transition hover:shadow-md">
              <Checkbox
                id={item.id}
                checked={checkedItems[index]}
                onCheckedChange={() => handleCheckboxChange(index)}
                aria-describedby={`${item.id}-label`}
                className="mt-1 scale-110 accent-blue-600 focus:ring-2 focus:ring-blue-400"
              />
              <Label
                htmlFor={item.id}
                id={`${item.id}-label`}
                className="text-base text-gray-800 dark:text-gray-200 cursor-pointer font-medium"
              >
                {item.text}
              </Label>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleShowResult}
          className="w-full mb-6 py-3 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-150 shadow-lg shadow-blue-100/30 dark:shadow-blue-900/30 border-2 border-blue-500/20 hover:border-blue-600 active:border-blue-700 focus:border-blue-800"
          aria-live="polite"
        >
          Show My Result
        </Button>

        {showResult && (
          <div aria-live="polite">
            {allChecked ? (
              <Alert variant="default" className="bg-green-50/90 dark:bg-green-900/40 border-green-200 dark:border-green-700 shadow-green-100/30 dark:shadow-green-900/20 shadow">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                <AlertTitle className="font-bold text-green-900 dark:text-green-200 text-lg">Eligibility Looks Promising!</AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-300 text-base">
                  Great! You appear to meet the basic SBA 7(a) eligibility rules. Submit your details and we’ll confirm within 24 hours.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="bg-yellow-50/90 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-700 shadow-yellow-100/30 dark:shadow-yellow-900/20 shadow flex flex-col">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-.01-6a9 9 0 110 18 9 9 0 010-18zm0 4v2m0 4h.01" /></svg>
                <AlertTitle className="font-bold text-yellow-900 dark:text-yellow-200 text-lg">Review Needed</AlertTitle>
                <AlertDescription className="text-yellow-800 dark:text-yellow-300 text-base">
                  It looks like you may not meet every SBA rule. Still unsure? Contact us and we’ll review your situation personally.
                </AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              *This quick check is for guidance only. Final eligibility is determined by an SBA-approved lender.*
            </p>
          </div>
        )}
         {!showResult && (
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                *This quick check is for guidance only. Final eligibility is determined by an SBA-approved lender.*
            </p>
         )}
      </CardContent>
    </Card>
  );
};

export default SBAEligibilityCheck;
