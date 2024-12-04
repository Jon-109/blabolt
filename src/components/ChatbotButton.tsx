'use client';

import React, { useState, useCallback } from 'react';
import Chatbot from "./Chatbot";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    setIsLoading(true);
    try {
      setIsOpen(!isOpen);
    } catch (error) {
      console.error('Error toggling chatbot:', error);
      // You could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-4 right-4 flex flex-col items-center">
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:bg-blue-600 
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
              ${isOpen ? 'translate-x-96' : ''}`}
            style={{ 
              backgroundColor: '#007bff',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            aria-label="Open AI Chat"
          >
            {isLoading ? (
              <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            )}
          </button>
          <span 
            className="text-xs font-bold text-white px-3 py-1.5 rounded-full mt-2 shadow-md
              transition-opacity duration-300 hover:opacity-90"
            style={{ 
              backgroundColor: '#007bff',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            AI Expert
          </span>
        </div>
      )}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-40">
          <button 
            onClick={handleToggle}
            disabled={isLoading}
            className="absolute top-2 right-2 text-white bg-gray-600 hover:bg-gray-700 
              rounded-full p-1.5 z-50 transition-colors duration-300"
            aria-label="Close AI Chat"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
          <Chatbot />
        </div>
      )}
    </>
  );
}