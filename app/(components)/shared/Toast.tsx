"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded shadow-lg animate-fade-in">
      {message}
    </div>
  );
}

// Simple hook for toast usage
export function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const showToast = (msg: string) => {
    setMessage(msg);
    setVisible(true);
  };

  const closeToast = () => setVisible(false);

  // Return state and functions needed to render the Toast component externally
  return { showToast, message, visible, closeToast };
}
