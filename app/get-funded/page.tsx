import React from 'react';
import { CheckCircle, Star } from 'lucide-react';

// Assume UI Primitives exist
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(components)/ui/card';
import { Checkbox } from '@/app/(components)/ui/checkbox'; 
import { Button } from '@/app/(components)/ui/button';

// 5. Paste the copied HTML code between the backticks below, replacing the empty string.
const googleFormEmbedCode = `<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSf9GxTxGZEv0JBpj13tERu1wfiBqyvz5mbSFgvl84ZuaRvT5A/viewform?embedded=true" width="640" height="2160" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`; // <-- PASTE GOOGLE FORM IFRAME CODE HERE

export default function GetFundedPage() {

  // Adjust iframe width and height for responsiveness
  // Use Tailwind classes for width and maintain aspect ratio or set a specific height
  const adjustedEmbedCode = googleFormEmbedCode
    .replace('width="640"', 'width="100%"') // Make width responsive
    .replace('height="2160"', 'style="min-height: 1200px; height: 80vh;"'); // Adjust height

  return (
    <div className="container mx-auto px-4">

      {/* Google Form Embed Section */}
      <section className="bg-white p-1 sm:p-2 md:p-4 rounded-lg shadow-md overflow-hidden">
        {adjustedEmbedCode ? (
          // Render the raw HTML embed code provided by Google Forms
          // Using dangerouslySetInnerHTML is necessary for rendering external iframe embed code.
          // Ensure the source of the embed code is trusted (i.e., Google Forms).
          <div 
            dangerouslySetInnerHTML={{ __html: adjustedEmbedCode }} 
          />
        ) : (
          // Fallback message if code is somehow missing
          <p className="text-center text-gray-500 py-10">
            Application form embed code is missing.
          </p>
        )}
      </section>
    </div>
  );
}
