'use client';

import { useState, useCallback } from 'react';

export interface ToastState {
  message: string;
  visible: boolean;
  showToast: (msg: string, duration?: number) => void;
  hideToast: () => void;
}

let timeoutId: NodeJS.Timeout | null = null;

export const useToast = (): ToastState => {
  const [message, setMessage] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);

  const hideToast = useCallback(() => {
    setVisible(false);
    setMessage('');
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }, []);

  const showToast = useCallback((msg: string, duration: number = 3000) => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setMessage(msg);
    setVisible(true);

    // Set a new timeout to hide the toast
    timeoutId = setTimeout(() => {
      hideToast();
    }, duration);
  }, [hideToast]);

  return { message, visible, showToast, hideToast };
};
