'use client';

import { useState } from 'react';
import { Bot, X } from 'lucide-react';

export default function ChatbotButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="fixed bottom-6 right-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 group"
      aria-label="Chat with Lending Advocate AI"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        // Chatbot logic will be implemented here
        console.log('Chatbot clicked');
      }}
    >
      <Bot className="w-6 h-6" />
      <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
        isHovered ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'
      }`}>
        Lending Advocate AI
      </span>
    </button>
  );
}