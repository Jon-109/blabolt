import React, { useState } from 'react';
import { supabase } from '@/supabase/helpers/client';

interface DownloadButtonProps {
  analysisId: string;
  type: 'full' | 'summary';
  children?: React.ReactNode;
  className?: string;
  ready?: boolean; // Optional: for future use if you want to indicate pre-generated
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ analysisId, type, children, className, ready }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Get the user's Supabase access token
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      if (!accessToken) {
        alert('You must be logged in to download the PDF.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, type, accessToken }),
        credentials: 'include',
      });
      if (!res.ok) {
        let errorMessage = 'Failed to generate PDF';
        try {
          const errorData = await res.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = `Failed to generate PDF (${res.status}: ${res.statusText})`;
        }
        console.error('PDF generation failed:', errorMessage);
        alert(errorMessage);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'report.pdf';
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('PDF generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleDownload}
        className={className || 'px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700'}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <span>
            <svg
              className="inline w-4 h-4 mr-2 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            Downloading...
          </span>
        ) : (
          children || 'Download PDF'
        )}
      </button>
      {loading && (
        <div className="mt-2 text-xs text-gray-600 text-center">
          Please wait 3–5 seconds for the download to complete.
        </div>
      )}
    </div>
  );
};

export default DownloadButton;
