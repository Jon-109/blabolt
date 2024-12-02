"use client";

import React from 'react';
import { FileCheck } from 'lucide-react';

const DownloadButton = () => {
  const handleDownload = () => {
    // Create a link to the PDF and trigger download
    const link = document.createElement('a');
    link.href = '/assets/pdf/Guide_5CsofCredit.pdf';
    link.download = 'Guide_5CsofCredit.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      className="text-sm px-4 py-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors inline-flex items-center"
      onClick={handleDownload}
    >
      <FileCheck className="w-4 h-4 mr-2" />
      Download 5 C's Guide
    </button>
  );
};

export default DownloadButton; 