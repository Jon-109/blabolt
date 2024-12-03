'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, ArrowRight, RefreshCcw, AlertCircle } from 'lucide-react'

type Question = {
  id: number;
  text: string;
  requiredAnswer: boolean;
  ineligibilityMessage: string;
}

const SBAEligibilityCheck = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: boolean }>({})
  const [showResults, setShowResults] = useState(false)

  const questions: Question[] = [
    {
      id: 1,
      text: "Is your business a for-profit entity?",
      requiredAnswer: true,
      ineligibilityMessage: "SBA 7(a) loans are only available to for-profit businesses."
    },
    {
      id: 2,
      text: "Is your business registered and operating in the United States or its territories?",
      requiredAnswer: true,
      ineligibilityMessage: "Business must be U.S.-based or operate in U.S. territories."
    },
    {
      id: 3,
      text: "Does your business have less than $20 million in annual revenue?",
      requiredAnswer: true,
      ineligibilityMessage: "Business likely exceeds SBA size standards."
    },
    {
      id: 4,
      text: "Does your business have fewer than 500 employees?",
      requiredAnswer: true,
      ineligibilityMessage: "Business likely exceeds SBA size standards."
    },
    {
      id: 5,
      text: "Is your business independently owned and operated (not controlled by another company)?",
      requiredAnswer: true,
      ineligibilityMessage: "Affiliations may disqualify the business."
    },
    {
      id: 6,
      text: "Do you or the other owners hold at least 20% of the business?",
      requiredAnswer: true,
      ineligibilityMessage: "At least one owner must have a 20% or greater stake."
    },
    {
      id: 7,
      text: "Have you or your business ever defaulted on a federal loan or had unresolved tax liens or judgments?",
      requiredAnswer: false,
      ineligibilityMessage: "Defaults or unresolved liens/judgments disqualify the applicant."
    },
    {
      id: 8,
      text: "Is your business or any owner currently involved in bankruptcy proceedings?",
      requiredAnswer: false,
      ineligibilityMessage: "Active bankruptcy disqualifies the business."
    },
    {
      id: 9,
      text: "Will the loan be used for eligible purposes like working capital, equipment, expansion, or refinancing?",
      requiredAnswer: true,
      ineligibilityMessage: "Loan purpose must align with SBA guidelines."
    },
    {
      id: 10,
      text: "Is the loan for any restricted purposes, such as gambling, speculative investments, or adult entertainment?",
      requiredAnswer: false,
      ineligibilityMessage: "Restricted purposes disqualify the application."
    },
    {
      id: 11,
      text: "Is any owner or key associate currently incarcerated, on probation, on parole, or under indictment for a felony or financial crime?",
      requiredAnswer: false,
      ineligibilityMessage: "Legal status disqualifies the application."
    },
    {
      id: 12,
      text: "Is your business part of a group of affiliated businesses where the combined revenue exceeds $20 million or combined employees exceed 500?",
      requiredAnswer: false,
      ineligibilityMessage: "Affiliates must meet size standards as a group."
    }
  ]

  const handleAnswer = (answer: boolean) => {
    const currentQuestion = questions[currentStep]
    const isAnswerDisqualifying = answer !== currentQuestion.requiredAnswer

    if (isAnswerDisqualifying) {
      setAnswers({ ...answers, [currentQuestion.id]: answer })
      setShowResults(true)
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: answer })
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        setShowResults(true)
      }
    }
  }

  const resetQuiz = () => {
    setCurrentStep(0)
    setAnswers({})
    setShowResults(false)
  }

  if (showResults) {
    const failedQuestion = questions.find(q => answers[q.id] !== q.requiredAnswer)
    const isEligible = !failedQuestion

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {isEligible ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-4">
              Great News! You May Be Eligible
            </h3>
            <p className="text-gray-600 mb-6">
              Based on your responses, your business appears to meet the basic eligibility requirements for an SBA 7(a) loan. 
              Let's take the next step in securing funding for your business.
            </p>
            <div className="space-y-4">
              <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Start Your Application
              </button>
              <button 
                onClick={resetQuiz}
                className="w-full px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Take Quiz Again
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-4">
              Unable to Proceed with SBA 7(a) Loan
            </h3>
            <div className="bg-red-50 p-6 rounded-lg mb-6">
              <p className="text-red-900 font-semibold mb-2">Reason for Ineligibility:</p>
              <p className="text-red-800">{failedQuestion?.ineligibilityMessage}</p>
            </div>
            <div className="space-y-4">
              <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Explore Alternative Funding Options
              </button>
              <button 
                onClick={resetQuiz}
                className="w-full px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Take Quiz Again
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">SBA 7(a) Loan Eligibility Check</h3>
          <span className="text-sm text-gray-500">Question {currentStep + 1} of {questions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-lg font-medium mb-6">{questions[currentStep].text}</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(true)}
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            No
          </button>
        </div>
      </div>

      {currentStep > 0 && (
        <button
          onClick={() => setCurrentStep(currentStep - 1)}
          className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Previous Question
        </button>
      )}
    </div>
  )
}

export default SBAEligibilityCheck 