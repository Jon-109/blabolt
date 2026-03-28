'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/(components)/ui/card';
import { ReactNode } from 'react';

interface SectionCardProps {
  icon: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({ icon, title, description, children, className = '' }: SectionCardProps) {
  return (
    <Card className={`${className} border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30`}>
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-slate-600 mt-1.5 text-sm leading-relaxed">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}
