import { useState, useEffect, useRef } from "react";
import Image from 'next/image';

const SAMPLE_PROMPTS = [
  "How do I know if I qualify for a business loan?",
  "What's the typical loan application process?",
  "What documents will I need to apply?"
];

const WELCOME_MESSAGE = {
  role: "assistant",
  content: "👋 Hi! I'm your AI Business Lending Expert. I can help you with questions about business loans, SBA programs, and financing options. Feel free to ask me anything or try one of the sample questions below!"
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handleSend = (text: string = input) => {
    if ((!text.trim() && !input.trim()) || isConnecting) return;

    const messageToSend = text.trim() || input.trim();
    setIsConnecting(true);
    
    try {
      const wsUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'wss://');
      if (!wsUrl) {
        console.error('Supabase URL not configured');
        return;
      }

      const wsEndpoint = `${wsUrl}/functions/v1/chatbot-server`;
      console.log('Attempting to connect to:', wsEndpoint);
      
      socketRef.current = new WebSocket(wsEndpoint);

      socketRef.current.onopen = () => {
        console.log("WebSocket connection established!");
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(messageToSend);
          setMessages((prev) => [...prev, { role: "user", content: messageToSend }]);
        }
        setIsConnecting(false);
      };

      // Add connection timeout
      const timeout = setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          socketRef.current?.close();
          setIsConnecting(false);
        }
      }, 5000);

      socketRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        setIsConnecting(false);
        clearTimeout(timeout);
      };

      socketRef.current.onerror = (error: Event) => {
        console.error("WebSocket Error:", error);
        setIsConnecting(false);
        clearTimeout(timeout);
      };

    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setIsConnecting(false);
    }

    setInput("");
  };

  return (
    <div className="bg-white rounded-lg shadow-lg w-96 h-[66vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-blue-500 text-white flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-white p-1 flex-shrink-0">
          <Image
            src="/images/ai-assistant.png"
            alt="AI Assistant"
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        <div>
          <h3 className="font-semibold">AI Business Lending Expert</h3>
          <p className="text-sm opacity-90">Powered by AI</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.role === "user" ? "flex flex-row-reverse" : "flex"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 mr-2">
                <Image
                  src="/images/ai-assistant.png"
                  alt="AI"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
            )}
            <div
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white shadow-sm"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* Sample Prompts */}
        {messages.length === 1 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(prompt)}
                  className="text-sm bg-white px-3 py-2 rounded-full border hover:bg-gray-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConnecting ? "Connecting..." : "Type your message..."}
            className="flex-1 p-2 border rounded-full text-sm focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={isConnecting}
          />
          <button
            onClick={() => handleSend()}
            disabled={isConnecting}
            className={`p-2 rounded-full ${
              isConnecting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 