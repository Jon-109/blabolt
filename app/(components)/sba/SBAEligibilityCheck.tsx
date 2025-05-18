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
    // Although the button is disabled unless allChecked is true,
    // we double-check here before showing the result.
    if (allChecked) {
        setShowResult(true);
    }
    // Note: The 'Warning' state logic is not reachable with the current button disabled logic.
    // If requirements change to allow showing results even if not all checked, this would need adjustment.
  };

  return (
    <Card className="rounded-2xl shadow-md p-2 sm:p-4 bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-semibold text-gray-800 dark:text-white">
          Quick SBA 7(a) Eligibility Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4 mb-6">
          {checkboxStatements.map((item, index) => (
            <li key={item.id} className="flex items-start space-x-3">
              <Checkbox
                id={item.id}
                checked={checkedItems[index]}
                onCheckedChange={() => handleCheckboxChange(index)}
                aria-describedby={`${item.id}-label`}
                className="mt-1"
              />
              <Label
                htmlFor={item.id}
                id={`${item.id}-label`}
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {item.text}
              </Label>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleShowResult}
          disabled={!allChecked}
          className="w-full mb-4"
          aria-live="polite" // Announce result state change
        >
          Show My Result
        </Button>

        {showResult && (
          <div aria-live="polite"> {/* Wrapper for announcement */}
            {allChecked ? (
              <Alert variant="success" className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle className="font-semibold text-green-800 dark:text-green-200">Eligibility Looks Promising!</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Great! You appear to meet the basic SBA 7(a) eligibility rules. Submit your details and we’ll confirm within 24 hours.
                </AlertDescription>
              </Alert>
            ) : (
              // This state is currently unreachable due to button logic
              <Alert variant="warning" className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
                 {/* Optional: Add Warning Icon if desired */}
                <AlertTitle className="font-semibold text-yellow-800 dark:text-yellow-200">Review Needed</AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-300">
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
