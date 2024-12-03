'use client';

import React, { useState } from 'react';
import { Bot, Send, X } from 'lucide-react';

interface Message {
  content: string;
  isUser: boolean;
}

interface APIError {
  response?: {
    json(): Promise<{ error: string }>;
  };
}

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { content: "Hi! I'm BLA's AI Assistant. I can help you understand loan processes, calculate payments, and answer questions about our lending for your business. How can I assist you today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { content: userMessage, isUser: true }]);

    try {
      // Prepare messages for API
      const apiMessages = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));
      apiMessages.push({ role: 'user', content: userMessage });

      // Call our API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { content: data.content, isUser: false }]);
    } catch (error: unknown) {
      console.error('Chat error:', error);
      let errorMessage = "I apologize, but I'm having trouble connecting right now. Please try again later.";
      
      if (error && typeof error === 'object' && 'response' in error) {
        try {
          const errorResponse = await (error as APIError).response?.json();
          if (errorResponse?.error) {
            errorMessage = errorResponse.error;
          }
        } catch {
          // If JSON parsing fails, use default error message
        }
      }

      setMessages(prev => [...prev, {
        content: errorMessage,
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button with Label */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 group"
      >
        <Bot className="w-6 h-6" />
        <span className="text-sm font-medium">Ask BLA AI</span>
      </button>

      {/* Side Panel Chat Modal */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl flex flex-col z-50">
          {/* Modal Header */}
          <div className="p-4 border-b flex items-center justify-between bg-blue-600 text-white">
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">BLA AI Assistant</h3>
                <p className="text-xs text-blue-100">Powered by Business Lending Advocate</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "AI is thinking..." : "Ask me anything about business loans..."}
              disabled={isLoading}
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-400"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{isLoading ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}