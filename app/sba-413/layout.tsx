import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'SBA Form 413 Personal Financial Statement Generator',
  description:
    'Complete a guided SBA Form 413 Personal Financial Statement, save your progress securely, and generate a lender-ready PDF.',
  alternates: {
    canonical: '/services/templates/personal-financial-statement',
  },
};

export default function SBA413Layout({ children }: { children: ReactNode }) {
  return children;
}
