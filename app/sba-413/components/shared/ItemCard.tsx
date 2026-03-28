'use client';

import { Card, CardContent } from '@/app/(components)/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

interface ItemCardProps {
  index: number;
  title: string;
  onRemove: () => void;
  children: ReactNode;
}

export default function ItemCard({ index, title, onRemove, children }: ItemCardProps) {
  return (
    <Card className="relative border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 bg-white group">
      <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-md">
        {index + 1}
      </div>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          <Button
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors -mt-1 -mr-2 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
