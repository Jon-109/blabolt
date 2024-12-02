import React from 'react';

interface JotformButtonProps {
  formUrl: string;
  children: React.ReactNode;
  className?: string;
}

export default function JotformButton({
  formUrl,
  children,
  className = '',
}: JotformButtonProps) {
  return (
    <a
      href={formUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block px-8 py-4 rounded-lg font-semibold transition-colors ${className}`}
    >
      {children}
    </a>
  );
}
