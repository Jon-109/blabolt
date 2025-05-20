export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ReportPreviewPageContent from './ReportPreviewPageContent';

export default function ReportPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ReportPreviewPageContent />
    </Suspense>
  );
}
