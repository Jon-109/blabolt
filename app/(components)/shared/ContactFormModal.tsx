"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeadInterestForm from '@/app/(components)/shared/LeadInterestForm';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
}

export default function ContactFormModal({ isOpen, onClose, source }: ContactFormModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-3"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[calc(100dvh-1rem)] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-1.5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors group"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            </button>

            <div className="custom-scrollbar max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-h-[calc(100dvh-1.5rem)]">
              <LeadInterestForm variant="modal" source={source} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
